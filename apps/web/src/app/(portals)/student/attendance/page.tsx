import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ClipboardList } from 'lucide-react'

const statusColor: Record<string, string> = {
  PRESENT: 'bg-blue-50 text-blue-700',
  ABSENT: 'bg-gray-900 text-white',
  LATE: 'bg-blue-100 text-blue-600',
  EXCUSED: 'bg-gray-100 text-gray-600',
}

export default async function StudentAttendancePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const currentSemester = await prisma.semester.findFirst({
    where: { tenantId, isCurrent: true },
    include: { academicYear: true },
  })

  // Get enrollments for current semester with attendance
  const enrollments = currentSemester
    ? await prisma.enrollment.findMany({
        where: {
          tenantId,
          studentId: userId,
          courseOffering: { semesterId: currentSemester.id },
          status: 'ENROLLED',
        },
        include: { courseOffering: { include: { course: true } } },
      })
    : []

  // Build summary per course
  const courseSummaries = await Promise.all(
    enrollments.map(async (e) => {
      const records = await prisma.attendance.findMany({
        where: { tenantId, studentId: userId, courseOfferingId: e.courseOfferingId },
        orderBy: { date: 'desc' },
      })
      const total = records.length
      const present = records.filter((r) => r.status === 'PRESENT').length
      const percentage = total > 0 ? Math.round((present / total) * 100) : null
      return { enrollment: e, records, total, present, percentage }
    }),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500">
          {currentSemester
            ? `${currentSemester.name} Semester — ${currentSemester.academicYear.name}`
            : 'No active semester'}
        </p>
      </div>

      {courseSummaries.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-2xl">
          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No attendance records yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courseSummaries.map(({ enrollment, records, total, present, percentage }) => (
            <div key={enrollment.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Course header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{enrollment.courseOffering.course.code} — {enrollment.courseOffering.course.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{total} classes recorded</p>
                </div>
                {percentage !== null && (
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${percentage >= 75 ? 'text-blue-600' : percentage >= 50 ? 'text-blue-400' : 'text-gray-900'}`}>
                      {percentage}%
                    </p>
                    <p className="text-xs text-gray-400">{present}/{total} present</p>
                  </div>
                )}
              </div>

              {/* Recent records */}
              {records.length > 0 && (
                <div className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    {records.slice(0, 20).map((r) => (
                      <div key={r.id} className="flex flex-col items-center gap-1">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${statusColor[r.status] ?? ''}`}>
                          {r.status[0]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
