import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM_TERA ?? 'Tera SM <hello@terasms.com>'
const TEAM   = process.env.DEMO_NOTIFY_EMAIL ?? 'hello@getpontis.xyz'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://terasms.com'

const Schema = z.object({
  name:   z.string().min(1),
  email:  z.string().email(),
  school: z.string().min(1),
  role:   z.string().min(1),
  count:  z.string().min(1),
  slot:   z.string().min(1),
})

function baseLayout(body: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Tera SM</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#1e293b;padding:24px 32px;">
  <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Tera<span style="color:#6366f1;">SM</span></span>
</td></tr>
<tr><td style="padding:32px;">${body}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
  <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Tera SM &nbsp;·&nbsp;
  <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">terasms.com</a></p>
</td></tr>
</table>
</td></tr>
</table></body></html>`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data.' }, { status: 400 })
    }

    const { name, email, school, role, count, slot } = parsed.data
    const firstName = name.split(' ')[0]

    if (process.env.RESEND_API_KEY) {
      // Confirmation to the person booking
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `Demo confirmed — ${slot}`,
        html: baseLayout(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Your demo is booked, ${firstName}!</h1>
          <p style="margin:12px 0;font-size:15px;color:#475569;line-height:1.6;">
            We've received your request for a live Tera SM walkthrough. One of our team members will
            send you a calendar invite and video call link within a few hours.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:20px;margin:24px 0;">
            <tr><td>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Booking summary</p>
              <table width="100%" cellpadding="4">
                <tr><td style="font-size:13px;color:#64748b;width:120px;">Slot</td><td style="font-size:13px;color:#0f172a;font-weight:600;">${slot}</td></tr>
                <tr><td style="font-size:13px;color:#64748b;">Institution</td><td style="font-size:13px;color:#0f172a;">${school}</td></tr>
                <tr><td style="font-size:13px;color:#64748b;">Your role</td><td style="font-size:13px;color:#0f172a;">${role}</td></tr>
                <tr><td style="font-size:13px;color:#64748b;">Students</td><td style="font-size:13px;color:#0f172a;">${count}</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:12px 0;font-size:14px;color:#475569;line-height:1.6;">
            While you wait, you can start your <a href="${APP_URL}/register" style="color:#6366f1;text-decoration:none;font-weight:600;">14-day free trial</a> — no credit card required.
          </p>
          <p style="margin:24px 0 4px;font-size:14px;color:#475569;">Looking forward to the call,</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">The Tera SM Team</p>
        `),
      })

      // Notification to the internal team
      await resend.emails.send({
        from: FROM,
        to: TEAM,
        subject: `New demo request — ${school} (${slot})`,
        html: baseLayout(`
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">New demo booking</h1>
          <table width="100%" cellpadding="4" style="margin:20px 0;">
            <tr><td style="font-size:13px;color:#64748b;width:120px;">Name</td><td style="font-size:13px;color:#0f172a;font-weight:600;">${name}</td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Email</td><td style="font-size:13px;color:#0f172a;"><a href="mailto:${email}" style="color:#6366f1;">${email}</a></td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Institution</td><td style="font-size:13px;color:#0f172a;">${school}</td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Role</td><td style="font-size:13px;color:#0f172a;">${role}</td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Students</td><td style="font-size:13px;color:#0f172a;">${count}</td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Slot</td><td style="font-size:14px;font-weight:700;color:#6366f1;">${slot}</td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#94a3b8;">Reply directly to this email to reach ${firstName}.</p>
        `),
        replyTo: email,
      })
    } else {
      console.log(`[DEMO BOOKING] ${name} <${email}> — ${school} — ${slot}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[book-demo]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
