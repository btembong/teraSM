import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText, Printer } from 'lucide-react'

export default async function TranscriptPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  })

  const grades = await prisma.grade.findMany({
    where: { tenantId, studentId: userId, publishedAt: { not: null } },
    include: {
      courseOffering: {
        include: {
          course: { include: { department: true } },
          semester: { include: { academicYear: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group by academic year
  const byYear: Record<string, typeof grades> = {}
  for (const g of grades) {
    const year = g.courseOffering.semester.academicYear.name
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(g)
  }

  // Compute CGPA
  let totalPoints = 0
  let totalCredits = 0
  for (const g of grades) {
    totalPoints += (g.gradePoint ?? 0) * g.courseOffering.course.creditHours
    totalCredits += g.courseOffering.course.creditHours
  }
  const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'

  const gradeColor: Record<string, string> = {
    A: 'text-blue-700',
    B: 'text-blue-600',
    C: 'text-blue-400',
    D: 'text-gray-500',
    F: 'text-gray-900',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Transcript</h1>
          <p className="text-gray-500">Official academic record</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Student Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{user?.tenant.name}</p>
                <p className="text-xs text-gray-400">Official Transcript</p>
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex gap-8">
                <div>
                  <p className="text-gray-400 text-xs">Student Name</p>
                  <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="font-medium text-gray-900">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-blue-600">{cgpa}</p>
            <p className="text-sm text-gray-400">Cumulative GPA</p>
            <p className="text-sm text-gray-600 mt-1">{totalCredits} total credits</p>
          </div>
        </div>
      </div>

      {/* Grades by Year */}
      {Object.keys(byYear).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-2xl">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No published grades on record.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byYear).map(([year, yearGrades]) => {
            const yPoints = yearGrades.reduce(
              (s, g) => s + (g.gradePoint ?? 0) * g.courseOffering.course.creditHours,
              0,
            )
            const yCredits = yearGrades.reduce((s, g) => s + g.courseOffering.course.creditHours, 0)
            const yGpa = yCredits > 0 ? (yPoints / yCredits).toFixed(2) : '—'

            return (
              <div key={year} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{year}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{yCredits} credits</span>
                    <span className="font-bold text-gray-900">GPA: {yGpa}</span>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-2 text-xs text-gray-500 font-medium">Semester</th>
                      <th className="text-left px-5 py-2 text-xs text-gray-500 font-medium">Course</th>
                      <th className="text-left px-5 py-2 text-xs text-gray-500 font-medium">Title</th>
                      <th className="text-center px-5 py-2 text-xs text-gray-500 font-medium">Credits</th>
                      <th className="text-center px-5 py-2 text-xs text-gray-500 font-medium">Score</th>
                      <th className="text-center px-5 py-2 text-xs text-gray-500 font-medium">Grade</th>
                      <th className="text-center px-5 py-2 text-xs text-gray-500 font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearGrades.map((g) => (
                      <tr key={g.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-2.5 text-gray-500 text-xs">{g.courseOffering.semester.name}</td>
                        <td className="px-5 py-2.5 font-medium text-gray-900">{g.courseOffering.course.code}</td>
                        <td className="px-5 py-2.5 text-gray-600">{g.courseOffering.course.title}</td>
                        <td className="px-5 py-2.5 text-center text-gray-600">{g.courseOffering.course.creditHours}</td>
                        <td className="px-5 py-2.5 text-center text-gray-600">{g.totalScore ?? '—'}</td>
                        <td className="px-5 py-2.5 text-center">
                          <span className={`font-bold text-base ${gradeColor[g.letterGrade ?? ''] ?? ''}`}>
                            {g.letterGrade ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-center text-gray-600">{g.gradePoint?.toFixed(1) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
