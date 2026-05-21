import { z } from 'zod'

export const TenantPlan = z.enum(['STARTER', 'PRO', 'ENTERPRISE', 'UNIVERSITY'])
export type TenantPlan = z.infer<typeof TenantPlan>

export const TenantStatus = z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED'])
export type TenantStatus = z.infer<typeof TenantStatus>

export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  plan: TenantPlan.default('STARTER'),
  email: z.string().email(),
  country: z.string().min(2).max(2),
  timezone: z.string().default('UTC'),
})

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>

export type Tenant = {
  id: string
  name: string
  slug: string
  plan: TenantPlan
  status: TenantStatus
  email: string
  country: string
  timezone: string
  logoUrl?: string
  customDomain?: string
  studentCap: number
  createdAt: Date
  updatedAt: Date
}
