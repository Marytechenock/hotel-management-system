import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parsePagination } from '@/lib/server/pagination'
import { roomCreateSchema } from '@/lib/server/schemas'
import { formatZodError } from '@/lib/server/errors'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const { skip, limit, page } = parsePagination(url.searchParams)

  const propertyId = url.searchParams.get('propertyId')?.trim()
  const status = url.searchParams.get('status')?.trim()
  const type = url.searchParams.get('type')?.trim()
  const q = url.searchParams.get('q')?.trim()

  const where: Prisma.RoomWhereInput = {}
  if (propertyId) where.propertyId = propertyId
  if (status && status !== 'all') where.status = status as Prisma.EnumRoomStatusFilter
  if (type && type !== 'all') where.type = type as Prisma.EnumRoomTypeFilter
  if (q) where.number = { contains: q, mode: 'insensitive' }

  const [total, data] = await Promise.all([
    prisma.room.count({ where }),
    prisma.room.findMany({ where, orderBy: [{ propertyId: 'asc' }, { number: 'asc' }], skip, take: limit }),
  ])

  return NextResponse.json({ data, page, limit, total })
}

export async function POST(req: Request) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = roomCreateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  try {
    const created = await prisma.room.create({
      data: {
        id: parsed.data.id ?? crypto.randomUUID(),
        propertyId: parsed.data.propertyId,
        number: parsed.data.number,
        floor: parsed.data.floor,
        type: parsed.data.type,
        status: parsed.data.status,
        maxOccupancy: parsed.data.maxOccupancy,
        baseRate: parsed.data.baseRate,
        amenities: parsed.data.amenities,
        lastCleaned: parsed.data.lastCleaned,
        notes: parsed.data.notes,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
