import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  sendDripDay2Email,
  sendDripDay5Email,
  sendDripDay8Email,
  sendDripDay11Email,
  sendDripDay14Email,
} from '@/lib/email'

// Vercel Cron sends Authorization: Bearer <CRON_SECRET> automatically.
// The same header is used for manual triggers (e.g. curl or testing).
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev: skip auth if not set
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all due, unsent, uncancelled drip jobs
  const due = await (prisma as any).dripEmail.findMany({
    where: {
      scheduledAt:  { lte: new Date() },
      sentAt:       null,
      cancelledAt:  null,
    },
  })

  let sent = 0
  const errors: string[] = []

  for (const job of due) {
    try {
      const opts = {
        to:         job.email,
        firstName:  job.firstName,
        schoolName: job.schoolName,
      }

      switch (job.type) {
        case 'DAY_2_SETUP_NUDGE':
          await sendDripDay2Email(opts)
          break
        case 'DAY_5_LIVE_CLASSES':
          await sendDripDay5Email(opts)
          break
        case 'DAY_8_FINANCE':
          await sendDripDay8Email(opts)
          break
        case 'DAY_11_TRIAL_ENDING':
          // Pass trialEndsAt if needed — fetch from tenant
          await sendDripDay11Email(opts)
          break
        case 'DAY_14_TRIAL_EXPIRED':
          await sendDripDay14Email(opts)
          break
        default:
          console.warn(`[drip] Unknown type: ${job.type}`)
          continue
      }

      // Mark sent
      await (prisma as any).dripEmail.update({
        where: { id: job.id },
        data:  { sentAt: new Date() },
      })
      sent++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${job.type} → ${job.email}: ${msg}`)
      console.error(`[drip] failed ${job.type} to ${job.email}`, err)
    }
  }

  return NextResponse.json({
    processed: due.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  })
}
