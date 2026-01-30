'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { Room, RoomType, RoomStatus } from '@/lib/types'

interface RoomFormProps {
  onSubmit: (roomData: Partial<Room>) => void
  onCancel: () => void
  isSubmitting?: boolean
  room?: Room
}

const roomTypes: { value: RoomType; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'suite', label: 'Suite' },
  { value: 'executive', label: 'Executive' },
  { value: 'penthouse', label: 'Penthouse' },
]

const commonAmenities = [
  'WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Hair Dryer',
  'Coffee Maker', 'Iron', 'Bathtub', 'Balcony', 'Kitchen', 'Living Area',
  'Work Desk', 'Ocean View', 'City View', 'Mountain View'
]

export function RoomForm({ onSubmit, onCancel, isSubmitting = false, room }: RoomFormProps) {
  const [formData, setFormData] = useState({
    number: room?.number || '',
    type: room?.type || 'standard' as RoomType,
    floor: room?.floor || 1,
    maxOccupancy: room?.maxOccupancy || 2,
    baseRate: room?.baseRate || 100,
    status: room?.status || 'available' as RoomStatus,
    amenities: room?.amenities || [],
    description: room?.description || '',
  })

  const [newAmenity, setNewAmenity] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }))
      setNewAmenity('')
    }
  }

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }))
  }

  const addCommonAmenity = (amenity: string) => {
    if (!formData.amenities.includes(amenity)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Room Number</Label>
          <Input
            id="number"
            value={formData.number}
            onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
            placeholder="e.g., 101"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="floor">Floor</Label>
          <Input
            id="floor"
            type="number"
            min="1"
            value={formData.floor}
            onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) }))}
            placeholder="e.g., 1"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Room Type</Label>
          <Select value={formData.type} onValueChange={(value: RoomType) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              {roomTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: RoomStatus) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxOccupancy">Max Occupancy</Label>
          <Input
            id="maxOccupancy"
            type="number"
            min="1"
            max="10"
            value={formData.maxOccupancy}
            onChange={(e) => setFormData(prev => ({ ...prev, maxOccupancy: parseInt(e.target.value) }))}
            placeholder="e.g., 2"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseRate">Base Rate ($)</Label>
          <Input
            id="baseRate"
            type="number"
            min="0"
            step="0.01"
            value={formData.baseRate}
            onChange={(e) => setFormData(prev => ({ ...prev, baseRate: parseFloat(e.target.value) }))}
            placeholder="e.g., 100"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Room description..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="flex gap-2">
          <Input
            value={newAmenity}
            onChange={(e) => setNewAmenity(e.target.value)}
            placeholder="Add amenity..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
          />
          <Button type="button" onClick={addAmenity} variant="outline">
            Add
          </Button>
        </div>
        
        {formData.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.amenities.map((amenity) => (
              <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                {amenity}
                <X 
                  className="size-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeAmenity(amenity)}
                />
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">Common Amenities:</Label>
          <div className="flex flex-wrap gap-1">
            {commonAmenities.map((amenity) => (
              <Badge
                key={amenity}
                variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => addCommonAmenity(amenity)}
              >
                {amenity}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : room ? 'Update Room' : 'Create Room'}
        </Button>
      </div>
    </form>
  )
}
