// app/dashboard/bookings/page.tsx (updated version)
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Plus,
  Filter,
  Calendar,
  MoreHorizontal,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  Clock,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BookingForm } from '@/components/booking-form'
import { BookingDetails } from '@/components/booking-details'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import type { Booking, BookingStatus, BookingSource } from '@/lib/types'

// Extended type for API response with included relations
type BookingWithRelations = Booking & {
  guest?: {
    id: string
    firstName: string
    surname: string
    email: string
    cellphone?: string
  }
  room?: {
    id: string
    number: string
    type: string
    floor: number
  }
  property?: {
    id: string
    name: string
  }
}

const ITEMS_PER_PAGE = 10

const statusConfig: Record<BookingStatus, { color: string; icon: React.ReactNode; label: string }> = {
  confirmed: {
    color: 'bg-primary/10 text-primary border-primary/30',
    icon: <CheckCircle className="size-3" />,
    label: 'Confirmed',
  },
  checked_in: {
    color: 'bg-success/10 text-success border-success/30',
    icon: <LogIn className="size-3" />,
    label: 'Checked In',
  },
  checked_out: {
    color: 'bg-muted text-muted-foreground border-muted',
    icon: <LogOut className="size-3" />,
    label: 'Checked Out',
  },
  cancelled: {
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    icon: <XCircle className="size-3" />,
    label: 'Cancelled',
  },
  no_show: {
    color: 'bg-warning/20 text-warning-foreground border-warning/30',
    icon: <Clock className="size-3" />,
    label: 'No Show',
  },
}

const sourceLabels: Record<BookingSource, string> = {
  direct: 'Direct',
  'booking.com': 'Booking.com',
  expedia: 'Expedia',
  airbnb: 'Airbnb',
  phone: 'Phone',
  walk_in: 'Walk-in',
}

