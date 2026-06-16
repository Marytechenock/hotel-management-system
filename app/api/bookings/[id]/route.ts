import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { bookingUpdateSchema } from '@/lib/server/schemas'
import { formatZodError } from '@/lib/server/errors'
import { fromDbBookingSource, toDbBookingSource } from '@/lib/server/booking-source'

export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { guest: true, room: true }
  })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...booking, source: fromDbBookingSource(booking.source) })
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bookingUpdateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  if (parsed.data.checkIn && parsed.data.checkOut && parsed.data.checkOut <= parsed.data.checkIn) {
    return NextResponse.json({ error: 'checkOut must be after checkIn' }, { status: 400 })
  }

  const { source: rawSource, status, ...rest } = parsed.data
  const data: Prisma.BookingUpdateInput = { ...rest, updatedAt: new Date() }
  if (rawSource) data.source = toDbBookingSource(rawSource)
  if (status) data.status = status

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Get the current booking first
      const currentBooking = await tx.booking.findUnique({
        where: { id },
        include: { room: true }
      })

      if (!currentBooking) {
        throw new Error('BOOKING_NOT_FOUND')
      }

      // Update the booking
      const updatedBooking = await tx.booking.update({
        where: { id },
        data,
        include: { guest: true, room: true }
      })

      // Handle room status updates based on booking status change
      if (status) {
        const previousStatus = currentBooking.status
        const roomId = currentBooking.roomId

        // Convert to string for safe comparison
        const newStatus = String(status)
        const oldStatus = String(previousStatus)

        // If status is being updated to checked_in
        if (newStatus === 'checked_in') {
          await tx.room.update({
            where: { id: roomId },
            data: { status: 'occupied' }
          })
        }
        // If status is being updated to checked_out, cancelled, or no_show
        else if (newStatus === 'checked_out' || newStatus === 'cancelled' || newStatus === 'no_show') {
          await tx.room.update({
            where: { id: roomId },
            data: { status: 'available' }
          })
        }
        // If status is being updated to confirmed (and wasn't checked_in before)
        else if (newStatus === 'confirmed' && oldStatus !== 'checked_in') {
          await tx.room.update({
            where: { id: roomId },
            data: { status: 'reserved' }
          })
        }

        // Safety check: if room was occupied but status is no longer checked_in
        if (oldStatus === 'checked_in' && newStatus !== 'checked_in') {
          await tx.room.update({
            where: { id: roomId },
            data: { status: 'available' }
          })
        }
      }

      return updatedBooking
    })

    return NextResponse.json({
      ...updated,
      source: fromDbBookingSource(updated.source)
    })
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : ''
    if (msg === 'BOOKING_NOT_FOUND') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    console.error('Failed to update booking:', e)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    await prisma.$transaction(async (tx) => {
      // Get the booking first
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { room: true }
      })

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND')
      }

      // If the room was occupied or reserved, free it
      if (booking.status === 'checked_in' || booking.status === 'confirmed') {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: 'available' }
        })
      }

      // Delete the booking
      await tx.booking.delete({ where: { id } })
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : ''
    if (msg === 'BOOKING_NOT_FOUND') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    console.error('Failed to delete booking:', e)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}