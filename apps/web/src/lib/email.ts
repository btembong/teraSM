import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Fallback: log emails in dev if Resend not configured
const configured = !!process.env.RESEND_API_KEY
const FROM      = process.env.EMAIL_FROM      ?? 'Tera SM <no-reply@terasms.com>'
const FROM_TERA = process.env.EMAIL_FROM_TERA ?? 'Tera SM <hello@terasms.com>'
const NOREPLY   = process.env.EMAIL_NOREPLY   ?? 'no-reply@terasms.com'

// Build a school-branded sender: "Fomic Polytechnic <no-reply@terasms.com>"
function schoolFrom(name: string) { return `${name} <${NOREPLY}>` }
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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

function btn(url: string, text: string, color?: string | null): string {
  const bg = color ?? '#6366f1'
  return `<a href="${url}" style="display:inline-block;margin:24px 0 8px;padding:12px 28px;background:${bg};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${text}</a>`
}

// School-branded layout — logo/initials badge, brand color accent, school footer
function schoolLayout(
  schoolName: string,
  title: string,
  body: string,
  logoUrl?: string | null,
  brandColor?: string | null,
): string {
  const color   = brandColor ?? '#6366f1'
  const year    = new Date().getFullYear()
  const initial = schoolName.charAt(0).toUpperCase()

  const headerLogo = logoUrl
    ? `<img src="${logoUrl}" alt="${schoolName}" style="height:40px;max-width:200px;object-fit:contain;vertical-align:middle;" />`
    : `<span style="display:inline-block;width:40px;height:40px;border-radius:10px;background:${color};color:#ffffff;font-size:20px;font-weight:800;text-align:center;line-height:40px;font-family:Inter,sans-serif;vertical-align:middle;">${initial}</span>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Brand accent bar -->
        <tr><td style="background:${color};height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <!-- Header -->
        <tr>
          <td style="padding:24px 32px 20px;border-bottom:1px solid #f1f5f9;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="vertical-align:middle;">${headerLogo}</td>
                <td style="vertical-align:middle;text-align:right;padding-left:12px;">
                  <span style="font-size:13px;font-weight:600;color:#64748b;">${schoolName}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${body}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:18px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size:12px;color:#64748b;">&copy; ${year} ${schoolName}</td>
                <td style="font-size:12px;color:#cbd5e1;text-align:right;">
                  Delivered via <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;font-weight:500;">Tera SM</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
        This email was sent by ${schoolName} through the Tera SM platform.
      </p>
    </td></tr>
  </table>
</body>
</html>`
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

async function send(opts: { to: string; subject: string; html: string; from?: string }) {
  if (!configured) {
    console.log(`[EMAIL] To: ${opts.to} | Subject: ${opts.subject}`)
    return
  }
  const { from: customFrom, ...rest } = opts
  await resend.emails.send({ from: customFrom ?? FROM, ...rest })
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
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const roleFriendly = opts.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  const expiry = opts.expiresAt
    ? `This invitation expires on <strong>${opts.expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.`
    : 'This invitation does not expire.'

  const body = `
    ${h1(`You've been invited to ${opts.schoolName}`)}
    ${p(`You have been invited to join <strong>${opts.schoolName}</strong> on Tera SM as a <strong>${roleFriendly}</strong>.`)}
    ${p('Click the button below to set up your account.')}
    ${btn(opts.inviteUrl, 'Accept Invitation', opts.brandColor)}
    ${p(`Or copy this link: <a href="${opts.inviteUrl}" style="color:#6366f1;">${opts.inviteUrl}</a>`)}
    ${small(expiry + ' If you were not expecting this invitation, you can ignore this email.')}
  `

  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `You've been invited to ${opts.schoolName} on Tera SM`,
    html: schoolLayout(opts.schoolName, `Invitation to ${opts.schoolName}`, body, opts.logoUrl, opts.brandColor),
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
  logoUrl?: string | null
  brandColor?: string | null
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
    ${btn(loginUrl, 'Log In Now', opts.brandColor)}
    ${small('If you did not expect this account, please contact your school administrator.')}
  `

  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Welcome to ${opts.schoolName} — your account is ready`,
    html: schoolLayout(opts.schoolName, `Welcome to ${opts.schoolName}`, body, opts.logoUrl, opts.brandColor),
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
  logoUrl?: string | null
  brandColor?: string | null
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
    ${btn(loginUrl, 'Log In Now', opts.brandColor)}
    ${small('If you did not request a password reset, please contact your school administrator immediately.')}
  `

  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Your ${opts.schoolName} password has been reset`,
    html: schoolLayout(opts.schoolName, 'Password Reset', body, opts.logoUrl, opts.brandColor),
  })
}

/**
 * Sent to a student when their submission has been graded.
 */
export async function sendGradeNotificationEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  assignmentTitle: string
  score: number
  maxScore: number
  logoUrl?: string | null
  brandColor?: string | null
  feedback?: string | null
}) {
  const pct   = Math.round((opts.score / opts.maxScore) * 100)
  const grade = pct >= 70 ? '🟢 Good' : pct >= 50 ? '🟡 Fair' : '🔴 Needs Improvement'

  const feedbackRow = opts.feedback
    ? `<div style="margin:16px 0;padding:16px;background:#f8fafc;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Teacher Feedback</p>
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${opts.feedback}</p>
       </div>`
    : ''

  const body = `
    ${h1(`Assignment graded: ${opts.assignmentTitle}`)}
    ${p(`Hi <strong>${opts.firstName}</strong>, your submission has been reviewed.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;font-size:14px;color:#475569;">Score</td>
        <td style="padding:12px 16px;font-size:20px;font-weight:700;color:#0f172a;">${opts.score} / ${opts.maxScore}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;color:#475569;">Percentage</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#0f172a;">${pct}% — ${grade}</td>
      </tr>
    </table>
    ${feedbackRow}
    ${btn(`${APP_URL}/student/assignments`, 'View My Assignments', opts.brandColor)}
    ${small(`This grade was recorded on ${opts.schoolName}'s learning portal.`)}
  `

  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Your assignment has been graded — ${opts.assignmentTitle}`,
    html: schoolLayout(opts.schoolName, 'Assignment Graded', body, opts.logoUrl, opts.brandColor),
  })
}

/**
 * Sent to an employee when their leave request is approved or rejected.
 */
export async function sendLeaveDecisionEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  leaveType: string
  startDate: Date
  endDate: Date
  days: number
  status: 'APPROVED' | 'REJECTED'
  note?: string | null
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const approved  = opts.status === 'APPROVED'
  const dateRange = `${opts.startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} – ${opts.endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`

  const noteRow = !approved && opts.note
    ? `<div style="margin:16px 0;padding:16px;background:#fef2f2;border-left:3px solid #f87171;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Reason</p>
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${opts.note}</p>
       </div>`
    : ''

  const body = `
    ${h1(`Leave request ${approved ? 'approved' : 'rejected'}`)}
    ${p(`Hi <strong>${opts.firstName}</strong>, your leave request has been <strong>${approved ? 'approved ✅' : 'rejected ❌'}</strong>.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Leave type</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.leaveType}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Duration</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${dateRange}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Days</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.days} day${opts.days !== 1 ? 's' : ''}</td>
      </tr>
    </table>
    ${noteRow}
    ${btn(`${APP_URL}/staff/leave`, 'View Leave History', opts.brandColor)}
    ${small(`${opts.schoolName} HR Department`)}
  `

  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Your leave request has been ${approved ? 'approved' : 'rejected'}`,
    html: schoolLayout(opts.schoolName, `Leave Request ${approved ? 'Approved' : 'Rejected'}`, body, opts.logoUrl, opts.brandColor),
  })
}

/**
 * Sent to users when an announcement is published for their audience.
 */
export async function sendAnnouncementEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  title: string
  body: string
  authorName: string
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const emailBody = `
    ${h1(opts.title)}
    ${p(`Hi <strong>${opts.firstName}</strong>, a new announcement has been posted at <strong>${opts.schoolName}</strong>.`)}
    <div style="margin:16px 0;padding:20px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <p style="margin:0;font-size:15px;color:#334155;line-height:1.7;">${opts.body}</p>
    </div>
    <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">Posted by ${opts.authorName}</p>
    ${btn(`${APP_URL}/student/announcements`, 'View Announcement', opts.brandColor)}
    ${small(`You received this because you are a member of ${opts.schoolName}.`)}
  `

  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `[${opts.schoolName}] ${opts.title}`,
    html: schoolLayout(opts.schoolName, opts.title, emailBody, opts.logoUrl, opts.brandColor),
  })
}

// ════════════════════════════════════════════════════════════════════════════
// ADMISSIONS (school → applicant)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Trigger 1 — Application submitted.
 */
