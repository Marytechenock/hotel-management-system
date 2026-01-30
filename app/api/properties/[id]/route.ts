import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { propertyUpdateSchema } from '@/lib/server/schemas'
import { formatZodError } from '@/lib/server/errors'

export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const property = await prisma.property.findUnique({ where: { id } })
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(property)
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = propertyUpdateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  try {
    const updated = await prisma.property.update({ where: { id }, data: parsed.data })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    await prisma.property.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
