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
import { useAppStore } from '@/lib/store'
import type { Booking, BookingStatus, BookingSource } from '@/lib/types'

interface BookingFormProps {
  onSubmit: (bookingData: Partial<Booking>) => void
  onCancel: () => void
  isSubmitting?: boolean
  booking?: Booking
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
  const { currentProperty } = useAppStore()
  const [formData, setFormData] = useState({
    guestId: booking?.guestId || '',
    roomId: booking?.roomId || '',
    checkIn: booking?.checkIn ? new Date(booking.checkIn) : new Date(),
    checkOut: booking?.checkOut ? new Date(booking.checkOut) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: booking?.status || 'confirmed' as BookingStatus,
    adults: booking?.adults || 1,
    children: booking?.children || 0,
    source: booking?.source || 'direct' as BookingSource,
    totalAmount: booking?.totalAmount || 0,
    paidAmount: booking?.paidAmount || 0,
    specialRequests: booking?.specialRequests || '',
  })

  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [availableGuests, setAvailableGuests] = useState<any[]>([])
  const [selectedRoomRate, setSelectedRoomRate] = useState<number>(0)
  const [bookedRanges, setBookedRanges] = useState<{ from: Date; to: Date }[]>([])
  const [isLoadingBookedDates, setIsLoadingBookedDates] = useState(false)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const params = new URLSearchParams()
        if (currentProperty?.id) params.append('propertyId', currentProperty.id)
        params.append('limit', '100')
        const response = await fetch(`/api/rooms?${params.toString()}`)
        const data = await response.json()
        setAvailableRooms(data.data || [])
      } catch (error) {
        console.error('Error fetching rooms:', error)
      }
    }

    const fetchGuests = async () => {
      try {
        const params = new URLSearchParams()
        if (currentProperty?.id) params.append('propertyId', currentProperty.id)
        params.append('limit', '100')
        const response = await fetch(`/api/guests?${params.toString()}`)
        const data = await response.json()
        setAvailableGuests(data.data || [])
      } catch (error) {
        console.error('Error fetching guests:', error)
      }
    }

    fetchRooms()
    fetchGuests()
  }, [currentProperty?.id])

  // Update room rate when room changes
  useEffect(() => {
    if (formData.roomId) {
      const selectedRoom = availableRooms.find(r => r.id === formData.roomId)
      if (selectedRoom) {
        setSelectedRoomRate(selectedRoom.baseRate)
        calculateTotal(selectedRoom.baseRate)
      }
    }
  }, [formData.roomId, availableRooms])

  // Fetch booked date ranges when room changes
  useEffect(() => {
    if (!formData.roomId) {
      setBookedRanges([])
      return
    }

    const fetchBookedRanges = async () => {
      setIsLoadingBookedDates(true)
      try {
        const [confirmedRes, checkedInRes] = await Promise.all([
          fetch(`/api/bookings?roomId=${formData.roomId}&status=confirmed&limit=200`),
          fetch(`/api/bookings?roomId=${formData.roomId}&status=checked_in&limit=200`),
        ])

        const [confirmedData, checkedInData] = await Promise.all([
          confirmedRes.json(),
          checkedInRes.json(),
        ])

        console.log('confirmed bookings:', confirmedData)
        console.log('checked_in bookings:', checkedInData)

        const allBookings = [
          ...(confirmedData.data || []),
          ...(checkedInData.data || []),
        ]

        const ranges = allBookings
            .filter((b: any) => !booking || b.id !== booking.id)
            .map((b: any) => ({
              from: new Date(b.checkIn),
              to: new Date(b.checkOut),
            }))

        console.log('booked ranges:', ranges)
        setBookedRanges(ranges)
      } catch (error) {
        console.error('Error fetching booked dates:', error)
        setBookedRanges([])
      } finally {
        setIsLoadingBookedDates(false)
      }
    }

    fetchBookedRanges()
  }, [formData.roomId])

  const calculateTotal = (rate?: number) => {
    const nights = Math.max(1, Math.ceil(
        (formData.checkOut.getTime() - formData.checkIn.getTime()) / (1000 * 60 * 60 * 24)
    ))
    const roomRate = rate || selectedRoomRate || 100
    const total = roomRate * nights
    setFormData(prev => ({ ...prev, totalAmount: total }))
  }

  useEffect(() => {
    if (formData.checkIn && formData.checkOut && selectedRoomRate > 0) {
      calculateTotal()
    }
  }, [formData.checkIn, formData.checkOut, selectedRoomRate])

  // Check if a date falls within any booked range using timestamps
  const isDateBooked = (date: Date): boolean => {
    const t = date.getTime()
    return bookedRanges.some(({ from, to }) => t >= from.getTime() && t < to.getTime())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.guestId) { alert('Please select a guest'); return }
    if (!formData.roomId) { alert('Please select a room'); return }
    if (formData.checkOut <= formData.checkIn) { alert('Check-out date must be after check-in date'); return }
    onSubmit(formData)
  }

  const nights = Math.max(1, Math.ceil(
      (formData.checkOut.getTime() - formData.checkIn.getTime()) / (1000 * 60 * 60 * 24)
  ))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Guest + Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guestId">Guest *</Label>
            <Select value={formData.guestId} onValueChange={(value) => setFormData(prev => ({ ...prev, guestId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select guest" />
              </SelectTrigger>
              <SelectContent>
                {availableGuests.map((guest: any) => (
                    <SelectItem key={guest.id} value={guest.id}>
                      <div className="flex flex-col">
                        <span>{guest.firstName} {guest.surname}</span>
                        <span className="text-xs text-muted-foreground">{guest.email}</span>
                      </div>
                    </SelectItem>
                ))}
                {availableGuests.length === 0 && (
                    <SelectItem value="no-guests" disabled>No guests found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomId">Room *</Label>
            <Select value={formData.roomId} onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((room: any) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex justify-between w-full">
                        <span>{room.number} - {room.type}</span>
                        <span className="text-muted-foreground">${room.baseRate}/night</span>
                      </div>
                    </SelectItem>
                ))}
                {availableRooms.length === 0 && (
                    <SelectItem value="no-rooms" disabled>No rooms found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Check-in Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !formData.checkIn && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.checkIn ? format(formData.checkIn, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {isLoadingBookedDates ? (
                    <div className="p-6 text-sm text-muted-foreground text-center">
                      Loading availability...
                    </div>
                ) : (
                    <>
                      <Calendar
                          mode="single"
                          selected={formData.checkIn}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, checkIn: date }))}
                          disabled={(date) => {
                            const d = new Date(date)
                            d.setHours(0, 0, 0, 0)
                            return d < today || isDateBooked(d)
                          }}
                          modifiers={{
                            booked: (date) => {
                              const d = new Date(date)
                              d.setHours(0, 0, 0, 0)
                              return isDateBooked(d)
                            }
                          }}
                          modifiersClassNames={{
                            booked: 'bg-red-50 text-red-400 line-through'
                          }}
                          initialFocus
                      />
                      {bookedRanges.length > 0 && (
                          <div className="px-3 pb-3 flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                            <span className="inline-block w-3 h-3 rounded-sm bg-red-50 border border-red-200" />
                            Already booked
                          </div>
                      )}
                    </>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Check-out Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !formData.checkOut && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.checkOut ? format(formData.checkOut, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {isLoadingBookedDates ? (
                    <div className="p-6 text-sm text-muted-foreground text-center">
                      Loading availability...
                    </div>
                ) : (
                    <>
                      <Calendar
                          mode="single"
                          selected={formData.checkOut}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, checkOut: date }))}
                          disabled={(date) => {
                            const d = new Date(date)
                            d.setHours(0, 0, 0, 0)
                            const ci = new Date(formData.checkIn)
                            ci.setHours(0, 0, 0, 0)
                            return d <= ci || isDateBooked(d)
                          }}
                          modifiers={{
                            booked: (date) => {
                              const d = new Date(date)
                              d.setHours(0, 0, 0, 0)
                              return isDateBooked(d)
                            }
                          }}
                          modifiersClassNames={{
                            booked: 'bg-red-50 text-red-400 line-through'
                          }}
                          initialFocus
                      />
                      {bookedRanges.length > 0 && (
                          <div className="px-3 pb-3 flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                            <span className="inline-block w-3 h-3 rounded-sm bg-red-50 border border-red-200" />
                            Already booked
                          </div>
                      )}
                    </>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Pricing summary */}
        <div className="bg-muted/30 p-3 rounded-md">
          <div className="flex justify-between text-sm">
            <span>Nights:</span>
            <span className="font-medium">{nights}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Room Rate:</span>
            <span className="font-medium">${selectedRoomRate}/night</span>
          </div>
          <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
            <span>Total Amount:</span>
            <span>${formData.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Status + Source */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: BookingStatus) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {bookingStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
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
                    <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Adults + Children */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adults">Adults *</Label>
            <Input
                id="adults"
                type="number"
                min="1"
                max="10"
                value={formData.adults}
                onChange={(e) => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) || 1 }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount ($) *</Label>
            <Input
                id="totalAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {/* Special requests */}
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