'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  BedDouble,
  Globe,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  Search,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import type { Property } from '@/lib/types'

interface PropertyStats {
  occupancyRate: number
  totalRevenue: number
  guestsInHouse: number
  totalRooms: number
  occupiedRooms: number
  totalBookings: number
  availableRooms: number
}

export default function PropertiesPage() {
  const { setCurrentProperty } = useAppStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [propertyStats, setPropertyStats] = useState<Record<string, PropertyStats>>({})
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const { toast } = useToast()

  useEffect(() => {
    fetchProperties()
  }, [searchQuery, pagination.page])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const url = new URL('/api/properties', window.location.origin)
      url.searchParams.set('page', pagination.page.toString())
      url.searchParams.set('limit', pagination.limit.toString())
      if (searchQuery) url.searchParams.set('q', searchQuery)

      const response = await fetch(url.toString())
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setProperties(data.data)
      setPagination({ ...pagination, total: data.total })

      // Fetch stats for each property
      data.data.forEach((property: Property) => {
        fetchPropertyStats(property.id)
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPropertyStats = async (propertyId: string) => {
    setLoadingStats(prev => ({ ...prev, [propertyId]: true }))
    try {
      // Fetch bookings for this property
      const bookingsUrl = new URL('/api/bookings', window.location.origin)
      bookingsUrl.searchParams.set('propertyId', propertyId)
      bookingsUrl.searchParams.set('limit', '1000')

      const response = await fetch(bookingsUrl.toString())
      if (!response.ok) throw new Error('Failed to fetch bookings')
      const data = await response.json()

      const bookings = data.data || []

      // Fetch rooms for this property
      const roomsUrl = new URL('/api/rooms', window.location.origin)
      roomsUrl.searchParams.set('propertyId', propertyId)
      roomsUrl.searchParams.set('limit', '1000')

      const roomsResponse = await fetch(roomsUrl.toString())
      if (!roomsResponse.ok) throw new Error('Failed to fetch rooms')
      const roomsData = await roomsResponse.json()
      const rooms = roomsData.data || []

      // Calculate stats
      const totalRooms = rooms.length
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Count occupied rooms (checked_in status for today)
      const occupiedRooms = bookings.filter((b: any) => {
        const checkIn = new Date(b.checkIn)
        checkIn.setHours(0, 0, 0, 0)
        const checkOut = new Date(b.checkOut)
        checkOut.setHours(0, 0, 0, 0)
        return b.status === 'checked_in' ||
            (b.status === 'confirmed' && checkIn <= today && checkOut > today)
      }).length

      // Count active guests
      const guestsInHouse = bookings.filter((b: any) => {
        const checkIn = new Date(b.checkIn)
        checkIn.setHours(0, 0, 0, 0)
        const checkOut = new Date(b.checkOut)
        checkOut.setHours(0, 0, 0, 0)
        return (b.status === 'checked_in' || b.status === 'confirmed') &&
            checkIn <= today && checkOut > today
      }).reduce((sum: number, b: any) => sum + (b.adults || 0) + (b.children || 0), 0)

      // Calculate occupancy rate
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

      // Calculate total revenue (sum of all confirmed and checked_in bookings)
      const totalRevenue = bookings
          .filter((b: any) => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out')
          .reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0)

      const availableRooms = totalRooms - occupiedRooms

      setPropertyStats(prev => ({
        ...prev,
        [propertyId]: {
          occupancyRate,
          totalRevenue,
          guestsInHouse,
          totalRooms,
          occupiedRooms,
          availableRooms,
          totalBookings: bookings.length
        }
      }))
    } catch (error) {
      console.error(`Error fetching stats for property ${propertyId}:`, error)
      // Set default stats on error
      setPropertyStats(prev => ({
        ...prev,
        [propertyId]: {
          occupancyRate: 0,
          totalRevenue: 0,
          guestsInHouse: 0,
          totalRooms: 0,
          occupiedRooms: 0,
          availableRooms: 0,
          totalBookings: 0
        }
      }))
    } finally {
      setLoadingStats(prev => ({ ...prev, [propertyId]: false }))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property? This will also delete all associated rooms and bookings.')) return

    try {
      const response = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')

      toast({
        title: 'Success',
        description: 'Property deleted successfully',
      })

      fetchProperties()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete property',
        variant: 'destructive',
      })
    }
  }

  if (loading && properties.length === 0) {
    return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">Loading properties...</div>
        </div>
    )
  }

  return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Property Management</h1>
            <p className="text-muted-foreground">Manage your hotel properties and locations</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Property
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                placeholder="Search properties by name, code, city, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
            )}
          </div>
          <Button variant="outline" onClick={fetchProperties}>
            Refresh
          </Button>
        </div>

        {/* Property Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const stats = propertyStats[property.id] || {
              occupancyRate: 0,
              totalRevenue: 0,
              guestsInHouse: 0,
              totalRooms: 0,
              occupiedRooms: 0,
              availableRooms: 0,
              totalBookings: 0
            }
            const isLoadingStats = loadingStats[property.id]

            return (
                <Card key={property.id} className="overflow-hidden">
                  <div className="h-2 bg-primary" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="size-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{property.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {property.city}, {property.country}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedProperty(property); setIsDetailOpen(true) }}>
                            <Eye className="mr-2 size-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedProperty(property); setIsEditDialogOpen(true) }}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCurrentProperty(property)}>
                            <Building2 className="mr-2 size-4" />
                            Switch to Property
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(property.id)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingStats ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-pulse text-sm text-muted-foreground">Loading stats...</div>
                        </div>
                    ) : (
                        <>
                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 rounded-md bg-muted/50">
                              <div className="flex items-center justify-center gap-1 text-lg font-bold">
                                <TrendingUp className="size-4 text-success" />
                                {stats.occupancyRate.toFixed(0)}%
                              </div>
                              <p className="text-xs text-muted-foreground">Occupancy</p>
                            </div>
                            <div className="text-center p-2 rounded-md bg-muted/50">
                              <div className="flex items-center justify-center gap-1 text-lg font-bold">
                                <Users className="size-4 text-primary" />
                                {stats.guestsInHouse}
                              </div>
                              <p className="text-xs text-muted-foreground">Guests</p>
                            </div>
                            <div className="text-center p-2 rounded-md bg-muted/50">
                              <div className="flex items-center justify-center gap-1 text-lg font-bold">
                                <BedDouble className="size-4 text-accent" />
                                {stats.totalRooms}
                              </div>
                              <p className="text-xs text-muted-foreground">Rooms</p>
                            </div>
                          </div>


                          {/* Revenue */}
                          <div className="flex items-center justify-between text-sm border-t pt-2">
                            <span className="text-muted-foreground">Revenue</span>
                            <span className="font-medium">
                        ${stats.totalRevenue.toLocaleString()}
                      </span>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="size-3 text-muted-foreground" />
                              <span>{property.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="size-3 text-muted-foreground" />
                              <span className="truncate">{property.email}</span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-transparent"
                                onClick={() => setCurrentProperty(property)}
                            >
                              Switch to Property
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => { setSelectedProperty(property); setIsDetailOpen(true) }}
                            >
                              View Details
                            </Button>
                          </div>
                        </>
                    )}
                  </CardContent>
                </Card>
            )
          })}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                  variant="outline"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
              <Button
                  variant="outline"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              >
                Next
              </Button>
            </div>
        )}

        {/* Add Property Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Add a new hotel property to your management system
              </DialogDescription>
            </DialogHeader>
            <PropertyForm
                onSuccess={() => {
                  setIsAddDialogOpen(false)
                  fetchProperties()
                }}
                onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Property Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>
                Update property information
              </DialogDescription>
            </DialogHeader>
            {selectedProperty && (
                <PropertyForm
                    property={selectedProperty}
                    onSuccess={() => {
                      setIsEditDialogOpen(false)
                      fetchProperties()
                    }}
                    onCancel={() => setIsEditDialogOpen(false)}
                />
            )}
          </DialogContent>
        </Dialog>

        {/* Property Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Property Details</DialogTitle>
            </DialogHeader>
            {selectedProperty && <PropertyDetail property={selectedProperty} />}
          </DialogContent>
        </Dialog>
      </div>
  )
}

function PropertyForm({ property, onSuccess, onCancel }: { property?: Property; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: property?.name || '',
    code: property?.code || '',
    address: property?.address || '',
    city: property?.city || '',
    country: property?.country || '',
    phone: property?.phone || '',
    email: property?.email || '',
    totalRooms: property?.totalRooms?.toString() || '',
    currency: property?.currency || 'USD',
    timezone: property?.timezone || 'America/New_York'
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = property ? `/api/properties/${property.id}` : '/api/properties'
      const method = property ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          totalRooms: parseInt(formData.totalRooms),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save property')
      }

      toast({
        title: 'Success',
        description: `Property ${property ? 'updated' : 'added'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save property',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name *</Label>
            <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Grand Plaza Hotel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Property Code *</Label>
            <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="GPH"
                maxLength={10}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="New York"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
                id="country"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="USA"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (212) 555-0100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@hotel.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalRooms">Total Rooms *</Label>
            <Input
                id="totalRooms"
                type="number"
                required
                value={formData.totalRooms}
                onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                placeholder="USD"
                maxLength={3}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              placeholder="America/New_York"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (property ? 'Updating...' : 'Adding...') : (property ? 'Update Property' : 'Add Property')}
          </Button>
        </div>
      </form>
  )
}

function PropertyDetail({ property }: { property: Property }) {
  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="size-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{property.name}</h3>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3" />
              {property.address}, {property.city}, {property.country}
            </p>
            <Badge variant="outline" className="mt-1">{property.code}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Rooms</p>
              <p className="text-2xl font-bold">{property.totalRooms}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="text-2xl font-bold">{property.currency}</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h4 className="font-medium mb-2">Contact Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              {property.phone}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              {property.email}
            </div>
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              {property.timezone}
            </div>
          </div>
        </div>
      </div>
  )
}