export async function sendAdmissionReceivedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  referenceNumber: string
  trackingUrl: string
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const body = `
    ${h1(`Application received, ${opts.firstName}!`)}
    ${p(`Thank you for applying to <strong>${opts.schoolName}</strong>. We have received your application and will review it shortly.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;font-size:14px;color:#475569;">Reference number</td>
        <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#0f172a;font-family:monospace;">${opts.referenceNumber}</td>
      </tr>
    </table>
    ${p('You can check the status of your application at any time using your tracking link:')}
    ${btn(opts.trackingUrl, 'Track My Application', opts.brandColor)}
    ${p(`Or copy this link: <a href="${opts.trackingUrl}" style="color:#6366f1;word-break:break-all;">${opts.trackingUrl}</a>`)}
    ${small('Keep this email safe — your tracking link is unique to your application. If you did not submit this application, please disregard this email.')}
  `
  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Application received — ${opts.referenceNumber} | ${opts.schoolName}`,
    html: schoolLayout(opts.schoolName, 'Application Received', body, opts.logoUrl, opts.brandColor),
  })
}

/**
 * Trigger 2 — Application moved to review stage.
 */
export async function sendAdmissionUnderReviewEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  referenceNumber: string
  trackingUrl: string
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const body = `
    ${h1('Your application is being reviewed')}
    ${p(`Hi <strong>${opts.firstName}</strong>, good news — your application to <strong>${opts.schoolName}</strong> is now under active review by our admissions team.`)}
    ${p('This stage may take a few days. You do not need to do anything at this time. We will contact you when a decision has been made.')}
    ${btn(opts.trackingUrl, 'View Application Status', opts.brandColor)}
    ${small(`Reference: ${opts.referenceNumber}. If you have any questions, please contact the admissions office directly.`)}
  `
  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Your application is under review — ${opts.schoolName}`,
    html: schoolLayout(opts.schoolName, 'Application Under Review', body, opts.logoUrl, opts.brandColor),
  })
}

/**
 * Trigger 3 — Offer extended.
 */
export async function sendAdmissionOfferedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  referenceNumber: string
  programOfInterest?: string | null
  offerExpiry?: Date | null
  offerLetterUrl?: string | null
  trackingUrl: string
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const expiryDate = opts.offerExpiry
    ? opts.offerExpiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const offerLetterRow = opts.offerLetterUrl
    ? `<tr><td style="padding:12px 16px;font-size:14px;color:#475569;">Offer letter</td>
       <td style="padding:12px 16px;"><a href="${opts.offerLetterUrl}" style="color:#6366f1;font-weight:600;">Download PDF</a></td></tr>`
    : ''

  const body = `
    ${h1(`Congratulations, ${opts.firstName}!`)}
    ${p(`We are delighted to offer you a place at <strong>${opts.schoolName}</strong>${opts.programOfInterest ? ` to study <strong>${opts.programOfInterest}</strong>` : ''}.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;font-size:14px;color:#475569;">Reference</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.referenceNumber}</td>
      </tr>
      ${opts.programOfInterest ? `<tr><td style="padding:12px 16px;font-size:14px;color:#475569;">Program</td><td style="padding:12px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.programOfInterest}</td></tr>` : ''}
      ${expiryDate ? `<tr style="background:#f8fafc;"><td style="padding:12px 16px;font-size:14px;color:#475569;">Offer expires</td><td style="padding:12px 16px;font-size:14px;font-weight:600;color:#dc2626;">${expiryDate}</td></tr>` : ''}
      ${offerLetterRow}
    </table>
    ${p('Please contact the admissions office to formally accept or decline this offer before the expiry date.')}
    ${btn(opts.trackingUrl, 'View My Offer', opts.brandColor)}
    ${small('This offer is subject to verification of your submitted documents. Congratulations once again — we look forward to welcoming you.')}
  `
  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Congratulations! You have an offer from ${opts.schoolName}`,
    html: schoolLayout(opts.schoolName, 'Admission Offer', body, opts.logoUrl, opts.brandColor),
  })
}

/**
 * Trigger 4 — Waitlisted.
 */
export async function sendAdmissionWaitlistedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  referenceNumber: string
  waitlistPosition?: number | null
  trackingUrl: string
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const positionRow = opts.waitlistPosition
    ? `<div style="margin:20px 0;text-align:center;padding:20px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
        <p style="margin:0 0 4px;font-size:13px;color:#9a3412;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Your Waitlist Position</p>
        <p style="margin:0;font-size:48px;font-weight:800;color:#ea580c;font-family:monospace;">#${opts.waitlistPosition}</p>
       </div>`
    : ''

  const body = `
    ${h1('You have been placed on the waitlist')}
    ${p(`Hi <strong>${opts.firstName}</strong>, thank you for your application to <strong>${opts.schoolName}</strong>.`)}
    ${p('After careful review, we have placed you on our admissions waitlist. This means you are a competitive candidate, and we will contact you if a place becomes available.')}
    ${positionRow}
    ${p('You do not need to take any action at this time. We will notify you automatically if your status changes.')}
    ${btn(opts.trackingUrl, 'Track My Application', opts.brandColor)}
    ${small(`Reference: ${opts.referenceNumber}. We appreciate your patience and interest in ${opts.schoolName}.`)}
  `
  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Application update — waitlisted at ${opts.schoolName}`,
    html: schoolLayout(opts.schoolName, 'Waitlist Update', body, opts.logoUrl, opts.brandColor),
  })
}

/**
 * Trigger 5 — Application unsuccessful.
 */
export async function sendAdmissionRejectedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  referenceNumber: string
  rejectionReason?: string | null
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const reasonBlock = opts.rejectionReason
    ? `<div style="margin:16px 0;padding:16px;background:#f8fafc;border-left:3px solid #e2e8f0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Feedback from Admissions</p>
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${opts.rejectionReason}</p>
       </div>`
    : ''

  const body = `
    ${h1('Thank you for your application')}
    ${p(`Hi <strong>${opts.firstName}</strong>, thank you for the time and effort you put into your application to <strong>${opts.schoolName}</strong>.`)}
    ${p('After thorough consideration, we regret to inform you that we are unable to offer you a place at this time. This decision was not taken lightly, and we appreciate your interest in our institution.')}
    ${reasonBlock}
    ${p('We encourage you to continue pursuing your educational goals and wish you all the best in your next steps.')}
    ${small(`Reference: ${opts.referenceNumber}. If you have questions about this decision, please contact the admissions office directly.`)}
  `
  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Application outcome — ${opts.schoolName}`,
    html: schoolLayout(opts.schoolName, 'Application Outcome', body, opts.logoUrl, opts.brandColor),
  })
}

/**
 * Trigger 6 — Student account created after offer acceptance.
 */
export async function sendAdmissionEnrolledEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  temporaryPassword: string
  loginUrl?: string
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const loginUrl = opts.loginUrl ?? `${APP_URL}/login`
  const body = `
    ${h1(`Welcome to ${opts.schoolName}, ${opts.firstName}!`)}
    ${p(`Your enrollment is confirmed and your student account has been created. You can now log in to your student portal to access your courses, timetable, and more.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;font-size:14px;color:#475569;">Email</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.to}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;color:#475569;">Temporary password</td>
        <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#0f172a;font-family:monospace;">${opts.temporaryPassword}</td>
      </tr>
    </table>
    ${p('<strong>Important:</strong> Please log in and change your password immediately after your first sign-in.')}
    ${btn(loginUrl, 'Log In to Student Portal', opts.brandColor)}
    ${small(`Welcome aboard — we're thrilled to have you at ${opts.schoolName}. If you have any trouble logging in, contact the admissions office.`)}
  `
  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Welcome to ${opts.schoolName} — your student account is ready`,
    html: schoolLayout(opts.schoolName, 'Student Account Created', body, opts.logoUrl, opts.brandColor),
  })
}

/**
 * Sent when a user completes self-registration via invite link.
 */
