import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'
import { ClipboardCheck, DollarSign, Calendar, Video, BookOpen, AlertCircle } from 'lucide-react'

type DeadlineItem = {
  id: string
  type: 'assignment' | 'fee' | 'live_class' | 'semester_end' | 'registration_close' | 'add_drop'
  title: string
  subtitle: string
  dueAt: Date
  link?: string
  urgent: boolean
}

function daysUntil(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateTime(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const TYPE_META = {
  assignment:        { icon: ClipboardCheck, bg: 'bg-blue-50',   iconColor: 'text-blue-600',   label: 'Assignment' },
  fee:               { icon: DollarSign,     bg: 'bg-orange-50', iconColor: 'text-orange-600', label: 'Fee Due' },
  live_class:        { icon: Video,          bg: 'bg-red-50',    iconColor: 'text-red-600',    label: 'Live Class' },
  semester_end:      { icon: Calendar,       bg: 'bg-purple-50', iconColor: 'text-purple-600', label: 'Semester' },
  registration_close:{ icon: BookOpen,       bg: 'bg-teal-50',   iconColor: 'text-teal-600',   label: 'Registration' },
  add_drop:          { icon: AlertCircle,    bg: 'bg-yellow-50', iconColor: 'text-yellow-600', label: 'Add/Drop' },
}

export default async function StudentDeadlinesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId
  const now = new Date()

  const currentSemester = await getActiveSemester(tenantId)

  const [assignments, invoices, liveClasses] = await Promise.all([
    // Upcoming assignments
    prisma.assignment.findMany({
      where: {
        tenantId,
        isPublished: true,
        dueDate: { gte: now },
        courseOffering: { enrollments: { some: { studentId, status: 'ENROLLED' } } },
      },
      include: { courseOffering: { include: { course: true } } },
      orderBy: { dueDate: 'asc' },
      take: 30,
    }),
    // Outstanding invoices
    prisma.invoice.findMany({
      where: {
        tenantId,
        studentId,
        status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
        dueDate: { gte: new Date(now.getTime() - 30 * 86400000) }, // show up to 30 days overdue
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    }),
    // Upcoming live classes
    prisma.liveClass.findMany({
      where: {
        tenantId,
        scheduledAt: { gte: now },
        status: { in: ['SCHEDULED', 'LIVE'] },
        courseOffering: { enrollments: { some: { studentId, status: 'ENROLLED' } } },
      },
      include: { courseOffering: { include: { course: true } } },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    }),
  ])

  const items: DeadlineItem[] = []

  // Assignments
  for (const a of assignments) {
    const days = daysUntil(new Date(a.dueDate))
    items.push({
      id: `asgn-${a.id}`,
      type: 'assignment',
      title: a.title,
      subtitle: `${a.courseOffering.course.code} · ${a.courseOffering.course.title}`,
      dueAt: new Date(a.dueDate),
      link: `/student/assignments/${a.id}`,
      urgent: days <= 1,
    })
  }

  // Fees
  for (const inv of invoices) {
    if (!inv.dueDate) continue
    const days = daysUntil(new Date(inv.dueDate))
    const overdue = days < 0
    const balance = inv.totalAmount - inv.paidAmount
    items.push({
      id: `inv-${inv.id}`,
      type: 'fee',
      title: overdue ? `Overdue: $${balance.toFixed(2)} outstanding` : `Fee Due: $${balance.toFixed(2)}`,
      subtitle: `Invoice ${inv.invoiceNo}`,
      dueAt: new Date(inv.dueDate),
      link: '/student/fees',
      urgent: days <= 3,
    })
  }

  // Live classes
  for (const lc of liveClasses) {
    const days = daysUntil(new Date(lc.scheduledAt))
    items.push({
      id: `lc-${lc.id}`,
      type: 'live_class',
      title: lc.title,
      subtitle: `${lc.courseOffering.course.code} · ${lc.durationMins} min`,
      dueAt: new Date(lc.scheduledAt),
      link: `/student/live-classes/${lc.id}`,
      urgent: days === 0,
    })
  }

  // Academic calendar milestones from semester
  if (currentSemester) {
    const semEnd = new Date(currentSemester.endDate as any)
    if (semEnd > now) {
      items.push({
        id: 'sem-end',
        type: 'semester_end',
        title: `${currentSemester.name} Semester Ends`,
        subtitle: (currentSemester.academicYear as any).name,
        dueAt: semEnd,
        urgent: daysUntil(semEnd) <= 14,
      })
    }

    if (currentSemester.registrationClose && new Date(currentSemester.registrationClose as any) > now) {
      items.push({
        id: 'reg-close',
        type: 'registration_close',
        title: 'Course Registration Closes',
        subtitle: 'Last day to register for courses',
        dueAt: new Date(currentSemester.registrationClose as any),
        link: '/student/registration',
        urgent: daysUntil(new Date(currentSemester.registrationClose as any)) <= 3,
      })
    }

    if (currentSemester.addDropDeadline && new Date(currentSemester.addDropDeadline as any) > now) {
      items.push({
        id: 'add-drop',
        type: 'add_drop',
        title: 'Add/Drop Deadline',
        subtitle: 'Last day to add or drop a course',
        dueAt: new Date(currentSemester.addDropDeadline as any),
        link: '/student/registration',
        urgent: daysUntil(new Date(currentSemester.addDropDeadline as any)) <= 3,
      })
    }
  }

  // Sort by due date
  items.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())

  // Separate overdue from upcoming
  const overdue = items.filter(i => daysUntil(i.dueAt) < 0)
  const upcoming = items.filter(i => daysUntil(i.dueAt) >= 0)

  function DeadlineCard({ item }: { item: DeadlineItem }) {
    const meta = TYPE_META[item.type]
    const days = daysUntil(item.dueAt)
    const isOverdue = days < 0
    const isToday = days === 0
    const isTomorrow = days === 1

    const dayLabel = isOverdue
      ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
      : isToday ? 'Today'
      : isTomorrow ? 'Tomorrow'
      : `${days} days`

    const dayColor = isOverdue ? 'text-red-600 bg-red-50'
      : isToday ? 'text-red-600 bg-red-50'
      : isTomorrow ? 'text-orange-600 bg-orange-50'
      : days <= 3 ? 'text-yellow-700 bg-yellow-50'
      : 'text-gray-500 bg-gray-100'

    const card = (
      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
        item.urgent ? 'border-red-100 bg-red-50/30' : 'border-gray-100 bg-white hover:bg-gray-50'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          <meta.icon className={`w-5 h-5 ${meta.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {item.type === 'live_class' ? fmtDateTime(item.dueAt) : fmtDate(item.dueAt)}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dayColor}`}>
            {dayLabel}
          </span>
          <p className="text-xs text-gray-400 mt-1">{meta.label}</p>
        </div>
      </div>
    )

    return item.link ? <Link href={item.link}>{card}</Link> : card
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deadline Tracker"
        description="All your upcoming deadlines in one place"
      />

      {overdue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide">Overdue</h2>
          </div>
          <div className="space-y-2">
            {overdue.map(item => <DeadlineCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {upcoming.length === 0 && overdue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No upcoming deadlines</p>
          <p className="text-sm text-gray-400 mt-1">You&apos;re all caught up!</p>
        </div>
      ) : upcoming.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map(item => <DeadlineCard key={item.id} item={item} />)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
