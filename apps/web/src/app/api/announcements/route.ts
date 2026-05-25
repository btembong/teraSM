import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import { sendAnnouncementEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const audience = req.nextUrl.searchParams.get('audience') ?? undefined
  const adminView = req.nextUrl.searchParams.get('admin') === 'true'

  if (adminView) {
    const announcements = await prisma.announcement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(announcements)
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      tenantId,
      isPublished: true,
      ...(audience ? { OR: [{ audience: 'ALL' }, { audience: audience as any }] } : { audience: 'ALL' }),
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    take: 30,
  })

  const authorIds = [...new Set(announcements.map((a) => a.authorId))]
  const authors = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, firstName: true, lastName: true, avatarUrl: true } })
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]))

  return NextResponse.json(announcements.map((a) => ({ ...a, author: authorMap[a.authorId] })))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const authorId = (session.user as any).id
  const body = await req.json()

  const announcement = await prisma.announcement.create({
    data: {
      tenantId,
      authorId,
      title: body.title,
      body: body.body,
      audience: body.audience ?? 'ALL',
      departmentId: body.departmentId,
      isPinned: body.isPinned ?? false,
      isPublished: body.isPublished ?? false,
      publishedAt: body.isPublished ? new Date() : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    },
  })

  // Fan-out email to audience (non-blocking)
  if (body.isPublished) {
    const audience: string = body.audience ?? 'ALL'
    const roleFilter: Record<string, string[]> = {
      STUDENTS: ['STUDENT'],
      TEACHERS: ['TEACHER'],
      PARENTS: ['PARENT'],
      STAFF: ['STAFF', 'HR_ADMIN', 'FINANCE_ADMIN', 'REGISTRAR', 'TENANT_ADMIN'],
    }
    const roles = roleFilter[audience] ?? null

    Promise.all([
      prisma.user.findMany({
        where: { tenantId, ...(roles ? { role: { in: roles as any[] } } : {}) },
        select: { email: true, firstName: true },
      }),
      prisma.user.findUnique({ where: { id: authorId }, select: { firstName: true, lastName: true } }),
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
    ]).then(([recipients, author, tenant]) => {
      const authorName = author ? `${author.firstName} ${author.lastName}` : 'School Admin'
      const schoolName = tenant?.name ?? 'Your School'
      for (const recipient of recipients) {
        sendAnnouncementEmail({
          to: recipient.email,
          firstName: recipient.firstName,
          schoolName,
          title: body.title,
          body: body.body,
          authorName,
        }).catch(err => console.error('[announcement email]', err))
      }
    }).catch(err => console.error('[announcement email fan-out]', err))
  }

  return NextResponse.json(announcement, { status: 201 })
}