export async function sendRegistrationConfirmEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const loginUrl = `${APP_URL}/login`

  const body = `
    ${h1(`You're all set, ${opts.firstName}!`)}
    ${p(`Your account on <strong>${opts.schoolName}</strong>'s Tera SM portal has been activated.`)}
    ${p('You can now log in and access your personalized dashboard.')}
    ${btn(loginUrl, 'Go to Dashboard', opts.brandColor)}
    ${small('Welcome aboard — we\'re excited to have you.')}
  `

  await send({
    from: schoolFrom(opts.schoolName),
    to: opts.to,
    subject: `Account activated — welcome to ${opts.schoolName}`,
    html: schoolLayout(opts.schoolName, 'Account Activated', body, opts.logoUrl, opts.brandColor),
  })
}

// ════════════════════════════════════════════════════════════════════════════
// TERA SM → TENANT (SaaS operator emails — sent from Tera to school admins)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tera SM premium layout — Tera → Tenant / operator emails.
 * Design: dark navy hero (logo + glassmorphism title card) ·
 *         white content body · Exo font · indigo→blue gradient accents ·
 *         light footer with faded TeraSM watermark.
 */
function teraLayout(title: string, body: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Exo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Exo',Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Hidden preheader spacer -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:transparent;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <!-- ── FULL-WIDTH DARK BANNER ─────────────────────────────────────────── -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#050a1c 0%,#0c1438 60%,#060d1f 100%);">
    <tr>
      <td style="padding:32px 24px;text-align:center;">
        <span style="font-family:'Exo',Inter,sans-serif;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1.5px;">Tera<span style="color:#818cf8;">SM</span></span>
      </td>
    </tr>
    <!-- Indigo→blue gradient line at bottom of banner -->
    <tr>
      <td style="background:linear-gradient(90deg,#6366f1 0%,#3b82f6 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
    </tr>
  </table>

  <!-- ── CONTENT + FOOTER ────────────────────────────────────────────────── -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:0 16px 56px;">
    <tr><td align="center">

      <!-- Preheader link -->
      <table width="600" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:14px 4px 10px;text-align:center;font-size:12px;color:#94a3b8;font-family:'Exo',Inter,sans-serif;">
            Having trouble viewing this email?&nbsp;
            <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;font-weight:500;font-family:'Exo',Inter,sans-serif;">View in browser</a>
          </td>
        </tr>
      </table>

      <!-- White content card -->
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <tr>
          <td style="padding:44px 52px 52px;font-family:'Exo',Inter,sans-serif;">
            ${body}
          </td>
        </tr>
      </table>

    </td></tr>
  </table>

  <!-- ── FULL-WIDTH FOOTER WITH WATERMARK ──────────────────────────────── -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
    <tr>
      <td style="position:relative;padding:44px 52px 28px;">

        <!-- TeraSM watermark — large, faint, centered behind content -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:130px;font-weight:900;color:rgba(148,163,184,0.10);letter-spacing:-8px;white-space:nowrap;font-family:'Exo',Inter,sans-serif;pointer-events:none;user-select:none;line-height:1;">TeraSM</div>

        <!-- Footer text — on top of watermark -->
        <div style="position:relative;z-index:1;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align:top;font-size:12px;color:#64748b;line-height:2;font-family:'Exo',Inter,sans-serif;">
                <strong style="color:#334155;font-size:13px;font-family:'Exo',Inter,sans-serif;">Tera SM Technologies</strong><br/>
                The School Operating System<br/>
                <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;font-weight:500;font-family:'Exo',Inter,sans-serif;">terasms.com</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/docs" style="color:#94a3b8;text-decoration:none;font-family:'Exo',Inter,sans-serif;">Docs</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/privacy" style="color:#94a3b8;text-decoration:none;font-family:'Exo',Inter,sans-serif;">Privacy</a>
              </td>
              <td style="vertical-align:top;text-align:right;">
                <a href="${APP_URL}/account/notifications" style="display:block;font-size:11px;color:#94a3b8;text-decoration:none;line-height:2.5;font-family:'Exo',Inter,sans-serif;">Manage Preferences</a>
                <a href="${APP_URL}/unsubscribe" style="display:block;font-size:11px;color:#94a3b8;text-decoration:none;line-height:2.5;font-family:'Exo',Inter,sans-serif;">Unsubscribe</a>
              </td>
            </tr>
          </table>
          <p style="margin:36px 0 0;font-size:11px;color:#cbd5e1;text-align:center;font-family:'Exo',Inter,sans-serif;">&copy; ${year} Tera SM Technologies. All rights reserved.</p>
        </div>

      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Exo 2 helpers for Tera → Tenant emails (white body section) */
function th1(text: string) {
  return `<h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.7px;line-height:1.28;font-family:'Exo',Inter,sans-serif;">${text}</h1>`
}
function tp(text: string) {
  return `<p style="margin:14px 0;font-size:15px;color:#475569;line-height:1.78;font-family:'Exo',Inter,sans-serif;">${text}</p>`
}
function tbtn(url: string, text: string) {
  return `<a href="${url}" style="display:inline-block;margin:28px 0 8px;padding:14px 34px;background:linear-gradient(135deg,#6366f1 0%,#3b82f6 100%);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:-0.1px;font-family:'Exo',Inter,sans-serif;">${text} &rarr;</a>`
}
function tsmall(text: string) {
  return `<p style="margin:28px 0 0;font-size:12px;color:#94a3b8;line-height:1.7;font-family:'Exo',Inter,sans-serif;">${text}</p>`
}
function tbox(rows: { label: string; value: string }[]) {
  const cells = rows.map((r, i) => `
    <tr${i % 2 !== 0 ? ' style="background:#f8fafc;"' : ''}>
      <td style="padding:12px 18px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;white-space:nowrap;font-family:'Exo',Inter,sans-serif;">${r.label}</td>
      <td style="padding:12px 18px;font-size:13px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;font-family:'Exo',Inter,sans-serif;">${r.value}</td>
    </tr>`).join('')
  return `<table style="width:100%;border-collapse:collapse;margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;border-left:4px solid #6366f1;">${cells}</table>`
}

async function sendTera(opts: { to: string; subject: string; html: string }) {
  if (!configured) {
    console.log(`[TERA EMAIL] To: ${opts.to} | Subject: ${opts.subject}`)
    return
  }
  await resend.emails.send({ from: FROM_TERA, ...opts })
}

// ─── Tera → Tenant templates ─────────────────────────────────────────────────

/**
 * Sent to the school admin when their school account is created on Tera SM.
 */
export async function sendTeraWelcomeEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  loginUrl?: string
}) {
  const loginUrl = opts.loginUrl ?? `${APP_URL}/login`
  const body = `
    ${th1(`Welcome to Tera SM, ${opts.firstName}!`)}
    ${tp(`Your school <strong style="color:#1e293b;">${opts.schoolName}</strong> is now live on Tera SM. You can log in and start setting up your portal right away.`)}
    ${tp('Here\'s what to do first:')}
    <ul style="margin:16px 0;padding-left:20px;color:#475569;font-size:14px;line-height:2.2;font-family:'Exo',Inter,sans-serif;">
      <li>Complete your school profile and branding</li>
      <li>Set up your academic year and fee structure</li>
      <li>Add your first staff members and students</li>
    </ul>
    ${tbtn(loginUrl, 'Go to Your School Portal')}
    ${tsmall('Need help? Reply to this email or visit our documentation at terasms.com/docs')}
  `
  await sendTera({
    to: opts.to,
    subject: `Welcome to Tera SM — ${opts.schoolName} is live 🎉`,
    html: teraLayout('Welcome to Tera SM', body),
  })
}

/**
 * Sent when a user requests a 2FA OTP code.
 */
export async function sendOtpEmail(opts: {
  to: string
  firstName: string
  otp: string
  expiresInMinutes?: number
}) {
  const expires = opts.expiresInMinutes ?? 10
  const body = `
    ${th1('Your verification code')}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, use the code below to complete your sign-in.`)}
    <div style="margin:32px 0;text-align:center;">
      <div style="display:inline-block;background:linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(59,130,246,0.12) 100%);border:1px solid rgba(99,102,241,0.4);border-radius:16px;padding:24px 48px;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#6366f1;letter-spacing:0.15em;text-transform:uppercase;font-family:'Exo',Inter,sans-serif;">Verification Code</p>
        <span style="font-size:44px;font-weight:900;letter-spacing:14px;font-family:'Exo',Inter,monospace;background:linear-gradient(135deg,#818cf8,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#818cf8;">${opts.otp}</span>
      </div>
    </div>
    ${tp(`This code expires in <strong style="color:#1e293b;">${expires} minutes</strong>. Do not share it with anyone.`)}
    ${tsmall('If you did not attempt to sign in, your password may be compromised — change it immediately.')}
  `
  await sendTera({
    to: opts.to,
    subject: `${opts.otp} — your Tera SM verification code`,
    html: teraLayout('Verification Code', body),
  })
}

/**
 * Sent when a school's free trial begins.
 */
export async function sendTrialStartEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  trialEndsAt: Date
  plan?: string
}) {
  const endDate = opts.trialEndsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const body = `
    ${th1('Your 14-day free trial has started')}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, your trial of Tera SM ${opts.plan ? `<strong style="color:#1e293b;">${opts.plan}</strong> ` : ''}is now active for <strong style="color:#1e293b;">${opts.schoolName}</strong>.`)}
    ${tbox([
      { label: 'Trial ends', value: endDate },
      { label: 'Plan', value: opts.plan ?? 'Pro' },
      { label: 'Credit card required?', value: 'No' },
    ])}
    ${tp('You have full access to all features during your trial. No credit card required until you upgrade.')}
    ${tbtn(`${APP_URL}/admin`, 'Set Up Your School')}
    ${tsmall(`Questions? Reply to this email — we're happy to help.`)}
  `
  await sendTera({
    to: opts.to,
    subject: `Your Tera SM trial has started — ${opts.schoolName}`,
    html: teraLayout('Trial Started', body),
  })
}

/**
 * Sent 3 days before trial expiry.
 */
export async function sendTrialEndingEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  daysLeft: number
  trialEndsAt: Date
  upgradeUrl?: string
}) {
  const endDate = opts.trialEndsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const upgradeUrl = opts.upgradeUrl ?? `${APP_URL}/admin/settings/billing`
  const body = `
    ${th1(`Your trial ends in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}`)}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, your Tera SM trial for <strong style="color:#1e293b;">${opts.schoolName}</strong> expires on <strong style="color:#1e293b;">${endDate}</strong>.`)}
    ${tp('Upgrade now to keep your data, settings, and active workflows without interruption.')}
    ${tbtn(upgradeUrl, 'Upgrade Now')}
    ${tp('After your trial ends, your portal will be locked in read-only mode. Your data is safe and will be available for 30 days.')}
    ${tsmall('No action needed if you don\'t want to continue — your trial will simply expire.')}
  `
  await sendTera({
    to: opts.to,
    subject: `Your Tera SM trial ends in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''} — ${opts.schoolName}`,
    html: teraLayout('Trial Ending Soon', body),
  })
}

