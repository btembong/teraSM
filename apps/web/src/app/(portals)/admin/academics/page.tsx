import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, Building2, Calendar, GraduationCap, Users, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'

export default async function AcademicsOverview() {
  const session = await auth()
  if (!session) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const [departments, courses, currentYear, enrollments] = await Promise.all([
    prisma.department.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId } }),
    prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
      include: { semesters: { where: { isCurrent: true } } },
    }),
    prisma.enrollment.count({ where: { tenantId, status: 'ENROLLED' } }),
  ])

  const navCards = [
    {
      title: 'Departments',
      description: 'Create and manage academic departments and their staff.',
      href: '/admin/academics/departments',
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Courses',
      description: 'Define courses, create offerings, and manage prerequisites.',
      href: '/admin/academics/courses',
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Academic Years & Semesters',
      description: 'Set up the academic calendar and active semesters.',
      href: '/admin/academics/years',
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Grades',
      description: 'Enter, review, and publish student grades by course.',
      href: '/admin/academics/grades',
      icon: GraduationCap,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ]

  return (
    <div className="space-y-7">
      <PageHeader
        title="Academics"
        description="Manage departments, courses, academic years, and enrollments."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Departments" value={departments} icon={Building2} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/academics/departments" />
        <StatCard label="Courses" value={courses} icon={BookOpen} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/academics/courses" />
        <StatCard label="Active Enrollments" value={enrollments} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
      </div>

      {/* Academic year banner */}
      {currentYear ? (
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent_60%)]" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-blue-200 text-sm font-medium">Current Academic Year</p>
              <p className="text-2xl font-bold text-white mt-0.5">{currentYear.name}</p>
              {currentYear.semesters[0] && (
                <p className="text-blue-200 text-sm mt-1.5">
                  Active Semester: <span className="text-white font-semibold">{currentYear.semesters[0].name}</span>
                </p>
              )}
            </div>
            <Link
              href="/admin/academics/years"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              Manage Years <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-blue-500" />
          </div>
          <p className="font-semibold text-gray-800">No active academic year</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Create an academic year to start enrolling students.</p>
          <Link
            href="/admin/academics/years"
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Academic Year
          </Link>
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {navCards.map((c) => (
          <Link key={c.href} href={c.href} className="group">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all flex items-start gap-4">
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{c.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{c.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
