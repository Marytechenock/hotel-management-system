import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parsePagination } from '@/lib/server/pagination'
import { guestCreateSchema } from '@/lib/server/schemas'
import { formatZodError } from '@/lib/server/errors'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const { skip, limit, page } = parsePagination(url.searchParams)

  const q = url.searchParams.get('q')?.trim()
  const loyaltyTier = url.searchParams.get('loyaltyTier')?.trim()

  const where: Prisma.GuestWhereInput = {}

  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: 'insensitive' } },
      { surname: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { cellphone: { contains: q } },
      { idPassportNumber: { contains: q, mode: 'insensitive' } },
    ]
  }

  const validTiers = ['bronze', 'silver', 'gold', 'platinum']
  if (loyaltyTier && loyaltyTier !== 'all' && validTiers.includes(loyaltyTier)) {
    where.loyaltyTier = loyaltyTier as Prisma.EnumLoyaltyTierFilter
  }

  const [total, data] = await Promise.all([
    prisma.guest.count({ where }),
    prisma.guest.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take: limit }),
  ])

  return NextResponse.json({ data, page, limit, total })
}

export async function POST(req: Request) {
  let payload: unknown
  try {
    payload = await req.json()
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Log the received payload for debugging
  console.log('Received payload:', JSON.stringify(payload, null, 2))

  const parsed = guestCreateSchema.safeParse(payload)
  if (!parsed.success) {
    // Return detailed validation errors
    const errors = parsed.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))

    console.error('Validation errors:', errors)

    return NextResponse.json({
      error: 'Validation failed',
      details: errors
    }, { status: 400 })
  }

  const now = new Date()

  try {
    // Check if room exists
    const room = await prisma.room.findFirst({
      where: {
        number: parsed.data.roomNumber,
      }
    })

    if (!room) {
      return NextResponse.json({
        error: `Room ${parsed.data.roomNumber} not found. Please create the room first.`
      }, { status: 400 })
    }

    const created = await prisma.guest.create({
      data: {
        id: parsed.data.id ?? crypto.randomUUID(),
        title: parsed.data.title,
        surname: parsed.data.surname,
        firstName: parsed.data.firstName,
        nationality: parsed.data.nationality,
        idPassportNumber: parsed.data.idPassportNumber,
        numberOfAdults: parsed.data.numberOfAdults,
        numberOfChildren: parsed.data.numberOfChildren,
        childrenAges: parsed.data.childrenAges,
        otherAdult: parsed.data.otherAdult,
        postalAddress: parsed.data.postalAddress,
        residentialAddress: parsed.data.residentialAddress,
        city: parsed.data.city,
        stateProvince: parsed.data.stateProvince,
        country: parsed.data.country,
        telHome: parsed.data.telHome,
        telBusiness: parsed.data.telBusiness,
        cellphone: parsed.data.cellphone,
        email: parsed.data.email,
        dateIn: parsed.data.dateIn,
        dateOut: parsed.data.dateOut,
        roomNumber: parsed.data.roomNumber,
        accountPayableBy: parsed.data.accountPayableBy,
        vehicleRegNo: parsed.data.vehicleRegNo,
        breakfastTime: parsed.data.breakfastTime,
        loyaltyTier: parsed.data.loyaltyTier,
        loyaltyPoints: parsed.data.loyaltyPoints,
        totalStays: parsed.data.totalStays,
        totalSpent: parsed.data.totalSpent,
        notes: parsed.data.notes,
        tags: parsed.data.tags,
        preferences: parsed.data.preferences,
        serveDinner: parsed.data.serveDinner,
        agreedToTerms: parsed.data.agreedToTerms,
        signatureDate: parsed.data.signatureDate,
        signatureData: parsed.data.signatureData,
        createdAt: parsed.data.createdAt ?? now,
        updatedAt: parsed.data.updatedAt ?? now,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating guest:', error)

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({
          error: 'A guest with this email or ID already exists'
        }, { status: 409 })
      }
    }

    return NextResponse.json({
      error: 'Failed to create guest',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}