/**
 * Sent when a trial expires without upgrading.
 */
export async function sendTrialExpiredEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  upgradeUrl?: string
}) {
  const upgradeUrl = opts.upgradeUrl ?? `${APP_URL}/admin/settings/billing`
  const body = `
    ${th1('Your trial has ended')}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, your free trial for <strong style="color:#1e293b;">${opts.schoolName}</strong> on Tera SM has expired.`)}
    ${tp('Your portal is now in read-only mode. All your data is safe — choose a plan to restore full access.')}
    ${tbtn(upgradeUrl, 'Choose a Plan')}
    ${tp('Your data will be available for <strong style="color:#1e293b;">30 days</strong> from today. After that, it will be permanently deleted per our data retention policy.')}
    ${tsmall('Need more time or have questions? Reply to this email.')}
  `
  await sendTera({
    to: opts.to,
    subject: `Your Tera SM trial has expired — ${opts.schoolName}`,
    html: teraLayout('Trial Expired', body),
  })
}

/**
 * Sent when a subscription payment is successfully processed.
 */
export async function sendPaymentSuccessEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  amount: string
  currency: string
  plan: string
  periodEnd: Date
  receiptUrl?: string
}) {
  const periodEnd = opts.periodEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const body = `
    ${th1('Payment received ✓')}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, we've received your payment for <strong style="color:#1e293b;">${opts.schoolName}</strong>.`)}
    ${tbox([
      { label: 'Amount', value: `${opts.amount} ${opts.currency}` },
      { label: 'Plan', value: opts.plan },
      { label: 'Next billing date', value: periodEnd },
    ])}
    ${opts.receiptUrl ? tbtn(opts.receiptUrl, 'Download Receipt') : ''}
    ${tsmall('Thank you for being a Tera SM customer. If you have any questions about this charge, reply to this email.')}
  `
  await sendTera({
    to: opts.to,
    subject: `Payment confirmed — ${opts.schoolName} (${opts.plan})`,
    html: teraLayout('Payment Received', body),
  })
}

/**
 * Sent when a subscription payment fails.
 */
export async function sendPaymentFailedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  amount: string
  currency: string
  retryDate?: Date
  updateBillingUrl?: string
}) {
  const updateBillingUrl = opts.updateBillingUrl ?? `${APP_URL}/admin/settings/billing`
  const retryDate = opts.retryDate
    ? opts.retryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const body = `
    ${th1('Payment failed — action required')}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, we were unable to process the payment of <strong style="color:#f87171;">${opts.amount} ${opts.currency}</strong> for <strong style="color:#1e293b;">${opts.schoolName}</strong>.`)}
    ${tp('Please update your billing details to avoid service interruption. You have a <strong style="color:#1e293b;">7-day grace period</strong> before your account is locked.')}
    ${retryDate ? tp(`We will automatically retry on <strong style="color:#1e293b;">${retryDate}</strong>.`) : ''}
    ${tbtn(updateBillingUrl, 'Update Payment Method')}
    ${tsmall('If you believe this is an error, reply to this email and we\'ll investigate.')}
  `
  await sendTera({
    to: opts.to,
    subject: `Action required — payment failed for ${opts.schoolName}`,
    html: teraLayout('Payment Failed', body),
  })
}

/**
 * Sent during the 7-day grace period before account suspension.
 */
export async function sendGracePeriodEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  daysLeft: number
  updateBillingUrl?: string
}) {
  const updateBillingUrl = opts.updateBillingUrl ?? `${APP_URL}/admin/settings/billing`
  const body = `
    ${th1(`Account suspension in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}`)}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, we still haven't received payment for <strong style="color:#1e293b;">${opts.schoolName}</strong>.`)}
    ${tp(`Your account will be <strong style="color:#f87171;">suspended in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}</strong>. Students and staff will lose access to the portal.`)}
    ${tbtn(updateBillingUrl, 'Pay Now — Keep Access')}
    ${tsmall('Your data is safe and will be retained. Contact us if you need assistance.')}
  `
  await sendTera({
    to: opts.to,
    subject: `⚠️ Account suspension in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''} — ${opts.schoolName}`,
    html: teraLayout('Grace Period Warning', body),
  })
}

/**
 * Sent when a school upgrades or changes their plan.
 */
export async function sendPlanChangedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  oldPlan: string
  newPlan: string
  effectiveDate: Date
}) {
  const effectiveDate = opts.effectiveDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const isUpgrade = ['STARTER','PRO','ENTERPRISE'].indexOf(opts.newPlan) > ['STARTER','PRO','ENTERPRISE'].indexOf(opts.oldPlan)
  const body = `
    ${th1(isUpgrade ? `You're now on the ${opts.newPlan} plan 🎉` : `Plan changed to ${opts.newPlan}`)}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, your Tera SM plan for <strong style="color:#1e293b;">${opts.schoolName}</strong> has been updated.`)}
    ${tbox([
      { label: 'Previous plan', value: opts.oldPlan },
      { label: 'New plan', value: opts.newPlan },
      { label: 'Effective', value: effectiveDate },
    ])}
    ${isUpgrade ? tp('All new features are immediately available in your portal.') : tp('Your plan has been updated. Some features may no longer be available.')}
    ${tbtn(`${APP_URL}/admin`, 'Go to Your Portal')}
    ${tsmall('Questions about your plan? Reply to this email.')}
  `
  await sendTera({
    to: opts.to,
    subject: `Plan ${isUpgrade ? 'upgraded' : 'changed'} to ${opts.newPlan} — ${opts.schoolName}`,
    html: teraLayout('Plan Changed', body),
  })
}

/**
 * Sent when a school cancels their subscription.
 */
export async function sendSubscriptionCancelledEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  accessUntil: Date
  exportUrl?: string
}) {
  const accessUntil = opts.accessUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const body = `
    ${th1('Your subscription has been cancelled')}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, we've cancelled the Tera SM subscription for <strong style="color:#1e293b;">${opts.schoolName}</strong> as requested.`)}
    ${tbox([
      { label: 'Portal access until', value: accessUntil },
      { label: 'Data retention', value: '30 days after access ends' },
    ])}
    ${tp('You can export all your school data before your access ends.')}
    ${opts.exportUrl ? tbtn(opts.exportUrl, 'Export My Data') : tbtn(`${APP_URL}/admin/settings`, 'Export My Data')}
    ${tsmall('Changed your mind? Reply to this email and we\'ll reactivate your account immediately.')}
  `
  await sendTera({
    to: opts.to,
    subject: `Subscription cancelled — ${opts.schoolName}`,
    html: teraLayout('Subscription Cancelled', body),
  })
}

/**
 * Sent when a tenant hits 80% or 95% of their student cap.
 */
export async function sendUsageAlertEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  currentCount: number
  planLimit: number
  threshold: 80 | 95
  upgradeUrl?: string
}) {
  const upgradeUrl = opts.upgradeUrl ?? `${APP_URL}/admin/settings/billing`
  const pct = opts.threshold
  const remaining = opts.planLimit - opts.currentCount
  const body = `
    ${th1(`You've used ${pct}% of your student seats`)}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, <strong style="color:#1e293b;">${opts.schoolName}</strong> is approaching its student limit.`)}
    ${tbox([
      { label: 'Current students', value: opts.currentCount.toString() },
      { label: 'Plan limit', value: opts.planLimit.toString() },
      { label: 'Seats remaining', value: remaining.toString() },
    ])}
    ${tp(pct === 95
      ? `You only have <strong style="color:#f87171;">${remaining} seat${remaining !== 1 ? 's' : ''} left</strong>. Upgrade now to avoid blocking new student enrolments.`
      : `Upgrade your plan before you run out of seats to avoid disruption to new enrolments.`
    )}
    ${tbtn(upgradeUrl, 'Upgrade Plan')}
    ${tsmall('This alert is sent at 80% and 95% of your plan limit. You will not receive duplicates for the same threshold.')}
  `
  await sendTera({
    to: opts.to,
    subject: `${pct}% of student seats used — ${opts.schoolName}`,
    html: teraLayout('Usage Alert', body),
  })
}

