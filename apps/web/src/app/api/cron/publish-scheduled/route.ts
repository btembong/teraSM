import { prisma } from '@/lib/prisma'
import { sendAnnouncementEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

// Runs every 5 minutes via Vercel Cron — publishes scheduled announcements
// and sends scheduled newsletters whose scheduledAt has passed.
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let announcementsPublished = 0
  let newslettersSent = 0

  // ── Publish scheduled announcements ────────────────────────────────────────
  const dueAnnouncements = await prisma.announcement.findMany({
    where: {
      isPublished: false,
      scheduledAt: { lte: now },
    },
    select: { id: true, tenantId: true, title: true, body: true, audience: true, authorId: true },
  })

  for (const ann of dueAnnouncements) {
    await prisma.announcement.update({
      where: { id: ann.id },
      data:  { isPublished: true, publishedAt: now },
    })

    // Fan-out email (non-blocking)
    const roleFilter: Record<string, string[]> = {
      STUDENTS: ['STUDENT'],
      TEACHERS: ['TEACHER'],
      PARENTS:  ['PARENT'],
      STAFF:    ['STAFF', 'HR_ADMIN', 'FINANCE_ADMIN', 'REGISTRAR', 'TENANT_ADMIN'],
    }
    const roles = roleFilter[ann.audience] ?? null

    const [recipients, author, tenant, tenantSettings] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId: ann.tenantId, ...(roles ? { role: { in: roles as any[] } } : {}) },
        select: { email: true, firstName: true },
      }),
      prisma.user.findUnique({ where: { id: ann.authorId }, select: { firstName: true, lastName: true } }),
      prisma.tenant.findUnique({ where: { id: ann.tenantId }, select: { name: true, logoUrl: true } }),
      prisma.tenantSettings.findUnique({ where: { tenantId: ann.tenantId }, select: { primaryColor: true } }),
    ])

    const authorName = author ? `${author.firstName} ${author.lastName}` : 'School Admin'
    const schoolName = tenant?.name ?? 'Your School'

    for (const r of recipients) {
      sendAnnouncementEmail({
        to: r.email, firstName: r.firstName, schoolName,
        title: ann.title, body: ann.body, authorName,
        logoUrl:    tenant?.logoUrl,
        brandColor: tenantSettings?.primaryColor,
      }).catch(() => {})
    }

    // Create in-app Notification for each recipient
    const userIds = (await prisma.user.findMany({
      where: { tenantId: ann.tenantId, ...(roles ? { role: { in: roles as any[] } } : {}) },
      select: { id: true },
    })).map(u => u.id)

    if (userIds.length > 0) {
      await (prisma as any).notification.createMany({
        data: userIds.map((userId: string) => ({
          tenantId: ann.tenantId,
          userId,
          type:    'ANNOUNCEMENT',
          title:   ann.title,
          body:    ann.body.slice(0, 200),
          link:    '/student/announcements',
        })),
        skipDuplicates: true,
      })
    }

    announcementsPublished++
  }

  // ── Send scheduled newsletters ──────────────────────────────────────────────
  const dueNewsletters = await (prisma as any).newsletter.findMany({
    where: {
      status:      'SCHEDULED',
      scheduledAt: { lte: now },
    },
  })

  for (const nl of dueNewsletters) {
    const roleFilter: Record<string, string[]> = {
      STUDENTS: ['STUDENT'],
      TEACHERS: ['TEACHER'],
      PARENTS:  ['PARENT'],
      STAFF:    ['STAFF', 'HR_ADMIN', 'FINANCE_ADMIN', 'REGISTRAR', 'TENANT_ADMIN'],
    }
    const roles = roleFilter[nl.audience] ?? null

    const [recipients, tenant, tenantSettings] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId: nl.tenantId, ...(roles ? { role: { in: roles as any[] } } : {}) },
        select: { email: true, firstName: true },
      }),
      prisma.tenant.findUnique({ where: { id: nl.tenantId }, select: { name: true, logoUrl: true } }),
      prisma.tenantSettings.findUnique({ where: { tenantId: nl.tenantId }, select: { primaryColor: true } }),
    ])

    const schoolName = tenant?.name ?? 'Your School'

    for (const r of recipients) {
      sendAnnouncementEmail({
        to: r.email, firstName: r.firstName, schoolName,
        title: nl.subject, body: nl.body, authorName: schoolName,
        logoUrl:    tenant?.logoUrl,
        brandColor: tenantSettings?.primaryColor,
      }).catch(() => {})
    }

    await (prisma as any).newsletter.update({
      where: { id: nl.id },
      data:  { status: 'SENT', sentAt: now, recipientCount: recipients.length },
    })

    newslettersSent++
  }

  return NextResponse.json({ announcementsPublished, newslettersSent })
}
