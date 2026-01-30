'use client'

import React from "react"

import { useState, useMemo } from 'react'
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
import { bookings, guests, rooms, getGuestById } from '@/lib/mock-data'
import { useAppStore } from '@/lib/store'
import type { Booking, BookingStatus, BookingSource } from '@/lib/types'

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
  const { currentProperty } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredBookings = useMemo(() => {
    let result = currentProperty 
      ? bookings.filter(b => b.propertyId === currentProperty.id)
      : bookings

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(b => {
        const guest = getGuestById(b.guestId)
        return guest && (
          guest.firstName.toLowerCase().includes(query) ||
          guest.surname.toLowerCase().includes(query) ||
          guest.email.toLowerCase().includes(query)
        )
      })
    }

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter)
    }

    if (sourceFilter !== 'all') {
      result = result.filter(b => b.source === sourceFilter)
    }

    return result.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
  }, [currentProperty, searchQuery, statusFilter, sourceFilter])

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

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
  }, [currentProperty])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getRoomNumber = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    return room?.number || 'N/A'
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
          <p className="text-muted-foreground">
            Manage reservations for {currentProperty?.name || 'all properties'}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          New Booking
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className={statusFilter === 'confirmed' ? 'ring-2 ring-primary' : ''}>
          <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'confirmed' ? 'all' : 'confirmed')}>
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <p className="text-2xl font-bold text-primary">{stats.confirmed}</p>
          </CardContent>
        </Card>
        <Card className={statusFilter === 'checked_in' ? 'ring-2 ring-success' : ''}>
          <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'checked_in' ? 'all' : 'checked_in')}>
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
            {paginatedBookings.map((booking) => {
              const guest = getGuestById(booking.guestId)
              const config = statusConfig[booking.status]
              
              return (
                <TableRow key={booking.id}>
                  <TableCell>
                    {guest && (
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {guest.firstName[0]}{guest.surname[0]}
                        </div>
                        <div>
                          <p className="font-medium">{guest.firstName} {guest.surname}</p>
                          <p className="text-xs text-muted-foreground">{booking.adults} adult{booking.adults > 1 ? 's' : ''}{booking.children > 0 ? `, ${booking.children} child${booking.children > 1 ? 'ren' : ''}` : ''}</p>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getRoomNumber(booking.roomId)}</Badge>
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
                    <Badge variant="outline" className={config.color}>
                      {config.icon}
                      <span className="ml-1">{config.label}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{sourceLabels[booking.source]}</span>
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 size-4" />
                          Edit Booking
                        </DropdownMenuItem>
                        {booking.status === 'confirmed' && (
                          <DropdownMenuItem>
                            <LogIn className="mr-2 size-4" />
                            Check In
                          </DropdownMenuItem>
                        )}
                        {booking.status === 'checked_in' && (
                          <DropdownMenuItem>
                            <LogOut className="mr-2 size-4" />
                            Check Out
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <XCircle className="mr-2 size-4" />
                          Cancel Booking
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of {filteredBookings.length} bookings
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
