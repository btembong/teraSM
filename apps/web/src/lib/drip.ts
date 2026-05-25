import { prisma } from '@/lib/prisma'

const DRIP_SCHEDULE = [
  { type: 'DAY_2_SETUP_NUDGE',    days: 2  },
  { type: 'DAY_5_LIVE_CLASSES',   days: 5  },
  { type: 'DAY_8_FINANCE',        days: 8  },
  { type: 'DAY_11_TRIAL_ENDING',  days: 11 },
  { type: 'DAY_14_TRIAL_EXPIRED', days: 14 },
]

/**
 * Schedule all drip emails for a newly registered school.
 * Call this after tenant creation — non-blocking, fire and forget.
 */
export async function scheduleDripEmails(opts: {
  tenantId: string
  email: string
  firstName: string
  schoolName: string
  registeredAt?: Date
}) {
  const base = opts.registeredAt ?? new Date()
  const jobs = DRIP_SCHEDULE.map(step => ({
    tenantId:   opts.tenantId,
    email:      opts.email,
    firstName:  opts.firstName,
    schoolName: opts.schoolName,
    type:       step.type as any,
    scheduledAt: new Date(base.getTime() + step.days * 24 * 60 * 60 * 1000),
  }))
  await (prisma as any).dripEmail.createMany({ data: jobs })
}

/**
 * Cancel all unsent drip emails for a tenant.
 * Call this when the tenant upgrades to a paid plan.
 */
export async function cancelDripEmails(tenantId: string) {
  await (prisma as any).dripEmail.updateMany({
    where: { tenantId, sentAt: null, cancelledAt: null },
    data:  { cancelledAt: new Date() },
  })
}
