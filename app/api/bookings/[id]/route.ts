import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bookingUpdateSchema } from '@/lib/server/schemas'
import { formatZodError } from '@/lib/server/errors'
import { fromDbBookingSource, toDbBookingSource } from '@/lib/server/booking-source'

export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const booking = await prisma.booking.findUnique({ where: { id }, include: { guest: true, room: true } })
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

  const data: any = { ...parsed.data, updatedAt: new Date() }
  if (parsed.data.source) data.source = toDbBookingSource(parsed.data.source)

  try {
    const updated = await prisma.booking.update({ where: { id }, data })
    return NextResponse.json({ ...updated, source: fromDbBookingSource(updated.source) })
  } catch {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    await prisma.booking.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}
