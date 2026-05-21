import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const books = await prisma.book.findMany({
    where: { tenantId },
    include: {
      borrows: { where: { userId, status: 'BORROWED' }, select: { id: true, dueDate: true } },
    },
    orderBy: { title: 'asc' },
  })

  return NextResponse.json(books.map((b) => ({
    ...b,
    myBorrow: b.borrows[0] ?? null,
    borrows: undefined,
  })))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const body = await req.json()
  const book = await prisma.book.create({ data: { tenantId, ...body } })
  return NextResponse.json(book)
}
