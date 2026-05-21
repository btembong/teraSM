import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(
    tenantId: string,
    data: {
      courseOfferingId: string
      date: string // ISO date string YYYY-MM-DD
      markedById: string
      records: Array<{ studentId: string; status: string; note?: string }>
    },
  ) {
    const date = new Date(data.date)

    // Upsert each attendance record
    const results = await Promise.all(
      data.records.map((r) =>
        this.prisma.attendance.upsert({
          where: {
            tenantId_studentId_courseOfferingId_date: {
              tenantId,
              studentId: r.studentId,
              courseOfferingId: data.courseOfferingId,
              date,
            },
          },
          create: {
            tenantId,
            studentId: r.studentId,
            courseOfferingId: data.courseOfferingId,
            date,
            status: r.status as any,
            note: r.note,
            markedById: data.markedById,
          },
          update: {
            status: r.status as any,
            note: r.note,
            markedById: data.markedById,
          },
        }),
      ),
    )

    return { marked: results.length }
  }

  async getCourseAttendance(
    tenantId: string,
    courseOfferingId: string,
    date?: string,
  ) {
    const where: any = { tenantId, courseOfferingId }
    if (date) where.date = new Date(date)

    return this.prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { studentId: 'asc' }],
    })
  }

  async getStudentAttendance(
    tenantId: string,
    studentId: string,
    courseOfferingId?: string,
  ) {
    const where: any = { tenantId, studentId }
    if (courseOfferingId) where.courseOfferingId = courseOfferingId

    return this.prisma.attendance.findMany({
      where,
      include: { courseOffering: { include: { course: true } } },
      orderBy: { date: 'desc' },
    })
  }

  async getAttendanceSummary(
    tenantId: string,
    courseOfferingId: string,
    studentId: string,
  ) {
    const records = await this.prisma.attendance.findMany({
      where: { tenantId, courseOfferingId, studentId },
    })

    const total = records.length
    const present = records.filter((r) => r.status === 'PRESENT').length
    const absent = records.filter((r) => r.status === 'ABSENT').length
    const late = records.filter((r) => r.status === 'LATE').length
    const excused = records.filter((r) => r.status === 'EXCUSED').length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, late, excused, percentage }
  }
}
