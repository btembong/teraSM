// Tera SM — SaaS plan pricing and limits

export type Plan = 'STARTER' | 'PRO' | 'ENTERPRISE' | 'UNIVERSITY'
export type BillingCycle = 'MONTHLY' | 'ANNUAL'

export const PLAN_PRICES: Record<Plan, { monthly: number; annual: number }> = {
  STARTER:    { monthly: 49,   annual: 499   },
  PRO:        { monthly: 149,  annual: 1499  },
  ENTERPRISE: { monthly: 499,  annual: 4999  },
  UNIVERSITY: { monthly: 0,    annual: 0     },  // custom — contact sales
}

export const PLAN_STUDENT_CAPS: Record<Plan, number> = {
  STARTER:    500,
  PRO:        3000,
  ENTERPRISE: 10000,
  UNIVERSITY: 999999,
}

export const PLAN_STORAGE_CAPS: Record<Plan, number> = {
  STARTER:    10,
  PRO:        100,
  ENTERPRISE: 500,
  UNIVERSITY: 99999,
}

export const PLAN_FEATURES: Record<Plan, string[]> = {
  STARTER: [
    'Up to 500 students',
    '5 admin seats',
    'Core academics (timetable, attendance, results)',
    'Basic finance (fees, payments, receipts)',
    'Student portal + Gmail login',
    'Email notifications',
    '10 GB storage',
    'Standard PDF exports',
  ],
  PRO: [
    'Up to 3,000 students',
    '20 admin seats',
    'Full LMS (content, assignments, grading)',
    'Live classes (video, recording, whiteboard)',
    'HR management (leave, payroll, payslips)',
    'Parent portal',
    'Student life (clubs, events, hostel)',
    'WhatsApp & SMS notifications',
    'Push notifications',
    'Custom branding & domain',
    '100 GB storage',
    'Basic analytics',
    'REST API access (read-only)',
  ],
  ENTERPRISE: [
    'Up to 10,000 students',
    'Unlimited admin seats',
    'AI features (advisor, chatbot, early warning)',
    'Advanced analytics & custom reports',
    'Accreditation report generator',
    'Career center & alumni network',
    'Online proctored exams',
    'Multi-language support (up to 5)',
    'Full REST API + webhooks',
    'White-label option',
    'SSO (Google, Microsoft)',
    '500 GB storage',
    'Priority support (8h response)',
    'Data residency choice',
  ],
  UNIVERSITY: [
    'Unlimited students & staff',
    'Unlimited storage',
    'Thesis & dissertation portal',
    'Research paper repository',
    'Multi-campus management',
    'Dedicated cloud infrastructure',
    'Custom SLA (99.95% uptime)',
    'On-premise deployment option',
    'Custom feature development',
    'Dedicated account manager',
    '24/7 phone & Slack support',
  ],
}

export const ANNUAL_DISCOUNT_PCT = 15

/** Duration in months for each billing cycle */
export const CYCLE_MONTHS: Record<BillingCycle, number> = {
  MONTHLY: 1,
  ANNUAL:  12,
}

/** Returns price for a plan + cycle */
export function getPlanPrice(plan: Plan, cycle: BillingCycle): number {
  return PLAN_PRICES[plan][cycle === 'MONTHLY' ? 'monthly' : 'annual']
}

/** Generates the activation code prefix from plan + cycle */
export function codePrefix(plan: Plan, cycle: BillingCycle): string {
  const p = plan.slice(0, 3)          // STA | PRO | ENT | UNI
  const c = cycle === 'ANNUAL' ? 'ANN' : 'MON'
  return `TERA-${p}-${c}`
}

/** Generates a random 8-char alphanumeric segment */
export function randomSegment(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

/** Build a full activation code: TERA-PRO-ANN-X8K2M9P4 */
export function buildActivationCode(plan: Plan, cycle: BillingCycle): string {
  return `${codePrefix(plan, cycle)}-${randomSegment()}`
}