// ════════════════════════════════════════════════════════════════════════════
// DRIP SEQUENCE EMAILS (Tera → Tenant, scheduled post-signup)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Day 2 — nudge to complete setup.
 */
export async function sendDripDay2Email(opts: { to: string; firstName: string; schoolName: string }) {
  const body = `
    ${th1(`Still setting up, ${opts.firstName}?`)}
    ${tp(`You signed up 2 days ago and we want to make sure <strong style="color:#1e293b;">${opts.schoolName}</strong> is fully up and running.`)}
    ${tp('Here\'s a quick 3-step checklist to get the most out of your trial:')}
    <table style="width:100%;border-collapse:collapse;margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;border-left:4px solid #6366f1;">
      ${[
        ['01', 'Set up your academic calendar', 'Admin → Academics → Academic Years'],
        ['02', 'Invite your first staff members', 'Admin → HR → Employees → Invite'],
        ['03', 'Configure your fee structures', 'Admin → Finance → Fee Structures'],
      ].map(([n, title, path]) => `
        <tr>
          <td style="padding:14px 18px;vertical-align:middle;width:40px;border-bottom:1px solid #f1f5f9;">
            <span style="font-size:16px;font-weight:900;color:#6366f1;font-family:'Exo',Inter,sans-serif;">${n}</span>
          </td>
          <td style="padding:14px 18px;border-bottom:1px solid #f1f5f9;">
            <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1e293b;font-family:'Exo',Inter,sans-serif;">${title}</p>
            <p style="margin:0;font-size:12px;color:#64748b;font-family:'Exo',Inter,sans-serif;">${path}</p>
          </td>
        </tr>
      `).join('')}
    </table>
    ${tbtn(`${APP_URL}/admin`, 'Continue Setting Up')}
    ${tsmall('Your trial runs for 14 days — you have plenty of time. We\'re here if you need help.')}
  `
  await sendTera({ to: opts.to, subject: `Quick checklist for ${opts.schoolName} — 3 things to do today`, html: teraLayout('Setup Checklist', body) })
}

/**
 * Day 5 — Live Classes feature spotlight.
 */
export async function sendDripDay5Email(opts: { to: string; firstName: string; schoolName: string }) {
  const body = `
    ${th1('Your students can attend live classes today')}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, did you know Tera SM has a fully built-in video classroom?`)}
    ${tp('No Zoom, no Google Meet, no third-party subscriptions. Everything runs directly inside the platform.')}
    <table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;border-left:4px solid #3b82f6;">
      ${[
        ['HD Video & Audio', 'WebRTC-powered, works in the browser'],
        ['Breakout Rooms', 'Split the class into groups mid-session'],
        ['Auto-Recording', 'Every class recorded and linked to the course'],
        ['Virtual Whiteboard', 'Draw, annotate and collaborate in real time'],
        ['Attendance Auto-Mark', 'Students who join are marked present automatically'],
      ].map(([feature, desc]) => `
        <tr>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#1e293b;border-bottom:1px solid #f1f5f9;font-family:'Exo',Inter,sans-serif;">${feature}</td>
          <td style="padding:10px 16px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;font-family:'Exo',Inter,sans-serif;">${desc}</td>
        </tr>
      `).join('')}
    </table>
    ${tbtn(`${APP_URL}/admin/live-classes`, 'Schedule Your First Class')}
    ${tsmall('Live classes are available on all plans during your trial.')}
  `
  await sendTera({ to: opts.to, subject: `Live classes are ready for ${opts.schoolName} — no Zoom needed`, html: teraLayout('Live Classes', body) })
}

/**
 * Day 8 — Finance & Fee Collection spotlight.
 */
export async function sendDripDay8Email(opts: { to: string; firstName: string; schoolName: string }) {
  const body = `
    ${th1('Collect school fees online in 5 minutes')}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, one of the most impactful things you can do for <strong style="color:#1e293b;">${opts.schoolName}</strong> is move fee collection online.`)}
    ${tp('Schools that collect fees digitally report collecting <strong style="color:#1e293b;">40% more on time</strong> versus manual bank deposits.')}
    <table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;border-left:4px solid #3b82f6;">
      ${[
        ['Paystack', 'Cards, bank transfer, USSD — Nigeria, Ghana, Kenya'],
        ['Flutterwave', 'Broader Africa coverage + diaspora payments'],
        ['Stripe', 'International schools, USD/EUR/GBP'],
        ['Installments', 'Students pay in parts — you track every payment'],
        ['Auto-Receipts', 'PDF receipts emailed to parents on every payment'],
      ].map(([feature, desc]) => `
        <tr>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#1e293b;border-bottom:1px solid #f1f5f9;font-family:'Exo',Inter,sans-serif;">${feature}</td>
          <td style="padding:10px 16px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;font-family:'Exo',Inter,sans-serif;">${desc}</td>
        </tr>
      `).join('')}
    </table>
    ${tbtn(`${APP_URL}/admin/finance`, 'Set Up Fee Collection')}
    ${tsmall('It takes about 5 minutes to configure your first fee structure and connect a payment gateway.')}
  `
  await sendTera({ to: opts.to, subject: `Collect ${opts.schoolName}'s fees online — here's how`, html: teraLayout('Fee Collection', body) })
}

/**
 * Day 11 — Trial ending in 3 days warning.
 */
export async function sendDripDay11Email(opts: { to: string; firstName: string; schoolName: string; trialEndsAt?: Date }) {
  const endDate = opts.trialEndsAt
    ? opts.trialEndsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'in 3 days'
  const upgradeUrl = `${APP_URL}/admin/settings/billing`
  const body = `
    ${th1('Your free trial ends in 3 days')}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, your 14-day free trial for <strong style="color:#1e293b;">${opts.schoolName}</strong> ends on <strong style="color:#f87171;">${endDate}</strong>.`)}
    ${tp('After your trial, your portal will switch to read-only mode. Your data stays safe — but your staff and students will lose the ability to add or change anything.')}
    ${tp('<strong style="color:#1e293b;">Upgrade today</strong> to keep everything running without interruption.')}
    ${tbox([
      { label: 'Trial ends',      value: endDate },
      { label: 'Data retained',   value: '30 days after trial' },
      { label: 'Credit card',     value: 'Required to upgrade' },
    ])}
    ${tbtn(upgradeUrl, 'Upgrade Now — Keep Full Access')}
    ${tsmall('Not ready to upgrade? Your data is safe and you can export it at any time from Admin → Settings.')}
  `
  await sendTera({ to: opts.to, subject: `${opts.schoolName}'s trial ends in 3 days — upgrade to keep access`, html: teraLayout('Trial Ending Soon', body) })
}

/**
 * Day 14 — Trial expired.
 */
export async function sendDripDay14Email(opts: { to: string; firstName: string; schoolName: string }) {
  const upgradeUrl = `${APP_URL}/admin/settings/billing`
  const body = `
    ${th1(`${opts.schoolName}'s trial has ended`)}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>, the 14-day free trial for <strong style="color:#1e293b;">${opts.schoolName}</strong> has now ended.`)}
    ${tp('Your portal is in <strong style="color:#f87171;">read-only mode</strong>. All your data — students, grades, fees, staff records — is safe and intact.')}
    ${tbox([
      { label: 'Portal status',  value: 'Read-only' },
      { label: 'Data available', value: '30 days from today' },
      { label: 'To restore',     value: 'Choose a plan below' },
    ])}
    ${tbtn(upgradeUrl, 'Choose a Plan — Restore Full Access')}
    ${tp('Need more time to decide? <a href="mailto:support@terasms.com" style="color:#6366f1;">Reply to this email</a> and we\'ll extend your trial by 7 days.')}
    ${tsmall('If you do not upgrade within 30 days, your data will be permanently deleted per our data retention policy.')}
  `
  await sendTera({ to: opts.to, subject: `${opts.schoolName}'s trial has ended — choose a plan to continue`, html: teraLayout('Trial Expired', body) })
}

/**
 * Generic campaign email — sent by Tera super admins to tenant segments.
 */
