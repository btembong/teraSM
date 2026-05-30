import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend   = new Resend(process.env.RESEND_API_KEY)
const FROM     = process.env.EMAIL_FROM_TERA    ?? 'Tera SM <hello@terasms.com>'
const TEAM     = process.env.DEMO_NOTIFY_EMAIL  ?? 'hello@terasms.com'
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://terasms.com'

function base(body: string) {
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

function rows(data: Record<string, string>) {
  return Object.entries(data)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="font-size:13px;color:#64748b;width:140px;padding:4px 0;">${k}</td><td style="font-size:13px;color:#0f172a;padding:4px 0;">${v}</td></tr>`)
    .join('')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tab, data } = body as { tab: 'demo' | 'sales' | 'support'; data: Record<string, string> }

    if (!tab || !data) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const email     = data.email || ''
    const name      = data.name  || ''
    const firstName = name.split(' ')[0] || 'there'

    if (process.env.RESEND_API_KEY) {
      if (tab === 'demo') {
        // Confirmation to the person
        await resend.emails.send({
          from: FROM, to: email,
          subject: 'Your Tera SM demo is booked',
          html: base(`
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Demo booked, ${firstName}!</h1>
            <p style="margin:12px 0;font-size:15px;color:#475569;line-height:1.6;">
              We've received your request and one of our team members will reach out within 24 hours
              with a calendar invite and video call link tailored to your institution.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:20px;margin:20px 0;">
              <tr><td>
                <p style="margin:0 0 10px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your details</p>
                <table width="100%">${rows({ Institution: data.school, Role: data.role, 'Institution type': data.type, Students: data.students })}</table>
              </td></tr>
            </table>
            <p style="font-size:14px;color:#475569;line-height:1.6;">
              In the meantime, start your <a href="${APP_URL}/register" style="color:#6366f1;font-weight:600;">14-day free trial</a> — no credit card required.
            </p>
            <p style="margin:20px 0 4px;font-size:14px;color:#475569;">Looking forward to the call,</p>
            <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">The Tera SM Team</p>
          `),
        })
        // Internal notification
        await resend.emails.send({
          from: FROM, to: TEAM, replyTo: email,
          subject: `New demo request — ${data.school || email}`,
          html: base(`
            <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">New demo booking</h1>
            <table width="100%">${rows({ Name: name, Email: email, Institution: data.school, Role: data.role, Type: data.type, Students: data.students, Phone: data.phone, Message: data.message })}</table>
          `),
        })
      } else if (tab === 'sales') {
        await resend.emails.send({
          from: FROM, to: email,
          subject: 'Tera SM sales enquiry received',
          html: base(`
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Got your enquiry, ${firstName}!</h1>
            <p style="margin:12px 0;font-size:15px;color:#475569;line-height:1.6;">
              Our sales team will review your requirements and get back to you with a tailored proposal within one business day.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:20px;margin:20px 0;">
              <tr><td><table width="100%">${rows({ Institution: data.school, Students: data.students, 'Current system': data.current, Timeline: data.timeline, Budget: data.budget })}</table></td></tr>
            </table>
            <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">The Tera SM Team</p>
          `),
        })
        await resend.emails.send({
          from: FROM, to: TEAM, replyTo: email,
          subject: `Sales enquiry — ${data.school || email}`,
          html: base(`
            <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">New sales enquiry</h1>
            <table width="100%">${rows({ Name: name, Email: email, Institution: data.school, Students: data.students, 'Current system': data.current, Timeline: data.timeline, Budget: data.budget, Goals: data.goals })}</table>
          `),
        })
      } else if (tab === 'support') {
        await resend.emails.send({
          from: FROM, to: email,
          subject: `Support ticket received: ${data.subject || 'your request'}`,
          html: base(`
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Ticket received</h1>
            <p style="margin:12px 0;font-size:15px;color:#475569;line-height:1.6;">
              We've logged your support request. Our team will respond based on your priority level.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:20px;margin:20px 0;">
              <tr><td><table width="100%">${rows({ Subject: data.subject, Type: data.issue, Priority: data.priority })}</table></td></tr>
            </table>
          `),
        })
        await resend.emails.send({
          from: FROM, to: TEAM, replyTo: email,
          subject: `[Support] ${data.priority || ''} — ${data.subject || email}`,
          html: base(`
            <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">Support ticket</h1>
            <table width="100%">${rows({ Email: email, Subject: data.subject, Type: data.issue, Priority: data.priority, Description: data.description })}</table>
          `),
        })
      }
    } else {
      console.log(`[CONTACT:${tab}]`, data)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
