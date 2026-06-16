import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parsePagination } from '@/lib/server/pagination'
import { bookingCreateSchema } from '@/lib/server/schemas'
import { formatZodError } from '@/lib/server/errors'
import { fromDbBookingSource, toDbBookingSource } from '@/lib/server/booking-source'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const { skip, limit, page } = parsePagination(url.searchParams)

  const propertyId = url.searchParams.get('propertyId')?.trim()
  const status = url.searchParams.get('status')?.trim()
  const source = url.searchParams.get('source')?.trim()
  const q = url.searchParams.get('q')?.trim()
  const roomId = url.searchParams.get('roomId')?.trim()

  const where: Prisma.BookingWhereInput = {}
  if (propertyId) where.propertyId = propertyId
  if (roomId) where.roomId = roomId
  if (status && status !== 'all') where.status = status as Prisma.EnumBookingStatusFilter
  if (source && source !== 'all') where.source = (source === 'booking.com' ? 'booking_com' : source) as Prisma.EnumBookingSourceFilter

  if (q) {
    where.guest = {
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { surname: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    }
  }

  try {
    const [total, data] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: { checkIn: 'desc' },
        skip,
        take: limit,
        include: { guest: true, room: true },
      }),
    ])

    const mapped = data.map((b) => ({
      ...b,
      source: fromDbBookingSource(b.source),
    }))

    return NextResponse.json({ data: mapped, page, limit, total })
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bookingCreateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  if (parsed.data.checkOut <= parsed.data.checkIn) {
    return NextResponse.json({ error: 'checkOut must be after checkIn' }, { status: 400 })
  }

  // Validate source
  const validSources = ['booking_com', 'direct', 'agoda', 'expedia', 'other']
  if (!validSources.includes(parsed.data.source)) {
    return NextResponse.json({ error: 'Invalid booking source' }, { status: 400 })
  }

  const now = new Date()

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Lock the room to prevent race conditions
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${parsed.data.roomId} FOR UPDATE`

      const room = await tx.room.findUnique({ where: { id: parsed.data.roomId } })
      if (!room) throw new Error('ROOM_NOT_FOUND')
      if (room.propertyId !== parsed.data.propertyId) throw new Error('ROOM_PROPERTY_MISMATCH')

      // Check for overlapping bookings
      const existing = await tx.booking.findMany({
        where: {
          roomId: parsed.data.roomId,
          status: { notIn: ['cancelled', 'no_show'] },
        },
        select: { checkIn: true, checkOut: true },
      })

      const hasOverlap = existing.some((b) =>
          overlaps(parsed.data.checkIn, parsed.data.checkOut, b.checkIn, b.checkOut)
      )
      if (hasOverlap) throw new Error('ROOM_ALREADY_BOOKED')

      // Create the booking
      const createdBooking = await tx.booking.create({
        data: {
          id: parsed.data.id ?? randomUUID(),
          propertyId: parsed.data.propertyId,
          guestId: parsed.data.guestId,
          roomId: parsed.data.roomId,
          checkIn: parsed.data.checkIn,
          checkOut: parsed.data.checkOut,
          status: parsed.data.status,
          adults: parsed.data.adults,
          children: parsed.data.children,
          source: toDbBookingSource(parsed.data.source),
          totalAmount: parsed.data.totalAmount,
          paidAmount: parsed.data.paidAmount,
          specialRequests: parsed.data.specialRequests,
          createdAt: parsed.data.createdAt ?? now,
          updatedAt: parsed.data.updatedAt ?? now,
        },
      })

      // Update room status based on booking status
      if (parsed.data.status === 'checked_in') {
        await tx.room.update({
          where: { id: parsed.data.roomId },
          data: { status: 'occupied' }
        })
      } else if (parsed.data.status === 'confirmed') {
        await tx.room.update({
          where: { id: parsed.data.roomId },
          data: { status: 'reserved' }
        })
      }

      // Fetch the complete booking with relations
      return await tx.booking.findUnique({
        where: { id: createdBooking.id },
        include: { guest: true, room: true }
      })
    })

    return NextResponse.json({
      ...created,
      source: parsed.data.source
    }, { status: 201 })
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : ''

    if (msg === 'ROOM_NOT_FOUND') {
      return NextResponse.json({ error: 'Room not found' }, { status: 400 })
    }
    if (msg === 'ROOM_PROPERTY_MISMATCH') {
      return NextResponse.json({ error: 'Room does not belong to property' }, { status: 400 })
    }
    if (msg === 'ROOM_ALREADY_BOOKED') {
      return NextResponse.json({ error: 'Room is already booked for those dates' }, { status: 409 })
    }

    console.error('Failed to create booking:', e)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}