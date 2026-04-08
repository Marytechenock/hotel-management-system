'use client'

import React from "react"

import { useState, useMemo, useEffect } from 'react'
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
  Loader2,
  Trash2,
  Building2
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
import { RoomForm } from '@/components/room-form'
import { useToast } from '@/hooks/use-toast'
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
  const { toast } = useToast()
  const { currentProperty, fetchProperties, properties } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'floor'>('grid')
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  // Fetch properties if none exist
  useEffect(() => {
    if (properties.length === 0) {
      fetchProperties()
    }
  }, [properties.length, fetchProperties])

  // Fetch rooms from API
  const fetchRooms = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (currentProperty?.id) params.append('propertyId', currentProperty.id)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/rooms?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch rooms')

      const data = await response.json()
      // Handle both paginated and non-paginated responses
      const roomsList = Array.isArray(data) ? data : data.data || []
      setRooms(roomsList)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast({
        title: 'Error',
        description: 'Failed to load rooms',
        variant: 'destructive',
      })
      setRooms([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch rooms when dependencies change
  useEffect(() => {
    if (currentProperty?.id) {
      fetchRooms()
    }
  }, [currentProperty, statusFilter, typeFilter, searchQuery])

  // Filter rooms client-side for additional filtering
  const filteredRooms = useMemo(() => {
    let filtered = rooms

    // Apply type filter if not 'all'
    if (typeFilter !== 'all') {
      filtered = filtered.filter((room: Room) => room.type === typeFilter)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((room: Room) =>
          room.number.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [rooms, searchQuery, typeFilter])

  const roomsByFloor = useMemo(() => {
    const floors = new Map<number, Room[]>()
    filteredRooms.forEach((room: Room) => {
      const existing = floors.get(room.floor) || []
      floors.set(room.floor, [...existing, room])
    })
    return Array.from(floors.entries()).sort((a, b) => a[0] - b[0])
  }, [filteredRooms])

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      available: rooms.filter((r: Room) => r.status === 'available').length,
      occupied: rooms.filter((r: Room) => r.status === 'occupied').length,
      cleaning: rooms.filter((r: Room) => r.status === 'cleaning').length,
      maintenance: rooms.filter((r: Room) => r.status === 'maintenance').length,
      reserved: rooms.filter((r: Room) => r.status === 'reserved').length,
    }
  }, [rooms])

  // Handle room status update
  const updateRoomStatus = async (roomId: string, newStatus: RoomStatus) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update room status')

      toast({
        title: 'Room updated',
        description: `Room status changed to ${newStatus}`,
      })

      await fetchRooms()
    } catch (error) {
      console.error('Error updating room:', error)
      toast({
        title: 'Error',
        description: 'Failed to update room status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle room deletion
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/rooms/${selectedRoom.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete room')

      toast({
        title: 'Room deleted',
        description: `Room ${selectedRoom.number} has been removed.`,
      })

      setIsDeleteOpen(false)
      setSelectedRoom(null)
      await fetchRooms()
    } catch (error) {
      console.error('Error deleting room:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete room',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle room creation
  const handleCreateRoom = async (roomData: Partial<Room>) => {
    if (!currentProperty?.id) {
      toast({
        title: 'Error',
        description: 'Please select a property first',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomData,
          propertyId: currentProperty.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create room')
      }

      toast({
        title: 'Room created',
        description: `Room ${roomData.number} has been added.`,
      })

      setIsCreateOpen(false)
      await fetchRooms()
    } catch (error) {
      console.error('Error creating room:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create room',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Handle room editing
  const handleEditRoom = async (roomData: Partial<Room>) => {
    if (!editingRoom) return

    setIsEditing(true)
    try {
      const response = await fetch(`/api/rooms/${editingRoom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      })

      if (!response.ok) throw new Error('Failed to update room')

      toast({
        title: 'Room updated',
        description: `Room ${roomData.number} has been updated.`,
      })

      setIsEditOpen(false)
      setEditingRoom(null)
      await fetchRooms()
    } catch (error) {
      console.error('Error updating room:', error)
      toast({
        title: 'Error',
        description: 'Failed to update room',
        variant: 'destructive',
      })
    } finally {
      setIsEditing(false)
    }
  }

  // Open edit dialog with room data
  const openEditDialog = (room: Room) => {
    setEditingRoom(room)
    setIsEditOpen(true)
  }

  // Show loading state
  if (isLoading && rooms.length === 0) {
    return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading rooms...</p>
          </div>
        </div>
    )
  }

  // Show no property selected state
  if (!currentProperty) {
    return (
        <div className="p-6">
          <Card className="p-12 text-center">
            <Building2 className="mx-auto size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Property Selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a property from the sidebar to manage its rooms.
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
            <h1 className="text-2xl font-semibold text-foreground">Room Management</h1>
            <p className="text-muted-foreground">
              Manage rooms for {currentProperty?.name}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Room
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => {
            setStatusFilter('all')
            setTypeFilter('all')
          }}>
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
                  <p className="text-2xl font-bold text-warning">{stats.cleaning}</p>
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
                placeholder="Search rooms by number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
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
          <div className="flex gap-2">
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
              Floor Plan
            </Button>
          </div>
        </div>

        {/* Room Grid */}
        {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredRooms.map((room: Room) => (
                  <RoomCard
                      key={room.id}
                      room={room}
                      onUpdateStatus={updateRoomStatus}
                      onDelete={(room: Room) => {
                        setSelectedRoom(room)
                        setIsDeleteOpen(true)
                      }}
                      onEdit={openEditDialog}
                  />
              ))}
            </div>
        ) : (
            <div className="space-y-6">
              {roomsByFloor.map(([floor, floorRooms]) => (
                  <div key={floor}>
                    <h3 className="text-lg font-semibold mb-3">Floor {floor}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {floorRooms.map((room: Room) => (
                          <RoomCard
                              key={room.id}
                              room={room}
                              onUpdateStatus={updateRoomStatus}
                              onDelete={(room: Room) => {
                                setSelectedRoom(room)
                                setIsDeleteOpen(true)
                              }}
                              onEdit={openEditDialog}
                          />
                      ))}
                    </div>
                  </div>
              ))}
            </div>
        )}

        {filteredRooms.length === 0 && !isLoading && (
            <Card className="p-12 text-center">
              <BedDouble className="mx-auto size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No rooms found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 size-4" />
                Add Your First Room
              </Button>
            </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the room
                {selectedRoom && ` ${selectedRoom.number} from floor ${selectedRoom.floor}`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleDeleteRoom}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Room Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>
                Create a new room for {currentProperty?.name}.
              </DialogDescription>
            </DialogHeader>
            <RoomForm
                onSubmit={handleCreateRoom}
                onCancel={() => setIsCreateOpen(false)}
                isSubmitting={isCreating}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Room Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Room</DialogTitle>
              <DialogDescription>
                Update room details for {editingRoom?.number || 'the room'}.
              </DialogDescription>
            </DialogHeader>
            <RoomForm
                onSubmit={handleEditRoom}
                onCancel={() => {
                  setIsEditOpen(false)
                  setEditingRoom(null)
                }}
                isSubmitting={isEditing}
                room={editingRoom || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>
  )
}

function RoomCard({ room, onUpdateStatus, onDelete, onEdit }: {
  room: Room
  onUpdateStatus: (roomId: string, status: RoomStatus) => void
  onDelete: (room: Room) => void
  onEdit: (room: Room) => void
}) {
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
                <DropdownMenuItem onClick={() => onEdit(room)}>
                  <Pencil className="mr-2 size-4" />
                  Edit Room
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => onUpdateStatus(room.id, 'cleaning')}
                    disabled={room.status === 'cleaning'}
                >
                  <Sparkles className="mr-2 size-4" />
                  Mark as Cleaning
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onUpdateStatus(room.id, 'maintenance')}
                    disabled={room.status === 'maintenance'}
                >
                  <Wrench className="mr-2 size-4" />
                  Report Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onUpdateStatus(room.id, 'available')}
                    disabled={room.status === 'available'}
                >
                  <BedDouble className="mr-2 size-4" />
                  Mark as Available
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(room)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Room
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

          {room.amenities && Array.isArray(room.amenities) && room.amenities.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex flex-wrap gap-1">
                  {room.amenities.slice(0, 3).map((amenity: string) => (
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