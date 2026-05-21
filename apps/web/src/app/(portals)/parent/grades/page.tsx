import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function ParentGradesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const parentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const links = await prisma.parentStudent.findMany({ where: { tenantId, parentId } })
  const studentIds = links.map((l) => l.studentId)

  const children = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true },
  })

  const gradesByChild = await Promise.all(
    children.map(async (child) => {
      const grades = await prisma.grade.findMany({
        where: { tenantId, studentId: child.id, publishedAt: { not: null } },
        include: { courseOffering: { include: { course: true, semester: { include: { academicYear: true } } } } },
        orderBy: { updatedAt: 'desc' },
      })
      return { child, grades }
    })
  )

  const letterColor: Record<string, string> = { A: 'bg-blue-600 text-white', B: 'bg-blue-50 text-blue-700', C: 'bg-blue-100 text-blue-600', D: 'bg-gray-100 text-gray-600', F: 'bg-gray-900 text-white' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
        <p className="text-gray-500">Academic results for your children</p>
      </div>

      {gradesByChild.map(({ child, grades }) => (
        <div key={child.id} className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{child.firstName} {child.lastName}</h2>
          </div>
          {grades.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No published grades yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {grades.map((g) => (
                <div key={g.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{g.courseOffering.course.title}</p>
                    <p className="text-xs text-gray-400">{g.courseOffering.course.code} · {g.courseOffering.semester.academicYear.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {g.caScore != null && <span className="text-xs text-gray-400">CA: {g.caScore}</span>}
                    {g.examScore != null && <span className="text-xs text-gray-400">Exam: {g.examScore}</span>}
                    {g.totalScore != null && <span className="text-sm font-semibold text-gray-900">{g.totalScore}%</span>}
                    {g.letterGrade && <span className={`text-xs px-2 py-0.5 rounded font-medium ${letterColor[g.letterGrade] ?? 'bg-gray-100 text-gray-600'}`}>{g.letterGrade}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
