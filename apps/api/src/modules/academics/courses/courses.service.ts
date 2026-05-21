import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    departmentId: string
    code: string
    title: string
    description?: string
    creditHours?: number
    level?: number
    prerequisites?: string[]
  }) {
    const exists = await this.prisma.course.findUnique({ where: { tenantId_code: { tenantId, code: data.code } } })
    if (exists) throw new ConflictException(`Course code "${data.code}" already exists`)
    return this.prisma.course.create({ data: { tenantId, ...data } })
  }

  async findAll(tenantId: string, departmentId?: string) {
    return this.prisma.course.findMany({
      where: { tenantId, status: 'ACTIVE', ...(departmentId ? { departmentId } : {}) },
      include: { department: { select: { name: true, code: true } } },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    })
  }

  async findOne(id: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        offerings: {
          include: { semester: { include: { academicYear: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })
    if (!course) throw new NotFoundException('Course not found')
    return course
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findOne(id, tenantId)
    return this.prisma.course.update({ where: { id }, data })
  }

  async createOffering(tenantId: string, data: {
    courseId: string
    semesterId: string
    teacherId: string
    maxStudents?: number
    room?: string
    schedule?: any
  }) {
    return this.prisma.courseOffering.create({ data: { tenantId, ...data } })
  }

  async getOfferings(tenantId: string, semesterId: string) {
    return this.prisma.courseOffering.findMany({
      where: { tenantId, semesterId },
      include: {
        course: { include: { department: { select: { name: true, code: true } } } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { course: { code: 'asc' } },
    })
  }
}
