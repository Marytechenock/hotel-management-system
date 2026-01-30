'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Booking, BookingStatus, BookingSource } from '@/lib/types'

// Extended type for API response with included relations
type BookingWithRelations = Booking & {
  guest?: {
    id: string
    firstName: string
    surname: string
    email: string
  }
  room?: {
    id: string
    number: string
  }
}

interface BookingFormProps {
  onSubmit: (bookingData: Partial<Booking>) => void
  onCancel: () => void
  isSubmitting?: boolean
  booking?: BookingWithRelations
}

const bookingSources: { value: BookingSource; label: string }[] = [
  { value: 'direct', label: 'Direct' },
  { value: 'booking.com', label: 'Booking.com' },
  { value: 'expedia', label: 'Expedia' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'phone', label: 'Phone' },
  { value: 'walk_in', label: 'Walk-in' },
]

const bookingStatuses: { value: BookingStatus; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

export function BookingForm({ onSubmit, onCancel, isSubmitting = false, booking }: BookingFormProps) {
  const [formData, setFormData] = useState({
    guestId: booking?.guestId || '',
    roomId: booking?.roomId || '',
    checkIn: booking?.checkIn ? new Date(booking.checkIn) : new Date(),
    checkOut: booking?.checkOut ? new Date(booking.checkOut) : new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: booking?.status || 'confirmed' as BookingStatus,
    adults: booking?.adults || 1,
    children: booking?.children || 0,
    source: booking?.source || 'direct' as BookingSource,
    totalAmount: booking?.totalAmount || 0,
    paidAmount: booking?.paidAmount || 0,
    specialRequests: booking?.specialRequests || '',
  })

  const [availableRooms, setAvailableRooms] = useState([])
  const [availableGuests, setAvailableGuests] = useState([])

  // Fetch available rooms and guests
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms?status=available')
        const data = await response.json()
        setAvailableRooms(data.data || [])
      } catch (error) {
        console.error('Error fetching rooms:', error)
      }
    }

    const fetchGuests = async () => {
      try {
        const response = await fetch('/api/guests')
        const data = await response.json()
        setAvailableGuests(data.data || [])
      } catch (error) {
        console.error('Error fetching guests:', error)
      }
    }

    fetchRooms()
    fetchGuests()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const calculateTotal = () => {
    // This is a simplified calculation - in real app, you'd calculate based on room rate and nights
    const nights = Math.ceil((formData.checkOut.getTime() - formData.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    const baseRate = 100 // This should come from the selected room
    return baseRate * nights
  }

  useEffect(() => {
    const total = calculateTotal()
    if (formData.totalAmount === 0) {
      setFormData(prev => ({ ...prev, totalAmount: total }))
    }
  }, [formData.checkIn, formData.checkOut])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guestId">Guest</Label>
          <Select value={formData.guestId} onValueChange={(value) => setFormData(prev => ({ ...prev, guestId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select guest" />
            </SelectTrigger>
            <SelectContent className="max-w-sm z-50">
              {availableGuests.map((guest: any) => (
                <SelectItem key={guest.id} value={guest.id} className="max-w-sm">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{guest.firstName} {guest.surname}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{guest.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="roomId">Room</Label>
          <Select value={formData.roomId} onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent className="max-w-sm z-50">
              {availableRooms.map((room: any) => (
                <SelectItem key={room.id} value={room.id} className="max-w-sm">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{room.number} - {room.type}</span>
                    <span className="text-xs text-muted-foreground">${room.baseRate}/night</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Check-in Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.checkIn && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.checkIn ? format(formData.checkIn, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.checkIn}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, checkIn: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Check-out Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.checkOut && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.checkOut ? format(formData.checkOut, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.checkOut}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, checkOut: date }))}
                initialFocus
                disabled={(date) => date <= formData.checkIn}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: BookingStatus) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {bookingStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select value={formData.source} onValueChange={(value: BookingSource) => setFormData(prev => ({ ...prev, source: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {bookingSources.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adults">Adults</Label>
          <Input
            id="adults"
            type="number"
            min="1"
            max="10"
            value={formData.adults}
            onChange={(e) => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="children">Children</Label>
          <Input
            id="children"
            type="number"
            min="0"
            max="10"
            value={formData.children}
            onChange={(e) => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalAmount">Total Amount ($)</Label>
          <Input
            id="totalAmount"
            type="number"
            min="0"
            step="0.01"
            value={formData.totalAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paidAmount">Paid Amount ($)</Label>
          <Input
            id="paidAmount"
            type="number"
            min="0"
            step="0.01"
            value={formData.paidAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">Special Requests</Label>
        <Textarea
          id="specialRequests"
          value={formData.specialRequests}
          onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
          placeholder="Any special requests or notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : booking ? 'Update Booking' : 'Create Booking'}
        </Button>
      </div>
    </form>
  )
}
