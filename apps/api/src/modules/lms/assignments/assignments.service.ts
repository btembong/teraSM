import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, courseOfferingId?: string) {
    return this.prisma.assignment.findMany({
      where: { tenantId, ...(courseOfferingId ? { courseOfferingId } : {}) },
      include: { _count: { select: { submissions: true } } },
      orderBy: { dueDate: 'asc' },
    })
  }

  async findById(id: string) {
    return this.prisma.assignment.findUnique({
      where: { id },
      include: { submissions: true },
    })
  }

  async create(tenantId: string, data: {
    courseOfferingId: string
    title: string
    description?: string
    instructions?: string
    maxScore?: number
    dueDate: string
    allowLate?: boolean
    latePenaltyPct?: number
  }) {
    return this.prisma.assignment.create({
      data: {
        tenantId,
        courseOfferingId: data.courseOfferingId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        maxScore: data.maxScore ?? 100,
        dueDate: new Date(data.dueDate),
        allowLate: data.allowLate ?? false,
        latePenaltyPct: data.latePenaltyPct ?? 0,
      },
    })
  }

  async publish(id: string) {
    return this.prisma.assignment.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    })
  }

  async update(id: string, data: Partial<{
    title: string
    description: string
    instructions: string
    maxScore: number
    dueDate: string
    allowLate: boolean
    latePenaltyPct: number
  }>) {
    return this.prisma.assignment.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })
  }

  // Get submissions for an assignment (teacher view)
  async getSubmissions(assignmentId: string) {
    return this.prisma.submission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'asc' },
    })
  }

  // Grade a submission
  async gradeSubmission(submissionId: string, score: number, feedback: string, gradedById: string) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        gradedById,
        status: 'GRADED',
        gradedAt: new Date(),
      },
    })
  }

  // Stats per assignment for dashboard
  async stats(tenantId: string, courseOfferingId?: string) {
    const assignments = await this.prisma.assignment.findMany({
      where: { tenantId, ...(courseOfferingId ? { courseOfferingId } : {}), isPublished: true },
      include: { _count: { select: { submissions: true } } },
    })
    const overdue = assignments.filter((a) => new Date(a.dueDate) < new Date())
    return { total: assignments.length, overdue: overdue.length }
  }
}