export async function sendCampaignEmail(opts: {
  to: string
  firstName: string
  subject: string
  headline: string
  body: string
  ctaText?: string
  ctaUrl?: string
}) {
  const emailBody = `
    ${th1(opts.headline)}
    ${tp(`Hi <strong style="color:#1e293b;">${opts.firstName}</strong>,`)}
    <div style="margin:16px 0;font-size:15px;color:#94a3b8;line-height:1.8;">${opts.body}</div>
    ${opts.ctaText && opts.ctaUrl ? tbtn(opts.ctaUrl, opts.ctaText) : ''}
    ${tsmall('You are receiving this because you manage a school on Tera SM. <a href="' + APP_URL + '/unsubscribe" style="color:#475569;">Unsubscribe</a>')}
  `
  await sendTera({
    to: opts.to,
    subject: opts.subject,
    html: teraLayout(opts.headline, emailBody),
  })
}

// ─── Bank Transfer Instructions ─────────────────────────────────────────────

const BANK_DETAILS = {
  bankName:      process.env.BANK_NAME       ?? 'First Bank',
  accountName:   process.env.BANK_ACCT_NAME  ?? 'Tera SM Limited',
  accountNumber: process.env.BANK_ACCT_NO    ?? '0123456789',
  sortCode:      process.env.BANK_SORT_CODE  ?? '00-00-00',
  swift:         process.env.BANK_SWIFT      ?? 'FBNINGLA',
  reference:     '',
}

export async function sendBankTransferInstructionsEmail(opts: {
  to:           string
  schoolName:   string
  invoiceNo:    string
  amount:       number
  plan:         string
  billingCycle: string
}) {
  const body = `
    ${h1('Complete Your Payment')}
    ${p(`Hi ${opts.schoolName},`)}
    ${p(`Thank you for choosing Tera SM <strong>${opts.plan}</strong> (${opts.billingCycle.toLowerCase()} billing). Please transfer the amount below to activate your subscription.`)}

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;width:140px;">Invoice No.</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#0f172a;">${opts.invoiceNo}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">Amount</td>
          <td style="padding:6px 0;font-size:16px;font-weight:800;color:#0f172a;">USD $${opts.amount.toLocaleString()}</td>
        </tr>
        <tr><td colspan="2"><hr style="border:none;border-top:1px dashed #e2e8f0;margin:12px 0;"/></td></tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">Bank</td>
          <td style="padding:6px 0;font-size:13px;color:#0f172a;">${BANK_DETAILS.bankName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">Account Name</td>
          <td style="padding:6px 0;font-size:13px;color:#0f172a;">${BANK_DETAILS.accountName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">Account No.</td>
          <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0f172a;">${BANK_DETAILS.accountNumber}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">Sort Code</td>
          <td style="padding:6px 0;font-size:13px;color:#0f172a;">${BANK_DETAILS.sortCode}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">SWIFT/BIC</td>
          <td style="padding:6px 0;font-size:13px;color:#0f172a;">${BANK_DETAILS.swift}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">Reference</td>
          <td style="padding:6px 0;font-size:13px;font-weight:700;color:#6366f1;">${opts.invoiceNo}</td>
        </tr>
      </table>
    </div>

    ${p('<strong>Important:</strong> Please include your invoice number as the payment reference so we can match your transfer quickly.')}
    ${p('Once we confirm your payment, we will email you an activation code to unlock your subscription immediately. This usually takes 1–2 business days.')}
    ${small('Questions? Email <a href="mailto:billing@terasms.com" style="color:#6366f1;">billing@terasms.com</a> or WhatsApp us.')}
  `
  await send({
    to:      opts.to,
    subject: `Invoice ${opts.invoiceNo} — Bank Transfer Instructions | Tera SM`,
    html:    baseLayout('Complete Your Payment', body),
  })
}

// ─── Activation Code Email ───────────────────────────────────────────────────

export async function sendActivationCodeEmail(opts: {
  to:           string
  schoolName:   string
  code:         string
  plan:         string
  billingCycle: string
  invoiceNo:    string
  amount:       number
  expiresAt:    Date
}) {
  const activateUrl = `${APP_URL}/admin/settings?tab=billing`
  const expiryStr = opts.expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const body = `
    ${h1('Your Activation Code')}
    ${p(`Hi ${opts.schoolName},`)}
    ${p(`Your bank transfer for invoice <strong>${opts.invoiceNo}</strong> has been confirmed. Here is your activation code to unlock <strong>${opts.plan}</strong> plan:`)}

    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:#f8fafc;border:2px dashed #6366f1;border-radius:12px;padding:18px 32px;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Activation Code</p>
        <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.15em;color:#0f172a;font-family:monospace;">${opts.code}</p>
      </div>
    </div>

    ${p(`This code is valid until <strong>${expiryStr}</strong> and can only be used once.`)}
    ${btn(activateUrl, 'Activate My Subscription')}
    <ol style="margin:16px 0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>Go to <strong>Admin Portal → Settings → Billing & Plan</strong></li>
      <li>Click <strong>"Enter Activation Code"</strong></li>
      <li>Paste the code above and click <strong>Activate</strong></li>
    </ol>
    ${small('If you did not request this, contact <a href="mailto:security@terasms.com" style="color:#6366f1;">security@terasms.com</a> immediately.')}
  `
  await send({
    to:      opts.to,
    subject: `Your Tera SM Activation Code — ${opts.plan}`,
    html:    baseLayout('Your Activation Code', body),
  })
}

/**
 * Sent to alumni who self-registered via the public form.
 */
export async function sendAlumniWelcomeEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  loginUrl: string
}) {
  const body = `
    ${h1(`Welcome to the ${opts.schoolName} Alumni Network!`)}
    ${p(`Hi ${opts.firstName}, your alumni profile has been created. You can now log in to connect with fellow graduates, update your profile, and access mentorship opportunities.`)}
    ${btn(opts.loginUrl, 'Log In to Alumni Portal')}
    ${small('If you did not register, please ignore this email.')}
  `
  await send({ to: opts.to, subject: `Welcome to ${opts.schoolName} Alumni Network`, html: baseLayout('Alumni Welcome', body) })
}

/**
 * Sent to alumni imported via CSV — prompts them to claim their account.
 */
