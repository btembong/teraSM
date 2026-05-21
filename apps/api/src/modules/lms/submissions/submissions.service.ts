import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  // Get student's submission for an assignment
  async getMySubmission(tenantId: string, assignmentId: string, studentId: string) {
    return this.prisma.submission.findUnique({
      where: { tenantId_assignmentId_studentId: { tenantId, assignmentId, studentId } },
      include: { assignment: true },
    })
  }

  // Get all submissions by a student
  async listByStudent(tenantId: string, studentId: string) {
    return this.prisma.submission.findMany({
      where: { tenantId, studentId },
      include: { assignment: { include: { courseOffering: { include: { course: true } } } } },
      orderBy: { assignment: { dueDate: 'asc' } },
    })
  }

  // Submit / save draft
  async submit(tenantId: string, data: {
    assignmentId: string
    studentId: string
    content?: string
    fileUrl?: string
    fileName?: string
    isDraft?: boolean
  }) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: data.assignmentId } })
    const now = new Date()
    const isLate = assignment && now > assignment.dueDate

    const status = data.isDraft ? 'DRAFT' : (isLate ? 'LATE' : 'SUBMITTED')

    return this.prisma.submission.upsert({
      where: { tenantId_assignmentId_studentId: { tenantId, assignmentId: data.assignmentId, studentId: data.studentId } },
      create: {
        tenantId,
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        content: data.content,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        status: status as any,
        submittedAt: data.isDraft ? undefined : now,
      },
      update: {
        content: data.content,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        status: status as any,
        submittedAt: data.isDraft ? undefined : now,
      },
    })
  }
}
