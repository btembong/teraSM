import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const { bookId } = await req.json()

  const book = await prisma.book.findFirst({ where: { tenantId, id: bookId } })
  if (!book || book.available < 1) return NextResponse.json({ error: 'No copies available' }, { status: 400 })

  const existing = await prisma.bookBorrow.findFirst({ where: { tenantId, bookId, userId, status: 'BORROWED' } })
  if (existing) return NextResponse.json({ error: 'Already borrowed' }, { status: 409 })

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14) // 2 weeks

  const [borrow] = await prisma.$transaction([
    prisma.bookBorrow.create({ data: { tenantId, bookId, userId, dueDate, status: 'BORROWED' } }),
    prisma.book.update({ where: { id: bookId }, data: { available: { decrement: 1 } } }),
  ])

  return NextResponse.json(borrow)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const { borrowId } = await req.json()

  const borrow = await prisma.bookBorrow.findFirst({ where: { id: borrowId, userId, tenantId } })
  if (!borrow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [updated] = await prisma.$transaction([
    prisma.bookBorrow.update({ where: { id: borrowId }, data: { status: 'RETURNED', returnedAt: new Date() } }),
    prisma.book.update({ where: { id: borrow.bookId }, data: { available: { increment: 1 } } }),
  ])

  return NextResponse.json(updated)
}
