import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Fallback: log emails in dev if Resend not configured
const configured = !!process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'Tera SM <no-reply@terasms.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── helpers ────────────────────────────────────────────────────────────────

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:24px 32px;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Tera<span style="color:#6366f1;">SM</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${body}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              &copy; ${new Date().getFullYear()} Tera SM. All rights reserved.<br/>
              <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">terasms.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(url: string, text: string): string {
  return `<a href="${url}" style="display:inline-block;margin:24px 0 8px;padding:12px 28px;background:#6366f1;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${text}</a>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">${text}</h1>`
}

function p(text: string): string {
  return `<p style="margin:12px 0;font-size:15px;color:#475569;line-height:1.6;">${text}</p>`
}

function small(text: string): string {
  return `<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">${text}</p>`
}

// ─── send wrapper ────────────────────────────────────────────────────────────

async function send(opts: { to: string; subject: string; html: string }) {
  if (!configured) {
    console.log(`[EMAIL] To: ${opts.to} | Subject: ${opts.subject}`)
    return
  }
  await resend.emails.send({ from: FROM, ...opts })
}

// ─── templates ──────────────────────────────────────────────────────────────

/**
 * Sent when an admin creates an email-specific invite.
 */
export async function sendInviteEmail(opts: {
  to: string
  schoolName: string
  role: string
  inviteUrl: string
  expiresAt?: Date | null
}) {
  const roleFriendly = opts.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  const expiry = opts.expiresAt
    ? `This invitation expires on <strong>${opts.expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.`
    : 'This invitation does not expire.'

  const body = `
    ${h1(`You've been invited to ${opts.schoolName}`)}
    ${p(`You have been invited to join <strong>${opts.schoolName}</strong> on Tera SM as a <strong>${roleFriendly}</strong>.`)}
    ${p('Click the button below to set up your account.')}
    ${btn(opts.inviteUrl, 'Accept Invitation')}
    ${p(`Or copy this link: <a href="${opts.inviteUrl}" style="color:#6366f1;">${opts.inviteUrl}</a>`)}
    ${small(expiry + ' If you were not expecting this invitation, you can ignore this email.')}
  `

  await send({
    to: opts.to,
    subject: `You've been invited to ${opts.schoolName} on Tera SM`,
    html: baseLayout(`Invitation to ${opts.schoolName}`, body),
  })
}

/**
 * Sent when a new user account is created (direct creation or CSV import).
 */
export async function sendWelcomeEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  loginUrl?: string
  temporaryPassword?: string
}) {
  const loginUrl = opts.loginUrl ?? `${APP_URL}/login`

  const passwordRow = opts.temporaryPassword
    ? `<tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Temporary password</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;font-family:monospace;">${opts.temporaryPassword}</td>
       </tr>`
    : ''

  const body = `
    ${h1(`Welcome to ${opts.schoolName}, ${opts.firstName}!`)}
    ${p(`Your account has been created on <strong>${opts.schoolName}</strong>'s Tera SM portal. Here are your login details:`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Email</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.to}</td>
      </tr>
      ${passwordRow}
    </table>
    ${opts.temporaryPassword ? p('Please log in and change your password immediately.') : ''}
    ${btn(loginUrl, 'Log In Now')}
    ${small('If you did not expect this account, please contact your school administrator.')}
  `

  await send({
    to: opts.to,
    subject: `Welcome to ${opts.schoolName} — your account is ready`,
    html: baseLayout(`Welcome to ${opts.schoolName}`, body),
  })
}

/**
 * Sent when an admin resets a user's password.
 */
export async function sendPasswordResetEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  newPassword: string
  loginUrl?: string
}) {
  const loginUrl = opts.loginUrl ?? `${APP_URL}/login`

  const body = `
    ${h1('Your password has been reset')}
    ${p(`Hi <strong>${opts.firstName}</strong>, an administrator at <strong>${opts.schoolName}</strong> has reset your password.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">New password</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#0f172a;font-family:monospace;">${opts.newPassword}</td>
      </tr>
    </table>
    ${p('Please log in and change your password as soon as possible.')}
    ${btn(loginUrl, 'Log In Now')}
    ${small('If you did not request a password reset, please contact your school administrator immediately.')}
  `

  await send({
    to: opts.to,
    subject: 'Your Tera SM password has been reset',
    html: baseLayout('Password Reset', body),
  })
}

/**
 * Sent when a user completes self-registration via invite link.
 */
export async function sendRegistrationConfirmEmail(opts: {
  to: string
  firstName: string
  schoolName: string
}) {
  const loginUrl = `${APP_URL}/login`

  const body = `
    ${h1(`You're all set, ${opts.firstName}!`)}
    ${p(`Your account on <strong>${opts.schoolName}</strong>'s Tera SM portal has been activated.`)}
    ${p('You can now log in and access your personalized dashboard.')}
    ${btn(loginUrl, 'Go to Dashboard')}
    ${small('Welcome aboard — we\'re excited to have you.')}
  `

  await send({
    to: opts.to,
    subject: `Account activated — welcome to ${opts.schoolName}`,
    html: baseLayout('Account Activated', body),
  })
}