export async function sendAlumniClaimEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  tempPassword: string
  loginUrl: string
}) {
  const body = `
    ${h1(`You've been added to the ${opts.schoolName} Alumni Network`)}
    ${p(`Hi ${opts.firstName}, ${opts.schoolName} has added you to their alumni network on Tera SM.`)}
    ${p('Your temporary login credentials are:')}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 6px;font-size:14px;color:#475569;"><strong>Email:</strong> ${opts.to}</p>
      <p style="margin:0;font-size:14px;color:#475569;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;font-family:monospace;">${opts.tempPassword}</code></p>
    </div>
    ${p('Please log in and change your password immediately.')}
    ${btn(opts.loginUrl, 'Claim My Account')}
    ${small('If you were not expecting this, you can safely ignore this email.')}
  `
  await send({ to: opts.to, subject: `Claim your ${opts.schoolName} Alumni account`, html: baseLayout('Claim Your Account', body) })
}

// ════════════════════════════════════════════════════════════════════════════
// FINANCE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Sent to a student after their fee payment is successfully processed.
 */
export async function sendFeePaymentReceiptEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  receiptNumber: string
  amount: string
  currency: string
  description: string
  paidAt: Date
  balanceRemaining?: string
  receiptUrl?: string
}) {
  const paidDate = opts.paidAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const body = `
    ${h1('Payment confirmed ✓')}
    ${p(`Hi <strong>${opts.firstName}</strong>, we have received your fee payment for <strong>${opts.schoolName}</strong>.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Receipt No.</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#0f172a;font-family:monospace;">${opts.receiptNumber}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Description</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${opts.description}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Amount Paid</td>
        <td style="padding:10px 16px;font-size:18px;font-weight:800;color:#16a34a;">${opts.amount} ${opts.currency}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Date</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${paidDate}</td>
      </tr>
      ${opts.balanceRemaining !== undefined ? `<tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Balance Remaining</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:${opts.balanceRemaining === '0' ? '#16a34a' : '#dc2626'};">${opts.balanceRemaining} ${opts.currency}</td>
      </tr>` : ''}
    </table>
    ${opts.receiptUrl ? btn(opts.receiptUrl, 'Download Receipt PDF') : ''}
    ${btn(`${APP_URL}/student/fees`, 'View Fee History')}
    ${small(`This is an official payment receipt from ${opts.schoolName}. Please keep it for your records.`)}
  `
  await send({
    to: opts.to,
    subject: `Payment confirmed — ${opts.amount} ${opts.currency} | ${opts.schoolName}`,
    html: baseLayout('Payment Receipt', body),
  })
}

/**
 * Sent to a student when a fee due date is approaching (7, 3, or 1 day before).
 */
export async function sendFeeDueReminderEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  daysUntilDue: number
  dueDate: Date
  amount: string
  currency: string
  description: string
  payUrl?: string
}) {
  const dueDate = opts.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const payUrl = opts.payUrl ?? `${APP_URL}/student/fees`
  const urgency = opts.daysUntilDue === 1 ? '🔴 Due Tomorrow' : opts.daysUntilDue <= 3 ? '🟡 Due Soon' : '📋 Upcoming'
  const body = `
    ${h1(`Fee due in ${opts.daysUntilDue} day${opts.daysUntilDue !== 1 ? 's' : ''}`)}
    ${p(`Hi <strong>${opts.firstName}</strong>, this is a reminder that a fee payment is due soon at <strong>${opts.schoolName}</strong>.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Status</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${urgency}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Description</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${opts.description}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Amount Due</td>
        <td style="padding:10px 16px;font-size:18px;font-weight:800;color:#dc2626;">${opts.amount} ${opts.currency}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Due Date</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#dc2626;">${dueDate}</td>
      </tr>
    </table>
    ${btn(payUrl, 'Pay Now')}
    ${small('Late payments may incur additional charges. If you have already paid, please disregard this reminder.')}
  `
  await send({
    to: opts.to,
    subject: `Fee reminder — ${opts.amount} ${opts.currency} due in ${opts.daysUntilDue} day${opts.daysUntilDue !== 1 ? 's' : ''} | ${opts.schoolName}`,
    html: baseLayout('Fee Reminder', body),
  })
}

/**
 * Sent to a student when a fee becomes overdue.
 */
export async function sendFeeOverdueEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  daysOverdue: number
  amount: string
  currency: string
  description: string
  lateFee?: string
  payUrl?: string
}) {
  const payUrl = opts.payUrl ?? `${APP_URL}/student/fees`
  const body = `
    ${h1('Fee payment overdue')}
    ${p(`Hi <strong>${opts.firstName}</strong>, your fee payment at <strong>${opts.schoolName}</strong> is now <strong style="color:#dc2626;">${opts.daysOverdue} day${opts.daysOverdue !== 1 ? 's' : ''} overdue</strong>.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #fca5a5;border-radius:8px;overflow:hidden;background:#fef2f2;">
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Description</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${opts.description}</td>
      </tr>
      <tr style="background:#fee2e2;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Outstanding Amount</td>
        <td style="padding:10px 16px;font-size:18px;font-weight:800;color:#dc2626;">${opts.amount} ${opts.currency}</td>
      </tr>
      ${opts.lateFee ? `<tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Late Fee Applied</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#dc2626;">+${opts.lateFee} ${opts.currency}</td>
      </tr>` : ''}
    </table>
    ${p('Continued non-payment may affect your academic registration, access to results, and campus services.')}
    ${btn(payUrl, 'Pay Now')}
    ${small(`If you have financial difficulties, please contact the bursary office at ${opts.schoolName} to discuss a payment plan.`)}
  `
  await send({
    to: opts.to,
    subject: `OVERDUE — Fee payment required | ${opts.schoolName}`,
    html: baseLayout('Fee Overdue', body),
  })
}

// ════════════════════════════════════════════════════════════════════════════
// THESIS / DISSERTATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Sent to a student when their thesis is submitted successfully.
 */
export async function sendThesisSubmittedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  thesisTitle: string
  submittedAt: Date
}) {
  const submittedDate = opts.submittedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const body = `
    ${h1('Thesis submitted successfully')}
    ${p(`Hi <strong>${opts.firstName}</strong>, your thesis has been received by <strong>${opts.schoolName}</strong>. You will be notified when your supervisor reviews it.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Title</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.thesisTitle}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Submitted</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${submittedDate}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Status</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#2563eb;">Under Review</td>
      </tr>
    </table>
    ${btn(`${APP_URL}/student/thesis`, 'View My Thesis')}
    ${small('Do not submit duplicate copies. If you need to make corrections, contact your supervisor.')}
  `
  await send({
    to: opts.to,
    subject: `Thesis submitted — ${opts.thesisTitle} | ${opts.schoolName}`,
    html: baseLayout('Thesis Submitted', body),
  })
}

/**
 * Sent to a student when a supervisor is assigned to their thesis,
 * and to the supervisor when they are assigned a thesis to review.
 */
export async function sendThesisSupervisorAssignedEmail(opts: {
  toStudent: string
  toSupervisor: string
  studentName: string
  supervisorName: string
  schoolName: string
  thesisTitle: string
}) {
  const studentBody = `
    ${h1('Supervisor assigned to your thesis')}
    ${p(`Hi <strong>${opts.studentName.split(' ')[0]}</strong>, a supervisor has been assigned to your thesis at <strong>${opts.schoolName}</strong>.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Thesis</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.thesisTitle}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Supervisor</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.supervisorName}</td>
      </tr>
    </table>
    ${btn(`${APP_URL}/student/thesis`, 'View My Thesis')}
    ${small('Your supervisor will review your thesis and provide feedback. You will be notified of any updates.')}
  `
  const supervisorBody = `
    ${h1('You have been assigned a thesis to supervise')}
    ${p(`Hi <strong>${opts.supervisorName.split(' ')[0]}</strong>, you have been assigned as supervisor for the following thesis at <strong>${opts.schoolName}</strong>.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Thesis Title</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.thesisTitle}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Student</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.studentName}</td>
      </tr>
    </table>
    ${btn(`${APP_URL}/staff/thesis`, 'Review Thesis')}
    ${small(`Please log in to the staff portal to review the submission and provide feedback.`)}
  `
  await Promise.all([
    send({ to: opts.toStudent, subject: `Supervisor assigned — ${opts.thesisTitle} | ${opts.schoolName}`, html: baseLayout('Supervisor Assigned', studentBody) }),
    send({ to: opts.toSupervisor, subject: `New thesis assigned for supervision | ${opts.schoolName}`, html: baseLayout('Thesis Assigned', supervisorBody) }),
  ])
}

/**
 * Sent to a student when their supervisor requests revisions.
 */
export async function sendThesisRevisionRequestedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  thesisTitle: string
  supervisorName: string
  feedback: string
}) {
  const body = `
    ${h1('Revision requested on your thesis')}
    ${p(`Hi <strong>${opts.firstName}</strong>, your supervisor has reviewed your thesis and requested revisions.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Thesis</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.thesisTitle}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Supervisor</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${opts.supervisorName}</td>
      </tr>
    </table>
    <div style="margin:16px 0;padding:16px;background:#fff7ed;border-left:3px solid #f97316;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Supervisor Feedback</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${opts.feedback}</p>
    </div>
    ${p('Please address the feedback and resubmit your revised thesis.')}
    ${btn(`${APP_URL}/student/thesis`, 'View & Revise Thesis')}
    ${small(`If you have questions about the feedback, contact your supervisor directly. — ${opts.schoolName}`)}
  `
  await send({
    to: opts.to,
    subject: `Revision requested — ${opts.thesisTitle} | ${opts.schoolName}`,
    html: baseLayout('Revision Requested', body),
  })
}

/**
 * Sent to a student when their thesis is approved or rejected.
 */
export async function sendThesisOutcomeEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  thesisTitle: string
  status: 'APPROVED' | 'REJECTED' | 'PUBLISHED'
  note?: string | null
}) {
  const approved = opts.status === 'APPROVED' || opts.status === 'PUBLISHED'
  const statusLabel = opts.status === 'PUBLISHED' ? 'Published' : opts.status === 'APPROVED' ? 'Approved' : 'Rejected'
  const noteBlock = opts.note
    ? `<div style="margin:16px 0;padding:16px;background:#f8fafc;border-left:3px solid #e2e8f0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Note from Reviewer</p>
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${opts.note}</p>
       </div>`
    : ''
  const body = `
    ${h1(`Thesis ${approved ? approved ? 'approved ✅' : '' : 'not approved'}`)}
    ${p(`Hi <strong>${opts.firstName}</strong>, there is an update on your thesis submission at <strong>${opts.schoolName}</strong>.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Thesis</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.thesisTitle}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Decision</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:700;color:${approved ? '#16a34a' : '#dc2626'};">${statusLabel}</td>
      </tr>
    </table>
    ${noteBlock}
    ${approved
      ? p(`Congratulations! Your thesis has been ${statusLabel.toLowerCase()}. This is a significant achievement — well done.`)
      : p('Please review the feedback and speak to your supervisor about next steps.')}
    ${btn(`${APP_URL}/student/thesis`, 'View My Thesis')}
    ${small(`${opts.schoolName} Thesis Review Committee`)}
  `
  await send({
    to: opts.to,
    subject: `Thesis ${statusLabel.toLowerCase()} — ${opts.thesisTitle} | ${opts.schoolName}`,
    html: baseLayout(`Thesis ${statusLabel}`, body),
  })
}

// ════════════════════════════════════════════════════════════════════════════
// ALUMNI MENTORSHIP
// ════════════════════════════════════════════════════════════════════════════

/**
 * Sent to an alumni mentor when a student sends them a mentorship request.
 */
export async function sendMentorshipRequestEmail(opts: {
  to: string
  mentorFirstName: string
  studentName: string
  schoolName: string
  message?: string | null
}) {
  const body = `
    ${h1('New mentorship request')}
    ${p(`Hi <strong>${opts.mentorFirstName}</strong>, a student from <strong>${opts.schoolName}</strong> has requested you as a mentor.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Student</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.studentName}</td>
      </tr>
    </table>
    ${opts.message ? `<div style="margin:16px 0;padding:16px;background:#f8fafc;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Message from Student</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${opts.message}</p>
    </div>` : ''}
    ${btn(`${APP_URL}/student/alumni`, 'View Request')}
    ${small('You can accept or decline this request in your alumni portal. Your contact details will not be shared until you accept.')}
  `
  await send({
    to: opts.to,
    subject: `Mentorship request from ${opts.studentName} | ${opts.schoolName}`,
    html: baseLayout('Mentorship Request', body),
  })
}

/**
 * Sent to a student when their mentorship request is accepted or declined.
 */
export async function sendMentorshipDecisionEmail(opts: {
  to: string
  studentFirstName: string
  mentorName: string
  schoolName: string
  status: 'ACTIVE' | 'DECLINED'
  message?: string | null
}) {
  const accepted = opts.status === 'ACTIVE'
  const body = `
    ${h1(`Mentorship request ${accepted ? 'accepted ✅' : 'declined'}`)}
    ${p(`Hi <strong>${opts.studentFirstName}</strong>, <strong>${opts.mentorName}</strong> has ${accepted ? 'accepted' : 'declined'} your mentorship request.`)}
    ${accepted
      ? `${p('You are now connected! Reach out to your mentor through the alumni portal to get started.')}`
      : `${p('Do not be discouraged — other mentors are available and would be glad to connect with you.')}`}
    ${opts.message ? `<div style="margin:16px 0;padding:16px;background:#f8fafc;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Message from ${opts.mentorName}</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${opts.message}</p>
    </div>` : ''}
    ${btn(`${APP_URL}/student/alumni`, accepted ? 'Message My Mentor' : 'Find Another Mentor')}
    ${small(`${opts.schoolName} Alumni Network`)}
  `
  await send({
    to: opts.to,
    subject: `Mentorship request ${accepted ? 'accepted' : 'declined'} — ${opts.mentorName} | ${opts.schoolName}`,
    html: baseLayout(`Mentorship ${accepted ? 'Accepted' : 'Declined'}`, body),
  })
}

// ════════════════════════════════════════════════════════════════════════════
// ACADEMICS / LMS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Sent to a student when their semester grades are published.
 */
export async function sendGradesPublishedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  semesterName: string
  gpa: string
  totalCredits: number
  courseCount: number
}) {
  const body = `
    ${h1('Your grades are now available')}
    ${p(`Hi <strong>${opts.firstName}</strong>, your results for <strong>${opts.semesterName}</strong> have been published on <strong>${opts.schoolName}</strong>'s portal.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Semester</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.semesterName}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Courses Graded</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${opts.courseCount}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Total Credits</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${opts.totalCredits}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Semester GPA</td>
        <td style="padding:10px 16px;font-size:24px;font-weight:800;color:#2563eb;">${opts.gpa}</td>
      </tr>
    </table>
    ${btn(`${APP_URL}/student/grades`, 'View Full Grades')}
    ${small('If you believe there is an error in your grades, you can submit an appeal through the student portal. — ' + opts.schoolName)}
  `
  await send({
    to: opts.to,
    subject: `Your ${opts.semesterName} results are ready | ${opts.schoolName}`,
    html: baseLayout('Grades Published', body),
  })
}

/**
 * Sent to students when an assignment deadline is approaching.
 */
export async function sendAssignmentDeadlineReminderEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  assignmentTitle: string
  courseName: string
  dueAt: Date
  hoursLeft: number
  submissionUrl?: string
}) {
  const dueStr = opts.dueAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)
  const submissionUrl = opts.submissionUrl ?? `${APP_URL}/student/courses`
  const urgency = opts.hoursLeft <= 3 ? '🔴 Due Very Soon' : opts.hoursLeft <= 24 ? '🟡 Due Today' : '📋 Due Tomorrow'
  const body = `
    ${h1('Assignment deadline approaching')}
    ${p(`Hi <strong>${opts.firstName}</strong>, you have an assignment due soon in <strong>${opts.courseName}</strong>.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Assignment</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.assignmentTitle}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Course</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${opts.courseName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Deadline</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#dc2626;">${dueStr}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Status</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${urgency}</td>
      </tr>
    </table>
    ${btn(submissionUrl, 'Submit Assignment Now')}
    ${small('Late submissions may incur penalties as per your course policy. — ' + opts.schoolName)}
  `
  await send({
    to: opts.to,
    subject: `Assignment due in ${opts.hoursLeft}h — ${opts.assignmentTitle} | ${opts.schoolName}`,
    html: baseLayout('Assignment Deadline', body),
  })
}

/**
 * Sent to students with a reminder before a live class starts.
 */
export async function sendLiveClassReminderEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  className: string
  courseName: string
  startsAt: Date
  minutesUntilStart: number
  joinUrl?: string
}) {
  const timeStr = opts.startsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateStr = opts.startsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const joinUrl = opts.joinUrl ?? `${APP_URL}/student/live-classes`
  const body = `
    ${h1(`Live class starting in ${opts.minutesUntilStart} minutes`)}
    ${p(`Hi <strong>${opts.firstName}</strong>, your live class is about to begin on <strong>${opts.schoolName}</strong>'s portal. Make sure you're ready to join!`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Session</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.className}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Course</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${opts.courseName}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Date</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Start Time</td>
        <td style="padding:10px 16px;font-size:16px;font-weight:700;color:#2563eb;">${timeStr}</td>
      </tr>
    </table>
    ${btn(joinUrl, 'Join Class Now')}
    ${small('Attendance is auto-marked when you join. Joining late may affect your attendance record. — ' + opts.schoolName)}
  `
  await send({
    to: opts.to,
    subject: `Class starting in ${opts.minutesUntilStart} min — ${opts.className} | ${opts.schoolName}`,
    html: baseLayout('Live Class Starting', body),
  })
}

