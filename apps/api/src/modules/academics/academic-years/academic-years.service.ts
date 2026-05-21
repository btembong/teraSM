import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    name: string
    startDate: Date
    endDate: Date
    gradingScale?: string
    passMark?: number
  }) {
    // Set all others to not current
    if (data['isCurrent']) {
      await this.prisma.academicYear.updateMany({ where: { tenantId }, data: { isCurrent: false } })
    }
    return this.prisma.academicYear.create({ data: { tenantId, ...data, isCurrent: true } as any })
  }

  async findAll(tenantId: string) {
    return this.prisma.academicYear.findMany({
      where: { tenantId },
      include: { semesters: true },
      orderBy: { startDate: 'desc' },
    })
  }

  async getCurrent(tenantId: string) {
    return this.prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
      include: {
        semesters: { where: { isCurrent: true } },
      },
    })
  }

  async createSemester(tenantId: string, data: {
    academicYearId: string
    name: string
    termType?: string
    startDate: Date
    endDate: Date
    isCurrent?: boolean
  }) {
    if (data.isCurrent) {
      await this.prisma.semester.updateMany({ where: { tenantId }, data: { isCurrent: false } })
    }
    return this.prisma.semester.create({ data: { tenantId, ...data } as any })
  }

  async getSemesters(tenantId: string, academicYearId: string) {
    return this.prisma.semester.findMany({
      where: { tenantId, academicYearId },
      orderBy: { startDate: 'asc' },
    })
  }

  async getCurrentSemester(tenantId: string) {
    return this.prisma.semester.findFirst({
      where: { tenantId, isCurrent: true },
      include: { academicYear: true },
    })
  }
}
