import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../../prisma/prisma.service'
import { TenantsService } from '../tenants/tenants.service'
import { UsersService } from '../users/users.service'
import type { RegisterTenantDto } from '../auth/dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private tenantsService: TenantsService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterTenantDto) {
    const { school, admin } = dto

    // Check slug is available
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: school.slug },
    })
    if (existingTenant) {
      throw new ConflictException('This subdomain is already taken. Please choose another.')
    }

    // Check email not already used across platform
    const existingUser = await this.prisma.user.findFirst({
      where: { email: admin.email },
    })
    if (existingUser) {
      throw new ConflictException('An account with this email already exists.')
    }

    // Create tenant
    const tenant = await this.tenantsService.create({
      name: school.schoolName,
      slug: school.slug,
      email: admin.email,
      country: school.country,
      plan: school.plan,
    })

    // Hash password
    const passwordHash = await bcrypt.hash(admin.password, 12)

    // Create admin user
    const user = await this.usersService.create({
      tenantId: tenant.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      passwordHash,
      role: 'TENANT_ADMIN',
    })

    // Issue JWT
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
    })

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
      },
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } })
    if (!user || !user.passwordHash) throw new UnauthorizedException()

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    return user
  }
}
