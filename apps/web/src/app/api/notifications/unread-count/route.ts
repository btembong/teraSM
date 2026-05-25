import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ announcements: 0, notifications: 0 })

  const userId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  // Count published announcements for this user (ALL or STUDENTS)
  const totalAnnouncements = await prisma.announcement.count({
    where: {
      tenantId,
      isPublished: true,
      OR: [{ audience: 'ALL' }, { audience: 'STUDENTS' }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
    },
  })

  // Count how many have been read
  const readCount = await (prisma as any).announcementRead.count({
    where: { userId, tenantId },
  })

  const unreadAnnouncements = Math.max(0, totalAnnouncements - readCount)

  // Count unread in-app notifications
  const unreadNotifications = await prisma.notification.count({
    where: { tenantId, userId, isRead: false },
  })

  return NextResponse.json({ announcements: unreadAnnouncements, notifications: unreadNotifications })
}
