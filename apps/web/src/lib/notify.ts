/**
 * Unified notification helper.
 * Always creates an in-app notification. Optionally sends email, SMS, and push.
 */
import { prisma } from './prisma'
import { Resend } from 'resend'
import { sendPushNotification } from './firebase-admin'

const resend = new Resend(process.env.RESEND_API_KEY)
const emailConfigured = !!process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'Tera SM <no-reply@terasms.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export type NotifyOpts = {
  tenantId: string
  userId: string
  title: string
  body: string
  link?: string
  type?: string
  /** If provided, also sends an email */
  email?: {
    to: string
    subject: string
    /** Optional HTML override — a default template is used if omitted */
    html?: string
  }
  /** If provided, also logs/stubs an SMS */
  sms?: {
    to: string
    message: string
  }
}

function defaultEmailHtml(title: string, body: string, link?: string): string {
  const btnHtml = link
    ? `<a href="${link}" style="display:inline-block;margin:20px 0 8px;padding:12px 28px;background:#2563eb;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">View Details</a>`
    : ''
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr><td style="background:#1e293b;padding:20px 28px;">
          <span style="font-size:18px;font-weight:700;color:#fff;">Tera<span style="color:#6366f1;">SM</span></span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">${title}</h2>
          <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">${body}</p>
          ${btnHtml}
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Tera SM &middot; <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">terasms.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function notify(opts: NotifyOpts): Promise<void> {
  // 1. In-app notification (always)
  await prisma.notification.create({
    data: {
      tenantId: opts.tenantId,
      userId: opts.userId,
      title: opts.title,
      body: opts.body,
      link: opts.link,
      type: (opts.type ?? 'GENERAL') as any,
    },
  })

  // 2. Check user notification preferences
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { emailNotifications: true, smsNotifications: true, pushNotifications: true, fcmToken: true },
  })

  // 3. Email
  if (opts.email && user?.emailNotifications !== false) {
    const html = opts.email.html ?? defaultEmailHtml(opts.title, opts.body, opts.link ? `${APP_URL}${opts.link}` : undefined)
    if (emailConfigured) {
      try {
        await resend.emails.send({ from: FROM, to: opts.email.to, subject: opts.email.subject, html })
      } catch (err) {
        console.error('[NOTIFY] email send failed:', err)
      }
    } else {
      console.log(`[EMAIL] To: ${opts.email.to} | Subject: ${opts.email.subject}`)
    }
  }

  // 4. SMS (stub — integrate Africa's Talking / Twilio here)
  if (opts.sms && user?.smsNotifications) {
    console.log(`[SMS STUB] To: ${opts.sms.to} | ${opts.sms.message}`)
    // TODO: await africasTalking.sendSMS({ to: opts.sms.to, message: opts.sms.message })
  }

  // 5. Push notification via FCM
  if (user?.pushNotifications !== false && user?.fcmToken) {
    await sendPushNotification({
      token: user.fcmToken,
      title: opts.title,
      body: opts.body,
      link: opts.link ? `${APP_URL}${opts.link}` : undefined,
    })
  }
}
