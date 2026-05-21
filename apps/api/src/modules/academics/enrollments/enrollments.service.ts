import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(tenantId: string, studentId: string, courseOfferingId: string) {
    // Check already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: { tenantId_studentId_courseOfferingId: { tenantId, studentId, courseOfferingId } },
    })
    if (existing && existing.status === 'ENROLLED') throw new ConflictException('Already enrolled in this course')
    if (existing && existing.status === 'DROPPED') {
      return this.prisma.enrollment.update({ where: { id: existing.id }, data: { status: 'ENROLLED', droppedAt: null } })
    }

    // Check seat availability
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
      include: { _count: { select: { enrollments: { where: { status: 'ENROLLED' } } } } },
    })
    if (!offering) throw new NotFoundException('Course offering not found')

    const enrolled = (offering as any)._count.enrollments
    const status = enrolled >= offering.maxStudents ? 'WAITLISTED' : 'ENROLLED'

    return this.prisma.enrollment.create({ data: { tenantId, studentId, courseOfferingId, status } })
  }

  async drop(tenantId: string, studentId: string, courseOfferingId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { tenantId_studentId_courseOfferingId: { tenantId, studentId, courseOfferingId } },
    })
    if (!enrollment) throw new NotFoundException('Enrollment not found')
    if (enrollment.status === 'DROPPED') throw new BadRequestException('Already dropped')

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'DROPPED', droppedAt: new Date() },
    })
  }

  async getStudentEnrollments(tenantId: string, studentId: string, semesterId?: string) {
    return this.prisma.enrollment.findMany({
      where: {
        tenantId,
        studentId,
        status: 'ENROLLED',
        ...(semesterId ? { courseOffering: { semesterId } } : {}),
      },
      include: {
        courseOffering: {
          include: {
            course: { include: { department: { select: { name: true, code: true } } } },
            semester: { include: { academicYear: true } },
          },
        },
      },
    })
  }

  async getCourseEnrollments(tenantId: string, courseOfferingId: string) {
    return this.prisma.enrollment.findMany({
      where: { tenantId, courseOfferingId, status: 'ENROLLED' },
      include: {
        courseOffering: { include: { course: true } },
      },
      orderBy: { enrolledAt: 'asc' },
    })
  }
}
