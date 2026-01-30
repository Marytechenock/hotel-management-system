'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Star,
  Crown,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Car,
  UtensilsCrossed,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { LoyaltyService, DEFAULT_LOYALTY_CONFIG } from '@/lib/loyalty'
import type { Guest, LoyaltyTier } from '@/lib/types'
import { GuestRegistrationForm } from '@/components/guest-registration-form'
import { format } from 'date-fns'

const ITEMS_PER_PAGE = 10

const loyaltyColors = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-slate-100 text-slate-800 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-primary/10 text-primary border-primary/20',
}

export default function GuestsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [loyaltyFilter, setLoyaltyFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isNewGuestOpen, setIsNewGuestOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch guests on component mount
 // Fetch guests on component mount
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/guests')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Ensure data is an array
        if (Array.isArray(data.data)) {
          setGuests(data.data)
        } else {
          console.error('API did not return an array:', data)
          setGuests([])
        }
      } catch (error) {
        console.error('Error fetching guests:', error)
        setGuests([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchGuests()
  }, [])

  // Debug: Log guests state to see what's happening
  useEffect(() => {
    console.log('Guests state:', guests, 'Type:', typeof guests, 'Is array?', Array.isArray(guests))
  }, [guests])

  const filteredGuests = useMemo(() => {
    // Ensure guests is an array before proceeding
    if (!Array.isArray(guests)) {
      console.error('guests is not an array:', guests)
      return []
    }
    
    let result = [...guests]
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(g => {
        // Check if g has the expected properties
        if (!g || typeof g !== 'object') return false
        
        const name = g.firstName || ''
        const email = g.email || ''
        const phone = g.cellphone || ''
        
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          phone.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }
    
    // Apply loyalty tier filter
    if (loyaltyFilter !== 'all') {
      result = result.filter(g => {
        if (!g || typeof g !== 'object') return false
        return g.loyaltyTier?.id === loyaltyFilter
      })
    }
    
    return result
  }, [searchQuery, loyaltyFilter, guests])

  // Refresh guests list
  const refreshGuests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/guests')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (Array.isArray(data.data)) {
        setGuests(data.data)
      } else {
        console.error('API did not return an array:', data)
        setGuests([])
      }
    } catch (error) {
      console.error('Error fetching guests:', error)
      setGuests([])
    } finally {
      setIsLoading(false)
    }
  }

  // Delete guest function
  const handleDeleteGuest = async () => {
    if (!selectedGuest) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/guests/${selectedGuest.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete guest')
      }
      
      toast({
        title: 'Guest deleted',
        description: `${selectedGuest.firstName} ${selectedGuest.surname} has been removed.`,
      })
      
      setIsDeleteOpen(false)
      setSelectedGuest(null)
      await refreshGuests()
    } catch (error) {
      console.error('Error deleting guest:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete guest. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle edit guest
  const handleEditGuest = (guest: Guest) => {
    setSelectedGuest(guest)
    setIsEditOpen(true)
  }

  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE)
  const paginatedGuests = filteredGuests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = useMemo(() => {
    // Ensure guests is an array before proceeding
    if (!Array.isArray(guests)) {
      return {
        total: 0,
        platinum: 0,
        gold: 0,
        newThisMonth: 0,
      }
    }
    
    const now = new Date()
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    
    return {
      total: guests.length,
      platinum: guests.filter(g => g.loyaltyTier?.id === 'platinum').length,
      gold: guests.filter(g => g.loyaltyTier?.id === 'gold').length,
      newThisMonth: guests.filter(g => {
        if (!g || !g.createdAt) return false
        try {
          const createdDate = new Date(g.createdAt)
          const currentMonth = new Date()
          return (
            createdDate.getMonth() === currentMonth.getMonth() &&
            createdDate.getFullYear() === currentMonth.getFullYear()
          )
        } catch {
          return false
        }
      }).length,
    }
  }, [guests])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Guest Management</h1>
          <p className="text-muted-foreground">Manage guest profiles and loyalty program</p>
        </div>
        <Dialog open={isNewGuestOpen} onOpenChange={setIsNewGuestOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Guest Registration Form</DialogTitle>
              <DialogDescription>
                Register a new guest or search for existing guest records
              </DialogDescription>
            </DialogHeader>
            <GuestRegistrationForm onClose={() => setIsNewGuestOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Guests</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Crown className="size-3 text-primary" />
              Platinum Members
            </CardDescription>
            <CardTitle className="text-3xl">{stats.platinum}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Star className="size-3 text-yellow-500" />
              Gold Members
            </CardDescription>
            <CardTitle className="text-3xl">{stats.gold}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New This Month</CardDescription>
            <CardTitle className="text-3xl">{stats.newThisMonth}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, or ID/Passport..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <Select value={loyaltyFilter} onValueChange={(v) => { setLoyaltyFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Loyalty Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="mr-2 size-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guest Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Current Stay</TableHead>
              <TableHead>Loyalty</TableHead>
              <TableHead>Total Stays</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGuests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {guest.firstName[0]}{guest.surname[0]}
                    </div>
                    <div>
                      <p className="font-medium">{guest.title} {guest.firstName} {guest.surname}</p>
                      <p className="text-xs text-muted-foreground">{guest.nationality} - {guest.idPassportNumber}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="size-3 text-muted-foreground" />
                      {guest.email}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="size-3" />
                      {guest.cellphone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Room {guest.roomNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(guest.dateIn), 'yyyy-MM-dd')} - {format(new Date(guest.dateOut), 'yyyy-MM-dd')}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {(() => {
                    const tier = guest.loyaltyTier
                    if (!tier) {
                      return (
                        <div>
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                            <span className="capitalize">Standard</span>
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{guest.loyaltyPoints.toLocaleString()} pts</p>
                        </div>
                      )
                    }
                    return (
                      <div>
                        <Badge variant="outline" style={{
                          backgroundColor: `${tier.color}20`,
                          color: tier.color,
                          borderColor: tier.color
                        }}>
                          {tier.id === 'platinum' && <Crown className="mr-1 size-3" />}
                          {tier.id === 'gold' && <Star className="mr-1 size-3" />}
                          <span className="capitalize">{tier.name}</span>
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{guest.loyaltyPoints.toLocaleString()} pts</p>
                      </div>
                    )
                  })()}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{guest.totalStays}</span>
                  <span className="text-muted-foreground"> stays</span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedGuest(guest); setIsDetailOpen(true) }}>
                        <Eye className="mr-2 size-4" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditGuest(guest)}>
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => { setSelectedGuest(guest); setIsDeleteOpen(true) }}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredGuests.length)} of {filteredGuests.length} guests
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

      {/* Guest Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guest Profile</DialogTitle>
          </DialogHeader>
          {selectedGuest && <GuestDetailView guest={selectedGuest} />}
        </DialogContent>
      </Dialog>

      {/* Edit Guest Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Guest</DialogTitle>
            <DialogDescription>
              Update guest information and preferences
            </DialogDescription>
          </DialogHeader>
          {selectedGuest && (
            <GuestRegistrationForm 
              guest={selectedGuest}
              onClose={() => setIsEditOpen(false)} 
              onSuccess={async () => {
                setIsEditOpen(false)
                await refreshGuests()
                toast({
                  title: 'Guest updated',
                  description: `${selectedGuest.firstName} ${selectedGuest.surname} has been updated.`,
                })
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the guest record for
              {selectedGuest && ` ${selectedGuest.firstName} ${selectedGuest.surname}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGuest}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function GuestDetailView({ guest }: { guest: Guest }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {guest.firstName[0]}{guest.surname[0]}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{guest.title} {guest.firstName} {guest.surname}</h3>
          <p className="text-muted-foreground">{guest.nationality}</p>
          <div className="flex items-center gap-2 mt-1">
            {(() => {
              const tier = guest.loyaltyTier
              if (!tier) {
                return (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                    <span className="capitalize">Standard</span>
                  </Badge>
                )
              }
              return (
                <Badge variant="outline" style={{
                  backgroundColor: `${tier.color}20`,
                  color: tier.color,
                  borderColor: tier.color
                }}>
                  {tier.id === 'platinum' && <Crown className="mr-1 size-3" />}
                  <span className="capitalize">{tier.name}</span>
                </Badge>
              )
            })()}
            {guest.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Loyalty Points</p>
            <p className="text-2xl font-bold">{guest.loyaltyPoints.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Stays</p>
            <p className="text-2xl font-bold">{guest.totalStays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">${guest.totalSpent.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Stay */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Users className="size-4" />
          Current Stay
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
          <div>
            <p className="text-muted-foreground">Room Number</p>
            <p className="font-medium">{guest.roomNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Party Size</p>
            <p className="font-medium">
              {guest.numberOfAdults} Adult{guest.numberOfAdults > 1 ? 's' : ''}
              {guest.numberOfChildren > 0 && `, ${guest.numberOfChildren} Child${guest.numberOfChildren > 1 ? 'ren' : ''}`}
              {guest.childrenAges.length > 0 && ` (Ages: ${guest.childrenAges.join(', ')})`}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Check In</p>
            <p className="font-medium">{new Date(guest.dateIn).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Check Out</p>
            <p className="font-medium">{new Date(guest.dateOut).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Account Payable By</p>
            <p className="font-medium">{guest.accountPayableBy}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Breakfast Time</p>
            <p className="font-medium">{guest.breakfastTime || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Other Adult */}
      {guest.otherAdult && (
        <div>
          <h4 className="font-medium mb-3">Accompanying Adult</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p>{guest.otherAdult.firstName} {guest.otherAdult.surname}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Nationality</p>
              <p>{guest.otherAdult.nationality}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">ID/Passport</p>
              <p>{guest.otherAdult.idPassportNumber}</p>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Contact Info */}
      <div>
        <h4 className="font-medium mb-3">Contact Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Email</p>
            <p>{guest.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cellphone</p>
            <p>{guest.cellphone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Home Phone</p>
            <p>{guest.telHome || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Business Phone</p>
            <p>{guest.telBusiness || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ID/Passport Number</p>
            <p>{guest.idPassportNumber}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Address */}
      <div>
        <h4 className="font-medium mb-3">Address</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Postal Address</p>
            <p>{guest.postalAddress || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Residential Address</p>
            <p>{guest.residentialAddress}</p>
          </div>
          <div>
            <p className="text-muted-foreground">City</p>
            <p>{guest.city}</p>
          </div>
          <div>
            <p className="text-muted-foreground">State/Province</p>
            <p>{guest.stateProvince}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Country</p>
            <p>{guest.country}</p>
          </div>
        </div>
      </div>

      {/* Vehicle */}
      {guest.vehicleRegNo && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Car className="size-4" />
              Vehicle
            </h4>
            <p className="text-sm">{guest.vehicleRegNo}</p>
          </div>
        </>
      )}

      <Separator />

      {/* Food Preferences */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <UtensilsCrossed className="size-4" />
          Food Preferences
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Beef</p>
            <p>{guest.preferences.beef ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pork</p>
            <p>{guest.preferences.pork ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Egg Style</p>
            <p className="capitalize">{guest.preferences.eggStyle || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Serve Dinner</p>
            <p>{guest.serveDinner ? 'Yes' : 'No'}</p>
          </div>
          {guest.preferences.dietaryRestrictions && guest.preferences.dietaryRestrictions.length > 0 && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Dietary Restrictions</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {guest.preferences.dietaryRestrictions.map(restriction => (
                  <Badge key={restriction} variant="outline" className="text-xs">{restriction}</Badge>
                ))}
              </div>
            </div>
          )}
          {guest.preferences.specialRequests && guest.preferences.specialRequests.length > 0 && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Special Requests</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {guest.preferences.specialRequests.map(request => (
                  <Badge key={request} variant="secondary" className="text-xs">{request}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
