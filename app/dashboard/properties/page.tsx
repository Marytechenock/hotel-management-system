'use client'

import { useState } from 'react'
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
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { properties, rooms, bookings } from '@/lib/mock-data'
import { useAppStore } from '@/lib/store'
import type { Property } from '@/lib/types'

export default function PropertiesPage() {
  const { setCurrentProperty } = useAppStore()
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const getPropertyStats = (propertyId: string) => {
    const propertyRooms = rooms.filter(r => r.propertyId === propertyId)
    const propertyBookings = bookings.filter(b => b.propertyId === propertyId)
    const occupiedRooms = propertyRooms.filter(r => r.status === 'occupied').length
    const totalRooms = propertyRooms.length
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0
    const totalRevenue = propertyBookings.reduce((sum, b) => sum + b.totalAmount, 0)
    const guestsInHouse = propertyBookings.filter(b => b.status === 'checked_in').length

    return { occupancyRate, totalRevenue, guestsInHouse, totalRooms, occupiedRooms }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Property Management</h1>
          <p className="text-muted-foreground">Manage your hotel properties and locations</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Add a new hotel property to your management system
              </DialogDescription>
            </DialogHeader>
            <PropertyForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Property Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => {
          const stats = getPropertyStats(property.id)
          
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
                      <DropdownMenuItem onClick={() => setCurrentProperty(property)}>
                        <Building2 className="mr-2 size-4" />
                        Switch to Property
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {/* Occupancy Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Room Occupancy</span>
                    <span className="font-medium">{stats.occupiedRooms}/{stats.totalRooms}</span>
                  </div>
                  <Progress value={stats.occupancyRate} className="h-2" />
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
              </CardContent>
            </Card>
          )
        })}

        {/* Add Property Card */}
        <Card className="border-dashed flex items-center justify-center min-h-[300px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-full w-full flex-col gap-2">
                <Plus className="size-8 text-muted-foreground" />
                <span className="text-muted-foreground">Add New Property</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
                <DialogDescription>
                  Add a new hotel property to your management system
                </DialogDescription>
              </DialogHeader>
              <PropertyForm />
            </DialogContent>
          </Dialog>
        </Card>
      </div>

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

function PropertyForm() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Property Name *</Label>
          <Input id="name" placeholder="Grand Plaza Hotel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Property Code *</Label>
          <Input id="code" placeholder="GPH" maxLength={5} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input id="address" placeholder="123 Main Street" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input id="city" placeholder="New York" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input id="country" placeholder="USA" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" placeholder="+1 (212) 555-0100" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" placeholder="info@hotel.com" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalRooms">Total Rooms *</Label>
          <Input id="totalRooms" type="number" placeholder="100" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" placeholder="USD" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline">Cancel</Button>
        <Button>Add Property</Button>
      </div>
    </div>
  )
}

function PropertyDetail({ property }: { property: Property }) {
  const propertyRooms = rooms.filter(r => r.propertyId === property.id)
  const propertyBookings = bookings.filter(b => b.propertyId === property.id)
  
  const roomStatusCounts = {
    available: propertyRooms.filter(r => r.status === 'available').length,
    occupied: propertyRooms.filter(r => r.status === 'occupied').length,
    cleaning: propertyRooms.filter(r => r.status === 'cleaning').length,
    maintenance: propertyRooms.filter(r => r.status === 'maintenance').length,
    reserved: propertyRooms.filter(r => r.status === 'reserved').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Rooms</p>
            <p className="text-2xl font-bold">{property.totalRooms}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Active Bookings</p>
            <p className="text-2xl font-bold">{propertyBookings.filter(b => b.status === 'checked_in').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Revenue (MTD)</p>
            <p className="text-2xl font-bold">${propertyBookings.reduce((s, b) => s + b.totalAmount, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Timezone</p>
            <p className="text-lg font-medium">{property.timezone.split('/')[1]}</p>
          </CardContent>
        </Card>
      </div>

      {/* Room Status */}
      <div>
        <h4 className="font-medium mb-3">Room Status Overview</h4>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(roomStatusCounts).map(([status, count]) => (
            <div key={status} className="text-center p-3 rounded-md bg-muted/50">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <h4 className="font-medium mb-2">Settings</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-muted-foreground" />
              Currency: {property.currency}
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Property Code: {property.code}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
