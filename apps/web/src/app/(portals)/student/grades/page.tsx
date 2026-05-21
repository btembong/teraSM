import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BarChart2, Award, BookOpen, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

const gradeColor: Record<string, string> = {
  A: 'bg-blue-600 text-white',
  B: 'bg-blue-50 text-blue-700',
  C: 'bg-blue-100 text-blue-600',
  D: 'bg-gray-100 text-gray-600',
  F: 'bg-gray-900 text-white',
}

export default async function StudentGradesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const currentSemester = await prisma.semester.findFirst({
    where: { tenantId, isCurrent: true },
    include: { academicYear: true },
  })

  const grades = currentSemester
    ? await prisma.grade.findMany({
        where: { tenantId, studentId: userId, courseOffering: { semesterId: currentSemester.id } },
        include: { courseOffering: { include: { course: true } } },
      })
    : []

  const published = grades.filter((g) => g.publishedAt !== null)
  const totalPoints = published.reduce(
    (sum, g) => sum + (g.gradePoint ?? 0) * g.courseOffering.course.creditHours, 0,
  )
  const totalCredits = published.reduce((sum, g) => sum + g.courseOffering.course.creditHours, 0)
  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '—'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grades"
        description={currentSemester
          ? `${currentSemester.name} Semester — ${currentSemester.academicYear.name}`
          : 'No active semester'}
      />

      {/* GPA Summary */}
      {published.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Semester GPA" value={gpa} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard label="Credit Hours" value={totalCredits} icon={BookOpen} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard label="Courses Graded" value={published.length} icon={Award} iconBg="bg-blue-50" iconColor="text-blue-600" />
        </div>
      )}

      {/* Grades Table */}
      {grades.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100">
          <EmptyState
            icon={BarChart2}
            title="No grades yet"
            description={currentSemester ? 'Grades will appear here once published by your lecturers.' : 'There is no active semester. Check back later.'}
            iconBg="bg-blue-50"
            iconColor="text-blue-400"
          />
        </div>
      ) : (
        <SectionCard title="Course Grades" icon={BarChart2} iconColor="text-blue-500" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CA</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Exam</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grades.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{g.courseOffering.course.code}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{g.courseOffering.course.title}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium">{g.caScore ?? '—'}</td>
                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium">{g.examScore ?? '—'}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-gray-900">{g.totalScore ?? '—'}</td>
                    <td className="px-4 py-3.5 text-center">
                      {g.letterGrade ? (
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${gradeColor[g.letterGrade] ?? 'bg-gray-50 text-gray-600'}`}>
                          {g.letterGrade}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {g.publishedAt ? (
                        <span className="inline-flex items-center text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-full">Published</span>
                      ) : (
                        <span className="inline-flex items-center text-xs bg-gray-100 text-gray-400 font-medium px-2.5 py-1 rounded-full">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
