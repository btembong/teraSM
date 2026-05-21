import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async upsertGrade(
    tenantId: string,
    data: {
      studentId: string
      courseOfferingId: string
      caScore?: number
      examScore?: number
      remark?: string
    },
  ) {
    const totalScore =
      (data.caScore ?? 0) + (data.examScore ?? 0)

    const letterGrade = this.computeLetterGrade(totalScore)
    const gradePoint = this.computeGradePoint(totalScore)

    return this.prisma.grade.upsert({
      where: {
        tenantId_studentId_courseOfferingId: {
          tenantId,
          studentId: data.studentId,
          courseOfferingId: data.courseOfferingId,
        },
      },
      create: {
        tenantId,
        studentId: data.studentId,
        courseOfferingId: data.courseOfferingId,
        caScore: data.caScore,
        examScore: data.examScore,
        totalScore,
        letterGrade,
        gradePoint,
        remark: data.remark,
      },
      update: {
        caScore: data.caScore,
        examScore: data.examScore,
        totalScore,
        letterGrade,
        gradePoint,
        remark: data.remark,
        publishedAt: null, // reset published state when updated
      },
    })
  }

  async publishGrades(tenantId: string, courseOfferingId: string) {
    return this.prisma.grade.updateMany({
      where: { tenantId, courseOfferingId, publishedAt: null },
      data: { publishedAt: new Date() },
    })
  }

  async getCourseGrades(tenantId: string, courseOfferingId: string) {
    return this.prisma.grade.findMany({
      where: { tenantId, courseOfferingId },
      orderBy: { totalScore: 'desc' },
    })
  }

  async getStudentGrades(
    tenantId: string,
    studentId: string,
    semesterId?: string,
  ) {
    if (semesterId) {
      return this.prisma.grade.findMany({
        where: {
          tenantId,
          studentId,
          courseOffering: { semesterId },
        },
        include: {
          courseOffering: { include: { course: true } },
        },
      })
    }

    return this.prisma.grade.findMany({
      where: { tenantId, studentId, publishedAt: { not: null } },
      include: {
        courseOffering: { include: { course: true, semester: { include: { academicYear: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getTranscript(tenantId: string, studentId: string) {
    const grades = await this.prisma.grade.findMany({
      where: { tenantId, studentId, publishedAt: { not: null } },
      include: {
        courseOffering: {
          include: {
            course: true,
            semester: { include: { academicYear: true } },
          },
        },
      },
    })

    // Group by academic year
    const byYear: Record<string, typeof grades> = {}
    for (const g of grades) {
      const year = g.courseOffering.semester.academicYear.name
      if (!byYear[year]) byYear[year] = []
      byYear[year].push(g)
    }

    // Compute GPA per year and cumulative
    const transcript = Object.entries(byYear).map(([year, yearGrades]) => {
      const totalPoints = yearGrades.reduce(
        (sum, g) => sum + (g.gradePoint ?? 0) * g.courseOffering.course.creditHours,
        0,
      )
      const totalCredits = yearGrades.reduce(
        (sum, g) => sum + g.courseOffering.course.creditHours,
        0,
      )
      return {
        academicYear: year,
        grades: yearGrades,
        gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
        totalCredits,
      }
    })

    const allPoints = transcript.reduce(
      (sum, y) => sum + y.gpa * y.totalCredits,
      0,
    )
    const allCredits = transcript.reduce((sum, y) => sum + y.totalCredits, 0)
    const cgpa = allCredits > 0 ? allPoints / allCredits : 0

    return { transcript, cgpa, totalCredits: allCredits }
  }

  private computeLetterGrade(score: number): string {
    if (score >= 70) return 'A'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C'
    if (score >= 45) return 'D'
    return 'F'
  }

  private computeGradePoint(score: number): number {
    if (score >= 70) return 5.0
    if (score >= 60) return 4.0
    if (score >= 50) return 3.0
    if (score >= 45) return 2.0
    return 0.0
  }
}
