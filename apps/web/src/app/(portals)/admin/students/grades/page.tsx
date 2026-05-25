import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'
import { NoActiveSemester } from '@/components/ui/no-active-semester'
import { BarChart2, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'

export default async function StudentGradesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId as string

  const activeSemester = await getActiveSemester(tenantId)
  if (!activeSemester) return <NoActiveSemester feature="Grade management" />

  // Offerings this semester with grade counts
  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId, semesterId: activeSemester.id },
    include: {
      course: { select: { code: true, title: true, creditHours: true } },
      _count: { select: { enrollments: true, grades: true } },
    },
    orderBy: { course: { code: 'asc' } },
  })

  const totalEnrolled = offerings.reduce((s, o) => s + o._count.enrollments, 0)
  const totalGraded   = offerings.reduce((s, o) => s + o._count.grades, 0)
  const gradingPct    = totalEnrolled > 0 ? Math.round((totalGraded / totalEnrolled) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Grades & Results</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {activeSemester.academicYear.name} · {activeSemester.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Offerings',       value: offerings.length,  primary: true },
          { label: 'Total Enrolled',  value: totalEnrolled,     primary: true },
          { label: 'Grades Posted',   value: totalGraded,       primary: true },
          { label: 'Grading Progress',value: `${gradingPct}%`,  primary: gradingPct === 100 },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className={`text-2xl font-bold ${s.primary ? 'text-slate-900' : 'text-slate-500'}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-offering grading status */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <BarChart2 className="w-4 h-4 text-slate-300" />
          <span className="font-semibold text-slate-900 text-sm">Grading Status by Course</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Course</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Enrolled</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Graded</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Progress</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {offerings.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">No course offerings this semester.</td></tr>
            )}
            {offerings.map(o => {
              const pct = o._count.enrollments > 0 ? Math.round((o._count.grades / o._count.enrollments) * 100) : 0
              const done = pct === 100
              return (
                <tr key={o.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-5 py-3 border-r border-gray-100">
                    <p className="font-semibold text-slate-900">{o.course.code}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[240px]">{o.course.title}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-700 font-medium border-r border-gray-100">{o._count.enrollments}</td>
                  <td className="px-4 py-3 text-center border-r border-gray-100">
                    <span className={`font-bold ${done ? 'text-emerald-600' : 'text-slate-900'}`}>{o._count.grades}</span>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-100">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${done ? 'bg-emerald-500' : pct > 50 ? 'bg-indigo-500' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/lms/${o.id}/grades`}
                      className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
