import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guestUpdateSchema } from '@/lib/server/schemas'
import { formatZodError } from '@/lib/server/errors'

export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const guest = await prisma.guest.findUnique({ where: { id } })
  if (!guest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(guest)
}

//Fetch Guests




export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = guestUpdateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  try {
    const updated = await prisma.guest.update({
      where: { id },
      data: { ...parsed.data, updatedAt: new Date() },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    await prisma.guest.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete guest' }, { status: 500 })
  }
}
