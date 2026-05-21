import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class ScholarshipsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    name: string
    description?: string
    type?: string
    amount?: number
    percentage?: number
    maxAmount?: number
  }) {
    return this.prisma.scholarship.create({ data: { tenantId, ...data } })
  }

  async findAll(tenantId: string) {
    return this.prisma.scholarship.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { awards: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async award(tenantId: string, data: {
    studentId: string
    scholarshipId: string
    amountAwarded?: number
    semesterId?: string
    notes?: string
    expiresAt?: Date
  }) {
    const scholarship = await this.prisma.scholarship.findFirst({
      where: { id: data.scholarshipId, tenantId },
    })
    if (!scholarship) throw new NotFoundException('Scholarship not found')

    // Compute amount if not provided
    let amountAwarded = data.amountAwarded
    if (!amountAwarded && scholarship.amount) amountAwarded = scholarship.amount

    return this.prisma.studentScholarship.create({
      data: {
        tenantId,
        studentId: data.studentId,
        scholarshipId: data.scholarshipId,
        amountAwarded,
        semesterId: data.semesterId,
        notes: data.notes,
        expiresAt: data.expiresAt,
        status: 'APPROVED',
        awardedAt: new Date(),
      },
    })
  }

  async getStudentScholarships(tenantId: string, studentId: string) {
    return this.prisma.studentScholarship.findMany({
      where: { tenantId, studentId },
      include: { scholarship: true },
      orderBy: { awardedAt: 'desc' },
    })
  }

  async updateStatus(id: string, tenantId: string, status: string, notes?: string) {
    const award = await this.prisma.studentScholarship.findFirst({ where: { id, tenantId } })
    if (!award) throw new NotFoundException('Award not found')
    return this.prisma.studentScholarship.update({
      where: { id },
      data: { status: status as any, notes: notes ?? award.notes },
    })
  }
}
