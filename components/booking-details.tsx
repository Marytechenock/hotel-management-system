'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, Users, DollarSign, MessageSquare, MapPin, Phone, Mail } from 'lucide-react'
import { format } from 'date-fns'
import type { Booking } from '@/lib/types'

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

interface BookingDetailsProps {
  booking: BookingWithRelations
}

const statusConfig: Record<string, { color: string; label: string }> = {
  confirmed: {
    color: 'bg-primary/10 text-primary border-primary/30',
    label: 'Confirmed',
  },
  checked_in: {
    color: 'bg-success/10 text-success border-success/30',
    label: 'Checked In',
  },
  checked_out: {
    color: 'bg-muted text-muted-foreground border-muted',
    label: 'Checked Out',
  },
  cancelled: {
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    label: 'Cancelled',
  },
  no_show: {
    color: 'bg-warning/20 text-warning-foreground border-warning/30',
    label: 'No Show',
  },
}

const sourceLabels: Record<string, string> = {
  direct: 'Direct',
  'booking.com': 'Booking.com',
  expedia: 'Expedia',
  airbnb: 'Airbnb',
  phone: 'Phone',
  walk_in: 'Walk-in',
}

export function BookingDetails({ booking }: BookingDetailsProps) {
  const config = statusConfig[booking.status] || statusConfig.confirmed

  return (
    <div className="space-y-6">
      {/* Guest Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Guest Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-lg">
                {booking.guest?.firstName} {booking.guest?.surname}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="flex items-center gap-1">
                <Mail className="size-4" />
                {booking.guest?.email}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Guests</p>
            <p className="flex items-center gap-1">
              <Users className="size-4" />
              {booking.adults} adult{booking.adults > 1 ? 's' : ''}
              {booking.children > 0 && `, ${booking.children} child${booking.children > 1 ? 'ren' : ''}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Booking Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Room</p>
              <p className="flex items-center gap-1">
                <MapPin className="size-4" />
                {booking.room?.number || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge variant="outline" className={config.color}>
                {config.label}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Check-in</p>
              <p className="flex items-center gap-1">
                <Calendar className="size-4" />
                {format(new Date(booking.checkIn), 'PPP')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Check-out</p>
              <p className="flex items-center gap-1">
                <Calendar className="size-4" />
                {format(new Date(booking.checkOut), 'PPP')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Source</p>
              <p>{sourceLabels[booking.source] || booking.source}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Nights</p>
              <p>
                {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Total Amount</p>
              <p className="text-lg font-semibold">
                ${booking.totalAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Paid Amount</p>
              <p className="text-lg">
                ${booking.paidAmount.toLocaleString()}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm font-medium">Balance</p>
            <p className={`text-lg font-semibold ${booking.paidAmount < booking.totalAmount ? 'text-destructive' : 'text-success'}`}>
              ${(booking.totalAmount - booking.paidAmount).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      {booking.specialRequests && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              Special Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{booking.specialRequests}</p>
          </CardContent>
        </Card>
      )}

      {/* Booking Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Booking ID</p>
              <p className="font-mono text-xs">{booking.id}</p>
            </div>
            <div>
              <p className="font-medium">Property ID</p>
              <p className="font-mono text-xs">{booking.propertyId}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Created</p>
              <p>{format(new Date(booking.createdAt), 'PPP')}</p>
            </div>
            <div>
              <p className="font-medium">Last Updated</p>
              <p>{format(new Date(booking.updatedAt), 'PPP')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
