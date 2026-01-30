import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { roomUpdateSchema } from '@/lib/server/schemas'
import { formatZodError } from '@/lib/server/errors'

export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const room = await prisma.room.findUnique({ where: { id } })
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(room)
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = roomUpdateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  try {
    const updated = await prisma.room.update({ where: { id }, data: parsed.data })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    await prisma.room.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
