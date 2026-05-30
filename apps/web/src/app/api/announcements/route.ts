import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import { sendAnnouncementEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId
  const userId   = (session.user as any).id
  const role     = (session.user as any).role
  const adminView = req.nextUrl.searchParams.get('admin') === 'true'

  if (adminView) {
    const announcements = await prisma.announcement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(announcements)
  }

  // ── Resolve the calling user's context for targeting ───────────────────────
  // Department and year/programme targeting only applies to students.
  let userDepartmentId: string | null = null
  let userYearLevel:    number | null = null
  let userProgrammeId:  string | null = null

  if (role === 'STUDENT') {
    const profile = await (prisma as any).studentProfile.findFirst({
      where: { userId, tenantId },
      select: { level: true, programId: true, departmentId: true },
    })
    if (profile) {
      userYearLevel   = profile.level   ?? null
      userProgrammeId = profile.programId   ?? null
      // departmentId via programme if not directly on profile
      if (!userDepartmentId && profile.departmentId) {
        userDepartmentId = profile.departmentId
      } else if (profile.programId) {
        const prog = await (prisma as any).program.findFirst({
          where: { id: profile.programId },
          select: { departmentId: true },
        })
        userDepartmentId = prog?.departmentId ?? null
      }
    }
  } else if (role === 'TEACHER') {
    // Teachers see TEACHERS + ALL announcements, no dept filter
  }

  const now = new Date()

  // ── Build audience filter ──────────────────────────────────────────────────
  const roleAudienceMap: Record<string, string[]> = {
    STUDENT:       ['ALL', 'STUDENTS'],
    TEACHER:       ['ALL', 'TEACHERS'],
    STAFF:         ['ALL', 'STAFF'],
    HR_ADMIN:      ['ALL', 'STAFF'],
    FINANCE_ADMIN: ['ALL', 'STAFF'],
    REGISTRAR:     ['ALL', 'STAFF'],
    TENANT_ADMIN:  ['ALL', 'STAFF'],
    PARENT:        ['ALL', 'PARENTS'],
  }
  const allowedAudiences = roleAudienceMap[role] ?? ['ALL']

  const announcements = await prisma.announcement.findMany({
    where: {
      tenantId,
      isPublished: true,
      OR: [
        { audience: { in: allowedAudiences as any[] } },
        // DEPARTMENT audience: only show if user is in that department
        ...(userDepartmentId
          ? [{ audience: 'DEPARTMENT' as any, departmentId: userDepartmentId }]
          : []),
      ],
      AND: [
        // Year-level targeting: show if no yearLevel set, or matches user's year
        {
          OR: [
            { yearLevel: null },
            ...(userYearLevel ? [{ yearLevel: userYearLevel }] : []),
          ],
        },
        // Programme targeting: show if no programmeId set, or matches user's programme
        {
          OR: [
            { programmeId: null },
            ...(userProgrammeId ? [{ programmeId: userProgrammeId }] : []),
          ],
        },
        // Expiry
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    take: 50,
  })

  const authorIds = [...new Set(announcements.map((a) => a.authorId))]
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  })
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
      type:         body.type         ?? 'ANNOUNCEMENT',
      title:        body.title,
      body:         body.body,
      imageUrl:     body.imageUrl     ?? null,
      videoUrl:     body.videoUrl     ?? null,
      audience:     body.audience     ?? 'ALL',
      departmentId: body.departmentId ?? null,
      yearLevel:    body.yearLevel    ? Number(body.yearLevel) : null,
      programmeId:  body.programmeId  ?? null,
      isPinned:     body.isPinned     ?? false,
      isPublished:  body.isPublished  ?? false,
      publishedAt:  body.isPublished  ? new Date() : undefined,
      scheduledAt:  body.scheduledAt  ? new Date(body.scheduledAt) : undefined,
      expiresAt:    body.expiresAt    ? new Date(body.expiresAt)   : undefined,
    },
  })

  // Fan-out email + in-app notifications on immediate publish
  if (body.isPublished) {
    const audience: string = body.audience ?? 'ALL'
    const roleFilter: Record<string, string[]> = {
      STUDENTS: ['STUDENT'],
      TEACHERS: ['TEACHER'],
      PARENTS:  ['PARENT'],
      STAFF:    ['STAFF', 'HR_ADMIN', 'FINANCE_ADMIN', 'REGISTRAR', 'TENANT_ADMIN'],
    }
    const roles = roleFilter[audience] ?? null

    Promise.all([
      prisma.user.findMany({
        where: { tenantId, ...(roles ? { role: { in: roles as any[] } } : {}) },
        select: { id: true, email: true, firstName: true },
      }),
      prisma.user.findUnique({ where: { id: authorId }, select: { firstName: true, lastName: true } }),
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, logoUrl: true } }),
      prisma.tenantSettings.findUnique({ where: { tenantId }, select: { primaryColor: true } }),
    ]).then(async ([recipients, author, tenant, tenantSettings]) => {
      const authorName = author ? `${author.firstName} ${author.lastName}` : 'School Admin'
      const schoolName = tenant?.name ?? 'Your School'

      // Emails
      for (const r of recipients) {
        sendAnnouncementEmail({
          to: r.email, firstName: r.firstName, schoolName,
          title: body.title, body: body.body, authorName,
          logoUrl:    tenant?.logoUrl,
          brandColor: tenantSettings?.primaryColor,
        }).catch(() => {})
      }

      // In-app notifications
      if (recipients.length > 0) {
        await (prisma as any).notification.createMany({
          data: recipients.map((r: { id: string }) => ({
            tenantId,
            userId:  r.id,
            type:    'ANNOUNCEMENT',
            title:   body.title,
            body:    (body.body as string).slice(0, 200),
            link:    '/student/announcements',
          })),
          skipDuplicates: true,
        })
      }
    }).catch(err => console.error('[announcement publish fan-out]', err))
  }

  return NextResponse.json(announcement, { status: 201 })
}
