import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Radio, Clock, CheckCircle, Users } from 'lucide-react'


export default async function StudentLiveClassesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  // Get courses the student is enrolled in
  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId, studentId, status: 'ENROLLED' },
    select: { courseOfferingId: true },
  })
  const offeringIds = enrollments.map((e) => e.courseOfferingId)

  const liveClasses = await prisma.liveClass.findMany({
    where: {
      tenantId,
      courseOfferingId: { in: offeringIds },
      status: { in: ['SCHEDULED', 'LIVE'] },
    },
    include: {
      courseOffering: { include: { course: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  const pastClasses = await prisma.liveClass.findMany({
    where: {
      tenantId,
      courseOfferingId: { in: offeringIds },
      status: 'ENDED',
    },
    include: {
      courseOffering: { include: { course: true } },
      _count: { select: { participants: true, recordings: true } },
    },
    orderBy: { scheduledAt: 'desc' },
    take: 20,
  })

  const liveSessions = liveClasses.filter((c) => c.status === 'LIVE')
  const upcoming = liveClasses.filter((c) => c.status === 'SCHEDULED')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
        <p className="text-gray-500">Join live sessions for your enrolled courses</p>
      </div>

      {/* Live now */}
      {liveSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            Live Now
          </h2>
          {liveSessions.map((lc) => (
            <div key={lc.id} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{lc.title}</p>
                <p className="text-sm text-gray-600 mt-1">{lc.courseOffering.course.title}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <Users className="w-3 h-3" />
                  {lc._count.participants} joined
                </div>
              </div>
              <Link
                href={`/student/live-classes/${lc.id}`}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Join Now
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Upcoming Sessions</h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No upcoming live classes.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.map((lc) => {
              const scheduled = new Date(lc.scheduledAt)
              const isToday = scheduled.toDateString() === new Date().toDateString()
              return (
                <div key={lc.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <Clock className={`w-5 h-5 ${isToday ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{lc.title}</p>
                      <p className="text-sm text-gray-500">
                        {lc.courseOffering.course.title} · {lc.durationMins}min
                      </p>
                      <p className={`text-xs mt-0.5 ${isToday ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {isToday ? 'Today' : scheduled.toLocaleDateString()} at {scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700">
                    SCHEDULED
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Past classes */}
      {pastClasses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Past Sessions</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {pastClasses.map((lc) => (
              <div key={lc.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{lc.title}</p>
                    <p className="text-sm text-gray-500">
                      {lc.courseOffering.course.title} · {new Date(lc.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(lc._count as any).recordings > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                      Recording available
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-600">ENDED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
