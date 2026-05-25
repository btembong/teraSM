import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BarChart2, Award, BookOpen, TrendingUp, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'
import { WhatIfCalculator } from './_components/WhatIfCalculator'

const GRADE_COLOR: Record<string, string> = {
  'A+': 'bg-emerald-600 text-white',
  A:    'bg-blue-600 text-white',
  'B+': 'bg-blue-500 text-white',
  B:    'bg-blue-50 text-blue-700',
  'C+': 'bg-amber-50 text-amber-700',
  C:    'bg-amber-100 text-amber-600',
  D:    'bg-gray-100 text-gray-600',
  F:    'bg-red-500 text-white',
}

function gradeClass(letter: string | null): string {
  if (!letter) return 'bg-gray-50 text-gray-400'
  // Try exact match first, then first char
  return GRADE_COLOR[letter] ?? GRADE_COLOR[letter[0]] ?? 'bg-gray-50 text-gray-600'
}

export default async function StudentGradesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const tenantId = (session.user as any).tenantId
  const userId   = (session.user as any).id

  // Fetch all PUBLISHED grades + resit attempts across all semesters
  const [allGrades, profile, resitAttempts] = await Promise.all([
    prisma.grade.findMany({
      where: {
        tenantId,
        studentId: userId,
        status: 'PUBLISHED',
      },
      include: {
        courseOffering: {
          include: {
            course:   { select: { code: true, title: true, creditHours: true } },
            semester: { include: { academicYear: { select: { name: true } } } },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.studentProfile.findFirst({
      where: { tenantId, userId },
      select: { cgpa: true, totalCredits: true, level: true, program: { select: { name: true, requiredCredits: true } } },
    }),
    (prisma as any).resitAttempt.findMany({
      where: { tenantId, studentId: userId, status: 'PUBLISHED' },
      include: {
        grade: {
          include: {
            courseOffering: {
              include: {
                course:   { select: { code: true, title: true, creditHours: true } },
                semester: { include: { academicYear: { select: { name: true } } } },
              },
            },
          },
        },
      },
    }),
  ])

  // Index resit attempts by gradeId for quick lookup
  const resitMap = Object.fromEntries((resitAttempts as any[]).map((r: any) => [r.gradeId, r]))

  // Current semester grades (for top stats + what-if)
  const currentSemester = await prisma.semester.findFirst({
    where: { tenantId, isCurrent: true },
    include: { academicYear: { select: { name: true } } },
  })

  const currentGrades = currentSemester
    ? allGrades.filter(g => g.courseOffering.semesterId === currentSemester.id)
    : []

  // Semester GPA
  const semPoints  = currentGrades.reduce((s, g) => s + (g.gradePoint ?? 0) * g.courseOffering.course.creditHours, 0)
  const semCredits = currentGrades.reduce((s, g) => s + g.courseOffering.course.creditHours, 0)
  const semGpa     = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : null

  // Group all grades by academic year → semester for history
  const bySemester: Map<string, {
    semesterName: string
    yearName: string
    semesterId: string
    grades: typeof allGrades
    gpa: string
    credits: number
  }> = new Map()

  for (const g of allGrades) {
    const key = g.courseOffering.semesterId
    if (!bySemester.has(key)) {
      const pts = allGrades
        .filter(x => x.courseOffering.semesterId === key)
        .reduce((s, x) => s + (x.gradePoint ?? 0) * x.courseOffering.course.creditHours, 0)
      const cred = allGrades
        .filter(x => x.courseOffering.semesterId === key)
        .reduce((s, x) => s + x.courseOffering.course.creditHours, 0)
      bySemester.set(key, {
        semesterId:   key,
        semesterName: g.courseOffering.semester.name,
        yearName:     g.courseOffering.semester.academicYear.name,
        grades:       [],
        gpa:          cred > 0 ? (pts / cred).toFixed(2) : '—',
        credits:      cred,
      })
    }
    bySemester.get(key)!.grades.push(g)
  }

  const semesterHistory = [...bySemester.values()]

  const cgpa         = profile?.cgpa ?? 0
  const totalCredits = profile?.totalCredits ?? 0
  const required     = profile?.program?.requiredCredits ?? 120
  const progressPct  = Math.min(100, Math.round((totalCredits / required) * 100))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grades & Results"
        description={currentSemester
          ? `${currentSemester.name} — ${currentSemester.academicYear.name}`
          : 'Academic record'}
        action={
          <Link
            href="/student/grades/appeals"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Appeal a grade
          </Link>
        }
      />

      {/* CGPA / cumulative stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="CGPA"
          value={cgpa > 0 ? cgpa.toFixed(2) : '—'}
          icon={GraduationCap}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          label="Credits Earned"
          value={totalCredits}
          icon={BookOpen}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        {semGpa !== null ? (
          <StatCard
            label="Semester GPA"
            value={semGpa}
            icon={TrendingUp}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        ) : (
          <StatCard
            label="Semesters Completed"
            value={semesterHistory.length}
            icon={Award}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        )}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400 mb-2">
            Degree Progress
            {profile?.program && (
              <span className="ml-1 text-gray-300">· {profile.program.name}</span>
            )}
          </p>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-2xl font-bold text-gray-900">{progressPct}%</p>
            <p className="text-xs text-gray-400 mb-0.5">{totalCredits}/{required} credits</p>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* What-if calculator for current semester */}
      {currentGrades.length > 0 && (
        <WhatIfCalculator
          courses={currentGrades.map(g => ({
            id:          g.id,
            code:        g.courseOffering.course.code,
            title:       g.courseOffering.course.title,
            creditHours: g.courseOffering.course.creditHours,
            gradePoint:  g.gradePoint,
            totalScore:  g.totalScore,
          }))}
          currentGpa={semGpa !== null ? parseFloat(semGpa) : null}
        />
      )}

      {/* Current semester grades */}
      {currentSemester && (
        <SectionCard
          title={`${currentSemester.name} — ${currentSemester.academicYear.name}`}
          icon={BarChart2}
          iconColor="text-blue-500"
          noPadding
        >
          {currentGrades.length === 0 ? (
            <EmptyState
              icon={BarChart2}
              title="No published grades yet"
              description="Grades will appear here once your lecturer submits and the registrar publishes them."
              iconBg="bg-blue-50"
              iconColor="text-blue-400"
            />
          ) : (
            <GradeTable grades={currentGrades} resitMap={resitMap} />
          )}
        </SectionCard>
      )}

      {/* Grade history — all other semesters */}
      {semesterHistory.filter(s => s.semesterId !== currentSemester?.id).length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-0.5">Grade History</p>
          {semesterHistory
            .filter(s => s.semesterId !== currentSemester?.id)
            .map(sem => (
              <SectionCard
                key={sem.semesterId}
                title={`${sem.semesterName} — ${sem.yearName}`}
                icon={Award}
                iconColor="text-indigo-400"
                noPadding
                action={
                  <span className="text-xs text-gray-500 font-medium">
                    GPA: <strong className="text-gray-900">{sem.gpa}</strong>
                    <span className="text-gray-300 mx-1.5">·</span>
                    {sem.credits} credits
                  </span>
                }
              >
                <GradeTable grades={sem.grades} resitMap={resitMap} />
              </SectionCard>
            ))}
        </div>
      )}

      {allGrades.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <EmptyState
            icon={BarChart2}
            title="No grades yet"
            description="Your published grades will appear here once lecturers submit and the registrar approves."
            iconBg="bg-blue-50"
            iconColor="text-blue-400"
          />
        </div>
      )}
    </div>
  )
}

function GradeTable({ grades, resitMap }: {
  grades: any[]
  resitMap: Record<string, any>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Credits</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CA</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Exam</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {grades.map((g) => {
            const resit = resitMap[g.id]
            return (
              <>
                {/* Original grade row */}
                <tr key={g.id} className={`hover:bg-gray-50/70 transition-colors ${resit ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900">{g.courseOffering.course.code}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{g.courseOffering.course.title}</p>
                    {resit && (
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                        Original
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs font-medium text-gray-500">
                    {g.courseOffering.course.creditHours} cr
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600 font-medium">{g.caScore ?? '—'}</td>
                  <td className="px-4 py-3.5 text-center text-gray-600 font-medium">{g.examScore ?? '—'}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-gray-900">
                    {g.totalScore != null ? g.totalScore.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {g.letterGrade ? (
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${gradeClass(g.letterGrade)}`}>
                        {g.letterGrade}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {g.remark ? (
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                        g.remark === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {g.remark}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>

                {/* Resit row — shown directly below the original */}
                {resit && (
                  <tr key={`${g.id}-resit`} className="bg-amber-50/30 hover:bg-amber-50/50 transition-colors border-l-2 border-amber-300">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{g.courseOffering.course.code}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{g.courseOffering.course.title}</p>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                        RESIT (R)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs font-medium text-gray-500">
                      {g.courseOffering.course.creditHours} cr
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium">
                      {resit.caScore ?? '—'}
                      <span className="text-[10px] text-gray-400 block">carried</span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium">{resit.examScore ?? '—'}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-gray-900">
                      {resit.totalScore != null ? resit.totalScore.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {resit.letterGrade ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold ${gradeClass(resit.letterGrade)}`}>
                            {resit.letterGrade}
                          </span>
                          {resit.isCapped && (
                            <span className="text-[10px] text-gray-400">capped</span>
                          )}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {resit.remark ? (
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                          resit.remark === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                          {resit.remark}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
