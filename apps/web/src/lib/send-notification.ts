import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase-admin'

type NotifyOptions = {
  tenantId: string
  userId: string
  type?: string
  title: string
  body: string
  link?: string
}

/**
 * Creates an in-app Notification record and sends FCM push if the user
 * has push notifications enabled and has a registered FCM token.
 */
export async function notifyUser(opts: NotifyOptions) {
  const { tenantId, userId, title, body, link } = opts

  // 1. Create in-app notification record
  await prisma.notification.create({
    data: {
      tenantId,
      userId,
      type: (opts.type as any) ?? 'GENERAL',
      title,
      body,
      link,
    },
  })

  // 2. Send push if enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true, pushNotifications: true },
  })

  if (user?.pushNotifications && user.fcmToken) {
    await sendPushNotification({ token: user.fcmToken, title, body, link })
  }
}

/**
 * Notify multiple users at once (e.g. broadcast to a class).
 */
export async function notifyUsers(users: Array<{ id: string; tenantId: string }>, opts: Omit<NotifyOptions, 'userId' | 'tenantId'>) {
  await Promise.all(users.map(u => notifyUser({ ...opts, userId: u.id, tenantId: u.tenantId })))
}
