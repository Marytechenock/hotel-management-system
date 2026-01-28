'use client'

import React from "react"

import { useState, useMemo } from 'react'
import {
  BedDouble,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Pencil,
  Wrench,
  Sparkles,
  Users,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { rooms, getRoomsByProperty } from '@/lib/mock-data'
import { useAppStore } from '@/lib/store'
import type { Room, RoomStatus, RoomType } from '@/lib/types'

const statusColors: Record<RoomStatus, string> = {
  available: 'bg-success/10 text-success border-success/30',
  occupied: 'bg-primary/10 text-primary border-primary/30',
  cleaning: 'bg-warning/10 text-warning-foreground border-warning/30',
  maintenance: 'bg-destructive/10 text-destructive border-destructive/30',
  reserved: 'bg-accent/20 text-accent-foreground border-accent/30',
}

const statusIcons: Record<RoomStatus, React.ReactNode> = {
  available: <BedDouble className="size-4" />,
  occupied: <Users className="size-4" />,
  cleaning: <Sparkles className="size-4" />,
  maintenance: <Wrench className="size-4" />,
  reserved: <BedDouble className="size-4" />,
}

const typeLabels: Record<RoomType, string> = {
  standard: 'Standard',
  deluxe: 'Deluxe',
  suite: 'Suite',
  executive: 'Executive',
  penthouse: 'Penthouse',
}

export default function RoomsPage() {
  const { currentProperty } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'floor'>('grid')

  const filteredRooms = useMemo(() => {
    let result = currentProperty 
      ? getRoomsByProperty(currentProperty.id) 
      : rooms

    if (searchQuery) {
      result = result.filter(r => 
        r.number.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      result = result.filter(r => r.type === typeFilter)
    }

    return result
  }, [currentProperty, searchQuery, statusFilter, typeFilter])

  const roomsByFloor = useMemo(() => {
    const floors = new Map<number, Room[]>()
    filteredRooms.forEach(room => {
      const existing = floors.get(room.floor) || []
      floors.set(room.floor, [...existing, room])
    })
    return Array.from(floors.entries()).sort((a, b) => b[0] - a[0])
  }, [filteredRooms])

  const stats = useMemo(() => {
    const propertyRooms = currentProperty 
      ? getRoomsByProperty(currentProperty.id) 
      : rooms
    return {
      total: propertyRooms.length,
      available: propertyRooms.filter(r => r.status === 'available').length,
      occupied: propertyRooms.filter(r => r.status === 'occupied').length,
      cleaning: propertyRooms.filter(r => r.status === 'cleaning').length,
      maintenance: propertyRooms.filter(r => r.status === 'maintenance').length,
    }
  }, [currentProperty])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Room Management</h1>
          <p className="text-muted-foreground">
            Manage rooms for {currentProperty?.name || 'all properties'}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Room
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BedDouble className="size-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-colors ${statusFilter === 'available' ? 'ring-2 ring-success' : 'hover:bg-accent/50'}`} onClick={() => setStatusFilter('available')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-success">{stats.available}</p>
              </div>
              <BedDouble className="size-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-colors ${statusFilter === 'occupied' ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`} onClick={() => setStatusFilter('occupied')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold text-primary">{stats.occupied}</p>
              </div>
              <Users className="size-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-colors ${statusFilter === 'cleaning' ? 'ring-2 ring-warning' : 'hover:bg-accent/50'}`} onClick={() => setStatusFilter('cleaning')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cleaning</p>
                <p className="text-2xl font-bold text-warning-foreground">{stats.cleaning}</p>
              </div>
              <Sparkles className="size-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-colors ${statusFilter === 'maintenance' ? 'ring-2 ring-destructive' : 'hover:bg-accent/50'}`} onClick={() => setStatusFilter('maintenance')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-destructive">{stats.maintenance}</p>
              </div>
              <Wrench className="size-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by room number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Room Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deluxe">Deluxe</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'floor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('floor')}
              >
                By Floor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Grid */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {roomsByFloor.map(([floor, floorRooms]) => (
            <div key={floor}>
              <h3 className="text-lg font-semibold mb-3">Floor {floor}</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {floorRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredRooms.length === 0 && (
        <Card className="p-12 text-center">
          <BedDouble className="mx-auto size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No rooms found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  )
}

function RoomCard({ room }: { room: Room }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1 ${
        room.status === 'available' ? 'bg-success' :
        room.status === 'occupied' ? 'bg-primary' :
        room.status === 'cleaning' ? 'bg-warning' :
        room.status === 'maintenance' ? 'bg-destructive' :
        'bg-accent'
      }`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-lg font-bold">{room.number}</h4>
            <p className="text-xs text-muted-foreground">Floor {room.floor}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil className="mr-2 size-4" />
                Edit Room
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Sparkles className="mr-2 size-4" />
                Mark as Cleaning
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wrench className="mr-2 size-4" />
                Report Maintenance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className={statusColors[room.status]}>
            {statusIcons[room.status]}
            <span className="ml-1 capitalize">{room.status}</span>
          </Badge>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{typeLabels[room.type]}</span>
            <span className="font-medium flex items-center gap-1">
              <DollarSign className="size-3" />
              {room.baseRate}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" />
            Max {room.maxOccupancy} guests
          </div>
        </div>

        {room.amenities.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1">
              {room.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {amenity}
                </Badge>
              ))}
              {room.amenities.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{room.amenities.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
