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
  const search = url.searchParams.get('search')?.trim() // Changed from 'q' to 'search' for consistency

  const where: Prisma.RoomWhereInput = {}
  if (propertyId) where.propertyId = propertyId
  if (status && status !== 'all') where.status = status as Prisma.EnumRoomStatusFilter
  if (type && type !== 'all') where.type = type as Prisma.EnumRoomTypeFilter
  if (search) where.number = { contains: search, mode: 'insensitive' }

  const [total, data] = await Promise.all([
    prisma.room.count({ where }),
    prisma.room.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      skip,
      take: limit
    }),
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
    // First, check if property exists
    const property = await prisma.property.findUnique({
      where: { id: parsed.data.propertyId }
    })

    if (!property) {
      return NextResponse.json({
        error: `Property with ID ${parsed.data.propertyId} does not exist. Please create the property first.`
      }, { status: 400 })
    }

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
        amenities: parsed.data.amenities ?? [],
        lastCleaned: parsed.data.lastCleaned,
        notes: parsed.data.notes,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({
          error: `Room number ${parsed.data.number} already exists in this property`
        }, { status: 409 })
      }
      if (error.code === 'P2003') {
        return NextResponse.json({
          error: 'Invalid property ID. Please ensure the property exists.'
        }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}