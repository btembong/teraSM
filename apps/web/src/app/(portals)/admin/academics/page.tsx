import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, Building2, Calendar, Users, ChevronRight } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { getActiveSemester } from '@/lib/active-semester'

export default async function AcademicsOverview() {
  const session = await auth()
  if (!session) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [departments, courses, activeSemester, enrollments] = await Promise.all([
    prisma.department.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId } }),
    getActiveSemester(tenantId),
    prisma.enrollment.count({ where: { tenantId, status: 'ENROLLED' } }),
  ])

  return (
    <div className="space-y-7">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Departments" value={departments} icon={Building2} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/academics/departments" />
        <StatCard label="Courses" value={courses} icon={BookOpen} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/academics/courses" />
        <StatCard label="Active Enrollments" value={enrollments} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
      </div>

      {/* Active semester banner */}
      {activeSemester ? (
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent_60%)]" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-blue-200 text-sm font-medium">{activeSemester.academicYear.name}</p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {activeSemester.name.charAt(0) + activeSemester.name.slice(1).toLowerCase()} {activeSemester.termType.charAt(0) + activeSemester.termType.slice(1).toLowerCase()}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                {new Date(activeSemester.startDate).toLocaleDateString()} – {new Date(activeSemester.endDate).toLocaleDateString()}
              </p>
            </div>
            <Link
              href="/admin/academic-calendar"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              Academic Calendar <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-amber-500" />
          </div>
          <p className="font-semibold text-gray-800">No active semester</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">Launch a semester from the Academic Calendar to enable enrollments, course offerings, and more.</p>
          <Link
            href="/admin/academic-calendar"
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go to Academic Calendar
          </Link>
        </div>
      )}

    </div>
  )
}