export default function BookingsPage() {
  const { toast } = useToast()
  const { currentProperty } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [bookings, setBookings] = useState<BookingWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingBooking, setEditingBooking] = useState<BookingWithRelations | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PER_PAGE, total: 0 })

  // Fetch bookings from API
  const fetchBookings = async () => {
    if (!currentProperty?.id) {
      setBookings([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append('propertyId', currentProperty.id)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (sourceFilter && sourceFilter !== 'all') params.append('source', sourceFilter)
      if (searchQuery) params.append('q', searchQuery)

      const response = await fetch(`/api/bookings?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch bookings')

      const data = await response.json()
      setBookings(data.data || [])
      setPagination(prev => ({ ...prev, total: data.total || 0 }))
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch bookings when dependencies change
  useEffect(() => {
    fetchBookings()
  }, [currentProperty?.id, statusFilter, sourceFilter, searchQuery, pagination.page])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [statusFilter, sourceFilter, searchQuery])

  // Handle booking creation
  const handleCreateBooking = async (bookingData: Partial<Booking>) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          propertyId: currentProperty?.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create booking')
      }

      toast({
        title: 'Booking created',
        description: 'New booking has been created successfully.',
      })

      setIsCreateOpen(false)
      await fetchBookings()
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Handle booking editing
  const handleEditBooking = async (bookingData: Partial<Booking>) => {
    if (!editingBooking) return

    setIsEditing(true)
    try {
      const response = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) throw new Error('Failed to update booking')

      toast({
        title: 'Booking updated',
        description: 'Booking has been updated successfully.',
      })

      setIsEditOpen(false)
      setEditingBooking(null)
      await fetchBookings()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast({
        title: 'Error',
        description: 'Failed to update booking',
        variant: 'destructive',
      })
    } finally {
      setIsEditing(false)
    }
  }

  // Handle booking deletion
  const handleDeleteBooking = async () => {
    if (!selectedBooking) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete booking')

      toast({
        title: 'Booking deleted',
        description: 'Booking has been removed.',
      })

      setIsDeleteOpen(false)
      setSelectedBooking(null)
      await fetchBookings()
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete booking',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle booking status updates
  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update booking status')

      toast({
        title: 'Booking updated',
        description: `Booking status changed to ${statusConfig[newStatus]?.label || newStatus}`,
      })

      await fetchBookings()
    } catch (error) {
      console.error('Error updating booking status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const stats = useMemo(() => {
    const propertyBookings = currentProperty
        ? bookings.filter(b => b.propertyId === currentProperty.id)
        : bookings

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return {
      total: propertyBookings.length,
      confirmed: propertyBookings.filter(b => b.status === 'confirmed').length,
      checkedIn: propertyBookings.filter(b => b.status === 'checked_in').length,
      arrivingToday: propertyBookings.filter(b => {
        const checkIn = new Date(b.checkIn)
        checkIn.setHours(0, 0, 0, 0)
        return checkIn.getTime() === today.getTime() && b.status === 'confirmed'
      }).length,
      departingToday: propertyBookings.filter(b => {
        const checkOut = new Date(b.checkOut)
        checkOut.setHours(0, 0, 0, 0)
        return checkOut.getTime() === today.getTime() && b.status === 'checked_in'
      }).length,
    }
  }, [currentProperty, bookings])

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getGuestName = (booking: BookingWithRelations) => {
    if (booking.guest) {
      return `${booking.guest.firstName} ${booking.guest.surname}`
    }
    return 'Guest not found'
  }

  const getRoomNumber = (booking: BookingWithRelations) => {
    return booking.room?.number || 'N/A'
  }

  // Show no property selected state
  if (!currentProperty) {
    return (
        <div className="p-6">
          <Card className="p-12 text-center">
            <Calendar className="mx-auto size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Property Selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a property from the sidebar to manage its bookings.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/properties'}>
              Go to Properties
            </Button>
          </Card>
        </div>
    )
  }

  return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
            <p className="text-muted-foreground">
              Manage reservations for {currentProperty?.name}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Booking
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && bookings.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading bookings...</span>
            </div>
        ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-5 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card className={`cursor-pointer ${statusFilter === 'confirmed' ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`} onClick={() => setStatusFilter(statusFilter === 'confirmed' ? 'all' : 'confirmed')}>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                    <p className="text-2xl font-bold text-primary">{stats.confirmed}</p>
                  </CardContent>
                </Card>
                <Card className={`cursor-pointer ${statusFilter === 'checked_in' ? 'ring-2 ring-success' : 'hover:bg-accent/50'}`} onClick={() => setStatusFilter(statusFilter === 'checked_in' ? 'all' : 'checked_in')}>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Checked In</p>
                    <p className="text-2xl font-bold text-success">{stats.checkedIn}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Arriving Today</p>
                    <p className="text-2xl font-bold">{stats.arrivingToday}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Departing Today</p>
                    <p className="text-2xl font-bold">{stats.departingToday}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                          placeholder="Search by guest name or email..."
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                          className="pl-9"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="checked_in">Checked In</SelectItem>
                        <SelectItem value="checked_out">Checked Out</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setCurrentPage(1) }}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="booking.com">Booking.com</SelectItem>
                        <SelectItem value="expedia">Expedia</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="walk_in">Walk-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Bookings Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No bookings found for this property
                          </TableCell>
                        </TableRow>
                    ) : (
                        bookings.map((booking) => {
                          const config = statusConfig[booking.status]

                          return (
                              <TableRow key={booking.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                      {booking.guest ? `${booking.guest.firstName[0]}${booking.guest.surname[0]}` : '?'}
                                    </div>
                                    <div>
                                      <p className="font-medium">{getGuestName(booking)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {booking.adults} adult{booking.adults > 1 ? 's' : ''}
                                        {booking.children > 0 ? `, ${booking.children} child${booking.children > 1 ? 'ren' : ''}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{getRoomNumber(booking)}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="size-3 text-muted-foreground" />
                                    {formatDate(booking.checkIn)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="size-3 text-muted-foreground" />
                                    {formatDate(booking.checkOut)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={config?.color || 'bg-muted'}>
                                    {config?.icon}
                                    <span className="ml-1">{config?.label || booking.status}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{sourceLabels[booking.source] || booking.source}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div>
                                    <p className="font-medium">${booking.totalAmount.toLocaleString()}</p>
                                    {booking.paidAmount < booking.totalAmount && (
                                        <p className="text-xs text-muted-foreground">
                                          Paid: ${booking.paidAmount.toLocaleString()}
                                        </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedBooking(booking)
                                        setIsViewOpen(true)
                                      }}>
                                        <Eye className="mr-2 size-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setEditingBooking(booking)
                                        setIsEditOpen(true)
                                      }}>
                                        <Pencil className="mr-2 size-4" />
                                        Edit Booking
                                      </DropdownMenuItem>
                                      {booking.status === 'confirmed' && (
                                          <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'checked_in')}>
                                            <LogIn className="mr-2 size-4" />
                                            Check In
                                          </DropdownMenuItem>
                                      )}
                                      {booking.status === 'checked_in' && (
                                          <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'checked_out')}>
                                            <LogOut className="mr-2 size-4" />
                                            Check Out
                                          </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => {
                                            setSelectedBooking(booking)
                                            setIsDeleteOpen(true)
                                          }}
                                      >
                                        <Trash2 className="mr-2 size-4" />
                                        Delete Booking
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                          )
                        })
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.total > pagination.limit && (
                    <div className="flex items-center justify-between border-t px-4 py-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm">
                    Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                )}
              </Card>
            </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the booking
                {selectedBooking && ` for ${getGuestName(selectedBooking)}`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleDeleteBooking}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Booking Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Booking</DialogTitle>
              <DialogDescription>
                Create a new booking for {currentProperty?.name}.
              </DialogDescription>
            </DialogHeader>
            <BookingForm
                onSubmit={handleCreateBooking}
                onCancel={() => setIsCreateOpen(false)}
                isSubmitting={isCreating}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Booking Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>
                Update booking details.
              </DialogDescription>
            </DialogHeader>
            <BookingForm
                onSubmit={handleEditBooking}
                onCancel={() => {
                  setIsEditOpen(false)
                  setEditingBooking(null)
                }}
                isSubmitting={isEditing}
                booking={editingBooking || undefined}
            />
          </DialogContent>
        </Dialog>

        {/* View Booking Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                View complete booking information.
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
                <BookingDetails booking={selectedBooking} />
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}