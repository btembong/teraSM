import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  otpStore, generateOtp, isExpired,
  OTP_TTL_MS, OTP_MAX_RESENDS,
} from '@/lib/otp-store'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Rate-limit: block if too many requests within the TTL window
    const existing = otpStore.get(email)
    if (existing && !isExpired(existing) && existing.attempts >= OTP_MAX_RESENDS) {
      return NextResponse.json(
        { error: 'Too many requests. Wait 10 minutes before requesting another code.' },
        { status: 429 },
      )
    }

    const code      = generateOtp()
    const expiresAt = Date.now() + OTP_TTL_MS
    otpStore.set(email, {
      code,
      expiresAt,
      attempts: (existing && !isExpired(existing) ? existing.attempts : 0) + 1,
    })

    const apiKey = process.env.RESEND_API_KEY
    const from   = process.env.EMAIL_FROM ?? 'Tera SM <noreply@terasms.com>'

    if (apiKey) {
      // ── Real email via Resend ──────────────────────────────
      const resend = new Resend(apiKey)
      const { error } = await resend.emails.send({
        from,
        to:      email,
        subject: `${code} is your Tera SM verification code`,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:40px 32px">
      <tr><td>
        <!-- Logo -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr>
            <td style="width:40px;height:40px;background:#2563EB;border-radius:10px;text-align:center;vertical-align:middle">
              <span style="color:#fff;font-weight:800;font-size:20px">T</span>
            </td>
            <td style="padding-left:10px;font-weight:700;font-size:18px;color:#111827">Tera SM</td>
          </tr>
        </table>

        <!-- Heading -->
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827">Verify your email address</h1>
        <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6">
          Enter this code in the registration form to confirm your email.
        </p>

        <!-- OTP box -->
        <div style="background:#f3f4f6;border-radius:12px;padding:24px 0;text-align:center;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;font-weight:600">Verification code</p>
          <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:0.22em;color:#111827;font-family:monospace">${code}</p>
          <p style="margin:8px 0 0;font-size:13px;color:#9ca3af">Expires in 10 minutes</p>
        </div>

        <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
      })

      if (error) {
        console.error('[send-otp] Resend error:', error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
      }
    } else {
      // ── Dev fallback — print to terminal ──────────────────
      console.log('\n╔══════════════════════════════════════╗')
      console.log(`║  OTP CODE (no RESEND_API_KEY set)    ║`)
      console.log(`║  Email : ${email.substring(0, 27).padEnd(27)} ║`)
      console.log(`║  Code  : ${code}                       ║`)
      console.log(`║  Valid for 10 minutes                ║`)
      console.log('╚══════════════════════════════════════╝\n')
    }

    return NextResponse.json({ success: true, dev: !apiKey })
  } catch (err) {
    console.error('[send-otp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
