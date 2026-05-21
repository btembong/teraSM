import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

export default async function ParentAttendancePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const parentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const links = await prisma.parentStudent.findMany({ where: { tenantId, parentId } })
  const studentIds = links.map((l) => l.studentId)
  const children = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, firstName: true, lastName: true } })

  const attendanceByChild = await Promise.all(
    children.map(async (child) => {
      const records = await prisma.attendance.findMany({
        where: { tenantId, studentId: child.id },
        include: { courseOffering: { include: { course: true } } },
        orderBy: { date: 'desc' },
        take: 30,
      })
      const total = records.length
      const present = records.filter((r) => r.status === 'PRESENT').length
      const absent = records.filter((r) => r.status === 'ABSENT').length
      const rate = total > 0 ? Math.round((present / total) * 100) : 0
      return { child, records, total, present, absent, rate }
    })
  )

  const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
    PRESENT: CheckCircle, ABSENT: XCircle, LATE: Clock, EXCUSED: AlertTriangle,
  }
  const statusColor: Record<string, string> = {
    PRESENT: 'text-blue-500', ABSENT: 'text-gray-900', LATE: 'text-blue-400', EXCUSED: 'text-gray-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500">Track your child's class attendance</p>
      </div>

      {attendanceByChild.map(({ child, records, total, present, absent, rate }) => (
        <div key={child.id} className="space-y-3">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Attendance Rate', value: `${rate}%`, color: rate < 75 ? 'text-gray-900' : 'text-blue-600' },
              { label: 'Present', value: present, color: 'text-blue-600' },
              { label: 'Absent', value: absent, color: 'text-gray-900' },
              { label: 'Total Classes', value: total, color: 'text-gray-900' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{child.firstName} {child.lastName} — Recent Records</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {records.slice(0, 15).map((r) => {
                const Icon = statusIcon[r.status] ?? CheckCircle
                return (
                  <div key={r.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${statusColor[r.status] ?? 'text-gray-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.courseOffering.course.title}</p>
                        <p className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${statusColor[r.status] ?? 'text-gray-400'}`}>{r.status}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
