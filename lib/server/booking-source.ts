// lib/server/booking-source.ts
import type { BookingSource } from '@/lib/types'
import type { BookingSource as DbBookingSource } from '@prisma/client'

export function toDbBookingSource(source: BookingSource): DbBookingSource {
  if (source === 'booking.com') return 'booking_com'
  return source as unknown as DbBookingSource
}

export function fromDbBookingSource(source: DbBookingSource): BookingSource {
  if (source === 'booking_com') return 'booking.com'
  return source as unknown as BookingSource
}