// ════════════════════════════════════════════════════════════════════════════
// HR
// ════════════════════════════════════════════════════════════════════════════

/**
 * Sent to a staff member when their payslip is generated and available.
 */
export async function sendPayslipGeneratedEmail(opts: {
  to: string
  firstName: string
  schoolName: string
  periodLabel: string
  grossPay: string
  netPay: string
  currency: string
  payslipUrl?: string
}) {
  const payslipUrl = opts.payslipUrl ?? `${APP_URL}/staff/payslips`
  const body = `
    ${h1('Your payslip is ready')}
    ${p(`Hi <strong>${opts.firstName}</strong>, your payslip for <strong>${opts.periodLabel}</strong> has been generated by <strong>${opts.schoolName}</strong>.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Pay Period</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#0f172a;">${opts.periodLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Gross Pay</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;">${opts.grossPay} ${opts.currency}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 16px;font-size:14px;color:#475569;">Net Pay</td>
        <td style="padding:10px 16px;font-size:20px;font-weight:800;color:#16a34a;">${opts.netPay} ${opts.currency}</td>
      </tr>
    </table>
    ${btn(payslipUrl, 'View & Download Payslip')}
    ${small(`If you have questions about this payslip, please contact the HR department at ${opts.schoolName}.`)}
  `
  await send({
    to: opts.to,
    subject: `Payslip ready — ${opts.periodLabel} | ${opts.schoolName}`,
    html: baseLayout('Payslip Generated', body),
  })
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH — SELF-SERVICE PASSWORD RESET
// ════════════════════════════════════════════════════════════════════════════

/**
 * Sent when a user requests a self-service password reset link.
 */
export async function sendForgotPasswordEmail(opts: {
  to: string
  firstName: string
  resetUrl: string
  expiresInMinutes?: number
}) {
  const expires = opts.expiresInMinutes ?? 60
  const body = `
    ${h1('Reset your password')}
    ${p(`Hi <strong>${opts.firstName}</strong>, we received a request to reset your password. Click the button below to choose a new one.`)}
    ${btn(opts.resetUrl, 'Reset My Password')}
    ${p(`Or copy this link: <a href="${opts.resetUrl}" style="color:#6366f1;word-break:break-all;">${opts.resetUrl}</a>`)}
    ${small(`This link expires in ${expires} minutes. If you did not request a password reset, you can safely ignore this email — your password will not change.`)}
  `
  await send({
    to: opts.to,
    subject: 'Reset your Tera SM password',
    html: baseLayout('Password Reset', body),
  })
}
