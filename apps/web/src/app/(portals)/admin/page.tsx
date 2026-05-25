import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Users, GraduationCap, DollarSign, BookOpen, Video,
  Megaphone, Brain, Vote, Settings, UserPlus,
  AlertTriangle, ChevronRight, CheckCircle2, XCircle, Clock,
  TrendingUp, FileText, Activity, Mail,
  BarChart3, UserCheck, BadgeCheck, UserCog, CalendarDays, Rocket,
} from 'lucide-react'
import { ModuleGrid } from '@/components/ui/module-grid'
import { getActiveSemester } from '@/lib/active-semester'

function IntegrationRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${ok ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
        {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {ok ? 'Connected' : 'Not set'}
      </span>
    </div>
  )
}

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId as string
  const adminUser = session.user as any
  const adminFirstName = adminUser.firstName ?? adminUser.name?.split(' ')[0] ?? 'Admin'

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    studentCount, staffCount, teacherCount, offeringCount,
    invoiceStats, pendingInvoiceCount,
    liveClassToday, liveNow,
    pendingLeave, pendingSubmissions,
    announcementCount,
    recentEnrollments,
    auditLogs,
    tenant,
    deptCount,
    courseCount,
    employeeCount,
  ] = await Promise.all([
    prisma.user.count({ where: { tenantId, role: 'STUDENT', status: 'ACTIVE' } }),
    prisma.user.count({ where: { tenantId, role: { in: ['STAFF', 'HR_ADMIN', 'REGISTRAR', 'FINANCE_ADMIN'] }, status: 'ACTIVE' } }),
    prisma.user.count({ where: { tenantId, role: 'TEACHER', status: 'ACTIVE' } }),
    prisma.courseOffering.count({ where: { tenantId } }),
    prisma.invoice.aggregate({ where: { tenantId, status: 'PAID', createdAt: { gte: startOfMonth } }, _sum: { paidAmount: true } }),
    prisma.invoice.count({ where: { tenantId, status: { in: ['DRAFT', 'SENT', 'OVERDUE', 'PARTIALLY_PAID'] } } }),
    prisma.liveClass.count({ where: { tenantId, scheduledAt: { gte: startOfToday } } }),
    prisma.liveClass.count({ where: { tenantId, status: 'LIVE' } }),
    prisma.leaveRequest.count({ where: { tenantId, status: 'PENDING' } }),
    prisma.submission.count({ where: { assignment: { courseOffering: { tenantId } }, status: 'SUBMITTED' } }),
    prisma.announcement.count({ where: { tenantId } }),
    prisma.enrollment.findMany({
      where: { tenantId, status: 'ENROLLED' },
      orderBy: { enrolledAt: 'desc' },
      take: 6,
      include: { courseOffering: { include: { course: true } } },
    }),
    prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, plan: true } }),
    prisma.department.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId } }),
    prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } }),
  ])

  const [activeSemester, feeStructureCount] = await Promise.all([
    getActiveSemester(tenantId),
    prisma.feeStructure.count({ where: { tenantId } }),
  ])

  const feesThisMonth = invoiceStats._sum.paidAmount ?? 0

  const studentIds = [...new Set(recentEnrollments.map(e => e.studentId))]
  const enrollmentStudents = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true },
  })
  const studentMap = Object.fromEntries(enrollmentStudents.map(u => [u.id, u]))

  const integrations = [
    { label: 'Database (Neon)', ok: true },
    { label: 'Cloudflare R2', ok: !!process.env.R2_ACCOUNT_ID },
    { label: 'Resend Email', ok: !!process.env.RESEND_API_KEY },
    { label: 'LiveKit Classes', ok: !!process.env.LIVEKIT_API_KEY },
    { label: 'Anthropic AI', ok: !!process.env.ANTHROPIC_API_KEY },
    { label: 'Paystack Payments', ok: !!process.env.PAYSTACK_SECRET_KEY },
  ]
  const connectedCount = integrations.filter(i => i.ok).length

  const statusGroups = [
    {
      label: 'Academics & Learning',
      Icon: GraduationCap,
      href: '/admin/academics',
      metrics: [
        { value: `${studentCount.toLocaleString()} students`, href: '/admin/students' },
        { value: `${deptCount} dept${deptCount !== 1 ? 's' : ''}`, href: '/admin/academics/departments' },
        { value: `${offeringCount} offerings`, href: '/admin/academics' },
        { value: `${liveClassToday} class${liveClassToday !== 1 ? 'es' : ''} today`, href: '/admin/live-classes', urgent: liveNow > 0, urgentLabel: `${liveNow} live` },
      ],
      links: [
        { label: 'LMS', href: '/admin/lms', Icon: BookOpen },
        { label: `${pendingSubmissions} to grade`, href: '/admin/lms', Icon: CheckCircle2, urgent: pendingSubmissions > 0 },
      ],
    },
    {
      label: 'Finance',
      Icon: DollarSign,
      href: '/admin/finance',
      metrics: [
        { value: `$${feesThisMonth.toLocaleString()} collected`, href: '/admin/finance' },
        { value: `${pendingInvoiceCount} unpaid`, href: '/admin/finance/invoices', urgent: pendingInvoiceCount > 0 },
      ],
      links: [
        { label: 'Fee Structures', href: '/admin/finance/fees', Icon: FileText },
        { label: 'Scholarships', href: '/admin/finance/scholarships', Icon: BadgeCheck },
      ],
    },
    {
      label: 'HR & Staff',
      Icon: UserCog,
      href: '/admin/hr',
      metrics: [
        { value: `${teacherCount} teacher${teacherCount !== 1 ? 's' : ''}`, href: '/admin/students' },
        { value: `${employeeCount} employee${employeeCount !== 1 ? 's' : ''}`, href: '/admin/hr/employees' },
        { value: `${pendingLeave} leave pending`, href: '/admin/hr/leave', urgent: pendingLeave > 0 },
      ],
      links: [
        { label: 'Payroll', href: '/admin/hr/payroll', Icon: TrendingUp },
        { label: 'Invites', href: '/admin/invites', Icon: UserPlus },
      ],
    },
    {
      label: 'Communication & Platform',
      Icon: Megaphone,
      href: '/admin/announcements',
      metrics: [
        { value: `${announcementCount} announcement${announcementCount !== 1 ? 's' : ''}`, href: '/admin/announcements' },
        { value: `${staffCount} staff`, href: '/admin/students' },
      ],
      links: [
        { label: 'AI & Early Warning', href: '/admin/ai', Icon: Brain },
        { label: 'Elections', href: '/admin/elections', Icon: Vote },
        { label: 'Settings', href: '/admin/settings', Icon: Settings },
      ],
    },
  ]

  const quickActions = [
    { label: 'Add User', desc: 'Create a student, teacher or staff account', href: '/admin/students', icon: UserPlus },
    { label: 'Send Invite', desc: 'Email an invite link to join the school', href: '/admin/invites', icon: Mail },
    { label: 'Post Announcement', desc: 'Broadcast a message school-wide', href: '/admin/announcements', icon: Megaphone },
    { label: 'Create Invoice', desc: 'Issue a new fee invoice to a student', href: '/admin/finance/invoices', icon: FileText },
    { label: 'Schedule Class', desc: 'Set up a live video class session', href: '/admin/live-classes', icon: Video },
    { label: 'AI Early Warning', desc: 'View at-risk student predictions', href: '/admin/ai', icon: Brain },
  ]

  const actionLabel = (action: string) => ({
    'user.created': 'User created',
    'user.updated': 'User updated',
    'user.deleted': 'User deleted',
    'invoice.paid': 'Invoice paid',
    'invoice.created': 'Invoice created',
    'enrollment.created': 'Student enrolled',
    'announcement.created': 'Announcement posted',
    'leave.approved': 'Leave approved',
    'leave.rejected': 'Leave rejected',
  } as Record<string, string>)[action] ?? action

  const setupSteps = [
    { label: 'Create an academic year', done: deptCount > 0 || courseCount > 0 || !!activeSemester, href: '/admin/academics/calendar', desc: 'Set up your first academic year and semesters' },
    { label: 'Launch a semester', done: !!activeSemester, href: '/admin/academics/calendar', desc: 'Make a semester active so the rest of the system works' },
    { label: 'Add departments & courses', done: deptCount > 0 && courseCount > 0, href: '/admin/academics/departments', desc: 'Create your faculty structure and course catalogue' },
    { label: 'Set up fee structures', done: feeStructureCount > 0, href: '/admin/finance/fees', desc: 'Define what students are charged each semester' },
    { label: 'Invite staff & students', done: studentCount > 0 || teacherCount > 0, href: '/admin/invites', desc: 'Bring your first users onto the platform' },
  ]
  const setupDone = setupSteps.filter(s => s.done).length

  const statCards = [
    { label: 'Students', value: studentCount.toLocaleString(), icon: GraduationCap, href: '/admin/students', primary: true },
    { label: 'Teachers', value: teacherCount.toLocaleString(), icon: UserCheck, href: '/admin/students', primary: true },
    { label: 'Staff', value: staffCount.toLocaleString(), icon: Users, href: '/admin/students', primary: false },
    { label: 'Offerings', value: offeringCount.toLocaleString(), icon: BookOpen, href: '/admin/academics', primary: true },
    { label: 'Fees / Month', value: `$${feesThisMonth.toLocaleString()}`, icon: TrendingUp, href: '/admin/finance', primary: true },
    { label: 'Classes Today', value: liveClassToday.toLocaleString(), icon: Video, href: '/admin/live-classes', primary: liveNow > 0 },
  ]

  const pendingTotal = pendingLeave + pendingSubmissions + pendingInvoiceCount

  return (
    <div className="space-y-6 pb-12">

      {/* ── Command Header ── */}
      <div className="relative bg-slate-900 rounded-2xl p-7 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.18),_transparent_55%)]" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-600/5 rounded-full" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-lg font-normal text-slate-300">{greeting}, <span className="text-indigo-400">{adminFirstName}</span></p>
            <h1 className="text-[30px] font-bold text-white leading-tight mt-0.5">{tenant?.name ?? 'Your School'}</h1>
            <p className="text-slate-400 text-sm mt-1.5">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {activeSemester && (
                <span className="ml-2 text-slate-500">
                  · {activeSemester.academicYear.name} &nbsp;·&nbsp; {activeSemester.name}
                </span>
              )}
            </p>
            <p className="text-slate-600 text-[11px] font-semibold uppercase tracking-widest mt-1">Admin Command Center</p>

            {/* ── Live pulse chips ── */}
            <div className="flex flex-wrap items-center gap-2 mt-4">

              {/* Chip 1 — Live classes */}
              <Link href="/admin/live-classes"
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-slate-300 text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors">
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${liveNow > 0 ? 'animate-ping bg-red-400' : 'bg-indigo-400'}`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${liveNow > 0 ? 'bg-red-400' : 'bg-indigo-500'}`} />
                </span>
                {liveNow > 0
                  ? <><span className="text-white font-semibold">{liveNow}</span> class{liveNow !== 1 ? 'es' : ''} live now</>
                  : <><span className="text-white font-semibold">{liveClassToday}</span> class{liveClassToday !== 1 ? 'es' : ''} today</>
                }
              </Link>

              {/* Chip 2 — Needs attention */}
              <Link href="/admin/hr/leave"
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-slate-300 text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors">
                <AlertTriangle className={`w-3 h-3 flex-shrink-0 ${pendingTotal > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                {pendingTotal > 0
                  ? <><span className="text-white font-semibold">{pendingTotal}</span> item{pendingTotal !== 1 ? 's' : ''} need attention</>
                  : <span className="text-slate-500">Nothing pending</span>
                }
              </Link>

              {/* Chip 3 — Fees collected */}
              <Link href="/admin/finance"
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-slate-300 text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors">
                <TrendingUp className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                <span className="text-white font-semibold">${feesThisMonth.toLocaleString()}</span> collected this month
              </Link>

            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Current Plan</span>
            <span className="text-3xl font-bold text-white">{tenant?.plan ?? 'STARTER'}</span>
            <span className="text-slate-400 text-xs mt-0.5">{studentCount.toLocaleString()} active students</span>
            <Link href="/admin/settings"
              className="mt-3 inline-flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors">
              Manage plan <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Setup Checklist ── */}
      {setupDone < setupSteps.length && (
        <div className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(99,102,241,0.07)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Rocket className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Getting started</p>
                <p className="text-xs text-slate-400">{setupDone}/{setupSteps.length} steps complete</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-36 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(setupDone / setupSteps.length) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-indigo-600 w-8 text-right">{Math.round((setupDone / setupSteps.length) * 100)}%</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {setupSteps.map((step, i) => (
              <Link key={i} href={step.done ? '#' : step.href}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${step.done ? 'opacity-50 cursor-default' : 'hover:bg-indigo-50/40'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                  {step.done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    : <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${step.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>{step.label}</p>
                  {!step.done && <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>}
                </div>
                {!step.done && (
                  <div className="flex items-center gap-1 text-xs text-indigo-600 font-semibold flex-shrink-0">
                    {i === 1 ? <><CalendarDays className="w-3.5 h-3.5" /> Launch</> : <><ChevronRight className="w-3.5 h-3.5" /> Set up</>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Key Stats ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 pl-0.5">Overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map(stat => (
            <Link key={stat.label} href={stat.href}
              className="group bg-white border border-gray-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-150">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                stat.primary ? 'bg-indigo-50 group-hover:bg-indigo-100' : 'bg-slate-50 group-hover:bg-slate-100'
              }`}>
                <stat.icon className={`w-4 h-4 ${stat.primary ? 'text-indigo-600' : 'text-slate-400'}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">{stat.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center justify-between mb-3 pl-0.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Quick Actions</p>
          <span className="text-xs text-slate-400">press <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[11px] font-mono text-slate-500">⌘K</kbd></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map(action => (
            <Link key={action.label} href={action.href}
              className="group flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all duration-150">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <action.icon className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 leading-tight">{action.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Needs Attention ── */}
      {pendingTotal > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-3 pl-0.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Needs Attention</p>
            <span className="text-[11px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">{pendingTotal}</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {pendingLeave > 0 && (
              <Link href="/admin/hr/leave"
                className="group flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:border-amber-200 hover:bg-amber-50/20 transition-all">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{pendingLeave} Leave Request{pendingLeave !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-slate-400">Awaiting your approval</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-amber-400 transition-colors flex-shrink-0" />
              </Link>
            )}
            {pendingSubmissions > 0 && (
              <Link href="/admin/lms"
                className="group flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{pendingSubmissions} Submission{pendingSubmissions !== 1 ? 's' : ''} to Grade</p>
                  <p className="text-xs text-slate-400">Ungraded student work</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </Link>
            )}
            {pendingInvoiceCount > 0 && (
              <Link href="/admin/finance/invoices"
                className="group flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:border-red-200 hover:bg-red-50/20 transition-all">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{pendingInvoiceCount} Unpaid Invoice{pendingInvoiceCount !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-slate-400">Outstanding fee payments</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-red-400 transition-colors flex-shrink-0" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Platform Status + Integrations ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Status board */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
            <BarChart3 className="w-4 h-4 text-slate-300" />
            <span className="font-semibold text-slate-900 text-sm">Platform Overview</span>
          </div>
          <div className="divide-y divide-gray-50">
            {statusGroups.map(group => (
              <div key={group.label} className="px-5 py-4 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <Link href={group.href} className="flex items-center gap-2.5 min-w-[195px] flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <group.Icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{group.label}</span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    {group.metrics.map(m => (
                      <Link key={m.value} href={m.href}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          m.urgent
                            ? 'bg-slate-900 text-white hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}>
                        {m.urgent && (m as any).urgentLabel
                          ? <><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />{(m as any).urgentLabel}</>
                          : m.urgent
                          ? <><AlertTriangle className="w-3 h-3" />{m.value}</>
                          : m.value
                        }
                      </Link>
                    ))}
                    <span className="text-slate-200 text-xs select-none">·</span>
                    {group.links.map(l => (
                      <Link key={l.href + l.label} href={l.href}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <l.Icon className="w-3 h-3" />
                        {l.label}
                      </Link>
                    ))}
                  </div>
                  <Link href={group.href} className="flex-shrink-0 text-slate-200 hover:text-indigo-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-300" />
              <span className="font-semibold text-slate-900 text-sm">Integrations</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${connectedCount === integrations.length ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
              {connectedCount}/{integrations.length}
            </span>
          </div>
          <div className="px-5 pb-5">
            <div className="divide-y divide-gray-50">
              {integrations.map(i => (
                <IntegrationRow key={i.label} label={i.label} ok={i.ok} />
              ))}
            </div>
            {connectedCount < integrations.length && (
              <Link href="/admin/settings" className="mt-4 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
                <Settings className="w-3 h-3" /> Configure in Settings
              </Link>
            )}
          </div>
        </div>

      </div>

      {/* ── Recent Enrollments + Activity ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-slate-900 text-sm">Recent Enrollments</span>
            </div>
            <Link href="/admin/academics" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">View all</Link>
          </div>
          {recentEnrollments.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No enrollments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentEnrollments.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {studentMap[e.studentId]?.firstName?.[0]}{studentMap[e.studentId]?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {studentMap[e.studentId]?.firstName} {studentMap[e.studentId]?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{e.courseOffering.course.code} · {e.courseOffering.course.title}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(e.enrolledAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
            <Activity className="w-4 h-4 text-slate-300" />
            <span className="font-semibold text-slate-900 text-sm">Recent Activity</span>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {auditLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{actionLabel(log.action)}</p>
                    <p className="text-xs text-slate-400 truncate">{log.resource}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ''}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Module Directory ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 pl-0.5">Module Directory</p>
        <ModuleGrid />
      </div>

    </div>
  )
}
