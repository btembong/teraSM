import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const [courses, announcements, content] = await Promise.all([
    prisma.course.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, code: true, description: true },
      take: 5,
    }),
    prisma.announcement.findMany({
      where: {
        tenantId,
        isPublished: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, body: true, createdAt: true },
      take: 5,
    }),
    prisma.courseContent.findMany({
      where: {
        tenantId: tenantId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, description: true, type: true, courseOfferingId: true },
      take: 5,
    }),
  ])

  const results = [
    ...courses.map((c) => ({ type: 'course', id: c.id, title: c.title, subtitle: c.code, href: `/student/courses` })),
    ...announcements.map((a) => ({ type: 'announcement', id: a.id, title: a.title, subtitle: new Date(a.createdAt).toLocaleDateString(), href: `/student/announcements` })),
    ...content.map((c) => ({ type: 'content', id: c.id, title: c.title, subtitle: c.type, href: `/student/courses/${c.courseOfferingId}` })),
  ]

  return NextResponse.json({ results })
}
