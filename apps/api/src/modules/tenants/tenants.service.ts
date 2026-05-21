import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

interface CreateTenantInput {
  name: string
  slug: string
  email: string
  country: string
  plan?: string
}

interface OnboardingInput {
  profile?: {
    tagline?: string
    address?: string
    phone?: string
    website?: string
    institutionType?: string
    timezone?: string
  }
  academic?: {
    academicYear?: string
    termType?: string
    currentTerm?: string
    gradingScale?: string
    passMark?: number
  }
}

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTenantInput) {
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    return this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        email: data.email,
        country: data.country,
        plan: (data.plan as any) ?? 'STARTER',
        status: 'TRIAL',
        trialEndsAt,
        studentCap: data.plan === 'PRO' ? 3000 : 500,
      },
    })
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } })
    if (!tenant) throw new NotFoundException('School not found')
    return tenant
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } })
  }

  async saveOnboarding(tenantId: string, _data: OnboardingInput) {
    // Onboarding data will expand as we add AcademicYear, Term models in Phase 2
    // For now, update timezone if provided
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { timezone: _data.profile?.timezone ?? 'UTC' },
    })
  }
}
