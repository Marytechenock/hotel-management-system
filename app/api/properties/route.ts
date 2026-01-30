import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parsePagination } from '@/lib/server/pagination'
import { propertyCreateSchema } from '@/lib/server/schemas'
import { formatZodError } from '@/lib/server/errors'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const { skip, limit, page } = parsePagination(url.searchParams)

  const q = url.searchParams.get('q')?.trim()
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { code: { contains: q, mode: 'insensitive' as const } },
          { city: { contains: q, mode: 'insensitive' as const } },
          { country: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [total, data] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
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

  const parsed = propertyCreateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  const createdAt = parsed.data.createdAt ?? new Date()

  try {
    const created = await prisma.property.create({
      data: {
        id: parsed.data.id ?? crypto.randomUUID(),
        name: parsed.data.name,
        code: parsed.data.code,
        address: parsed.data.address,
        city: parsed.data.city,
        country: parsed.data.country,
        phone: parsed.data.phone,
        email: parsed.data.email,
        timezone: parsed.data.timezone,
        currency: parsed.data.currency,
        totalRooms: parsed.data.totalRooms,
        createdAt,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}
