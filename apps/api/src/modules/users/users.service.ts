import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

interface CreateUserInput {
  tenantId: string
  email: string
  firstName: string
  lastName: string
  passwordHash?: string
  role?: string
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash: data.passwordHash,
        role: (data.role as any) ?? 'STUDENT',
        status: 'ACTIVE',
        onboardingComplete: false,
      },
    })
  }

  async findById(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } })
    if (!user) throw new NotFoundException('User not found')
    const { passwordHash: _, twoFactorSecret: __, ...safe } = user
    return safe
  }

  async findAllByTenant(tenantId: string, role?: string) {
    return this.prisma.user.findMany({
      where: { tenantId, ...(role ? { role: role as any } : {}) },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, status: true, avatarUrl: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async markOnboardingComplete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { onboardingComplete: true },
    })
  }
}
