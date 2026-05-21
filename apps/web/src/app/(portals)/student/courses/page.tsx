import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BookOpen, Clock, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'

export default async function StudentCoursesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const currentSemester = await prisma.semester.findFirst({
    where: { tenantId, isCurrent: true },
    include: { academicYear: true },
  })

  const enrollments = currentSemester
    ? await prisma.enrollment.findMany({
        where: {
          tenantId,
          studentId: userId,
          courseOffering: { semesterId: currentSemester.id },
          status: { in: ['ENROLLED', 'WAITLISTED'] },
        },
        include: {
          courseOffering: { include: { course: { include: { department: true } } } },
        },
      })
    : []

  const enrolledOfferingIds = enrollments.map((e) => e.courseOfferingId)
  const availableOfferings = currentSemester
    ? await prisma.courseOffering.findMany({
        where: {
          tenantId,
          semesterId: currentSemester.id,
          id: { notIn: enrolledOfferingIds },
        },
        include: {
          course: { include: { department: true } },
          _count: { select: { enrollments: true } },
        },
      })
    : []

  const deptColors = ['bg-blue-50 text-blue-700']

  return (
    <div className="space-y-7">
      <PageHeader
        title="My Courses"
        description={currentSemester
          ? `${currentSemester.name} Semester — ${currentSemester.academicYear.name}`
          : 'No active semester'}
      />

      {/* Enrolled Courses */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500" />
          Enrolled Courses
          <span className="ml-1 text-xs font-normal text-gray-400">({enrollments.length})</span>
        </h2>
        {enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100">
            <EmptyState
              icon={BookOpen}
              title="No courses enrolled"
              description="You have no courses enrolled for this semester yet."
              iconBg="bg-blue-50"
              iconColor="text-blue-400"
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e, i) => (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${deptColors[i % deptColors.length]}`}>
                    {e.courseOffering.course.code}
                  </span>
                  {e.status === 'WAITLISTED' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">Waitlisted</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug">{e.courseOffering.course.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{e.courseOffering.course.department.name}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-gray-400 border-t border-gray-50 pt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {e.courseOffering.course.creditHours} credits
                  </span>
                  {e.courseOffering.room && (
                    <span className="text-gray-400">{e.courseOffering.room}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available for Enrollment */}
      {availableOfferings.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Available for Enrollment
            <span className="ml-1 text-xs font-normal text-gray-400">({availableOfferings.length})</span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {availableOfferings.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all">
                <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                  {o.course.code}
                </span>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug">{o.course.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{o.course.department.name}</p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{o.course.creditHours} credits</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {o._count.enrollments}/{o.maxStudents}
                    </span>
                  </div>
                  <EnrollButton offeringId={o.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function EnrollButton({ offeringId }: { offeringId: string }) {
  return (
    <form action="/api/academics/enroll" method="POST">
      <input type="hidden" name="courseOfferingId" value={offeringId} />
      <button
        type="submit"
        className="text-xs bg-blue-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Enroll
      </button>
    </form>
  )
}
