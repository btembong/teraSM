import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Users, GraduationCap, DollarSign, BookOpen, Video,
  Megaphone, Brain, Vote, Settings, UserPlus,
  AlertTriangle, ChevronRight, CheckCircle2, XCircle, Clock,
  TrendingUp, FileText, Activity, Mail,
  BarChart3, UserCheck, BadgeCheck, UserCog, Rocket,
  ArrowUpRight, Zap,
} from 'lucide-react'
import { CollapsibleModuleGrid } from '@/components/ui/collapsible-module-grid'
import { CommandPalette } from '@/components/ui/command-palette'
import { getActiveSemester } from '@/lib/active-semester'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function actionDot(action: string): string {
  if (action.includes('deleted') || action.includes('rejected')) return 'bg-red-500'
  if (action.includes('paid') || action.includes('approved') || action.includes('created') || action.includes('enrolled')) return 'bg-indigo-500'
  if (action.includes('updated')) return 'bg-blue-400'
  return 'bg-slate-300'
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
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

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

  const [activeSemester, feeStructureCount, newStudentsWeek, feesLastMonthStats, newTeachersMonth, recentAnnouncements] = await Promise.all([
    getActiveSemester(tenantId),
    prisma.feeStructure.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId, role: 'STUDENT', status: 'ACTIVE', createdAt: { gte: sevenDaysAgo } } }),
    prisma.invoice.aggregate({ where: { tenantId, status: 'PAID', createdAt: { gte: startOfLastMonth, lt: startOfMonth } }, _sum: { paidAmount: true } }),
    prisma.user.count({ where: { tenantId, role: 'TEACHER', status: 'ACTIVE', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.announcement.findMany({
      where: { tenantId, isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 4,
      select: { id: true, title: true, audience: true, isPinned: true, publishedAt: true, createdAt: true },
    }),
  ])

  const feesThisMonth = invoiceStats._sum.paidAmount ?? 0
  const feesLastMonth = feesLastMonthStats._sum.paidAmount ?? 0
  const feesDelta = feesThisMonth - feesLastMonth
  const isEmpty = studentCount === 0 && teacherCount === 0 && offeringCount === 0

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

  const pendingTotal = pendingLeave + pendingSubmissions + pendingInvoiceCount

  const planCap: Record<string, number> = { STARTER: 500, PRO: 3000, ENTERPRISE: 10000, UNIVERSITY: Infinity }
  const cap = planCap[tenant?.plan ?? 'STARTER'] ?? 500
  const capPct = cap === Infinity ? 0 : Math.min(100, Math.round((studentCount / cap) * 100))

  const todayStr = today.toDateString()
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(today.getDate() - 1)
  const yesterdayStr = yesterdayDate.toDateString()
  const groupedLogs = auditLogs.reduce((acc: Record<string, typeof auditLogs>, log) => {
    const dateStr = new Date(log.createdAt).toDateString()
    const group = dateStr === todayStr ? 'Today' : dateStr === yesterdayStr ? 'Yesterday' : 'Earlier'
    if (!acc[group]) acc[group] = []
    acc[group].push(log)
    return acc
  }, {})

  return (
    <div className="pb-16">

      <CommandPalette />

      {/* ── No active semester warning ── */}
      {!activeSemester && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">
            <span className="font-semibold">No active semester.</span> Most platform features are disabled until you launch one.
          </p>
          <Link href="/admin/academics/calendar"
            className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
            Set up now →
          </Link>
        </div>
      )}

      {/* ══ COMMAND HEADER ══ */}
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden mb-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.18),_transparent_55%)]" />
        {liveNow > 0 && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(239,68,68,0.09),_transparent_50%)]" />}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/5 rounded-full" />

        <div className="relative px-7 pt-7 pb-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm">{greeting}, <span className="text-indigo-400 font-medium">{adminFirstName}</span></p>
              <h1 className="text-3xl font-bold text-white mt-0.5 leading-tight">{tenant?.name ?? 'Your School'}</h1>
              <p className="text-slate-500 text-xs mt-2">
                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {activeSemester && (
                  <span className="text-slate-600 ml-1.5">· {activeSemester.academicYear.name} · {activeSemester.name}</span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Current Plan</span>
              <span className="text-xl font-bold text-white leading-tight">{tenant?.plan ?? 'STARTER'}</span>
              <span className="text-slate-400 text-[11px] mt-0.5">{studentCount.toLocaleString()} active students</span>
              {cap !== Infinity && (
                <div className="mt-1.5 w-28 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${capPct > 85 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${capPct}%` }} />
                </div>
              )}
              <Link href="/admin/settings"
                className="mt-2 inline-flex items-center gap-1 bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors">
                Manage plan <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Setup progress — embedded in header */}
          {setupDone < setupSteps.length && (
            <div className="mt-5 flex items-center gap-3">
              <Rocket className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="text-xs text-slate-500">Getting started</span>
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden max-w-[100px]">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(setupDone / setupSteps.length) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-indigo-400">{setupDone}/{setupSteps.length}</span>
              <Link href="/admin/academics/calendar" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Continue →
              </Link>
            </div>
          )}

          {/* Status strip — bottom of header */}
          <div className="flex flex-wrap mt-6 -mx-7 border-t border-slate-800">
            <Link href="/admin/live-classes" className="flex-1 min-w-[140px] flex items-center gap-2.5 px-6 py-3.5 hover:bg-slate-800/50 transition-colors group border-r border-slate-800">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                {liveNow > 0 && <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${liveNow > 0 ? 'bg-red-400' : 'bg-slate-600'}`} />
              </span>
              <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                {liveNow > 0
                  ? <><span className="text-red-400 font-bold">{liveNow}</span> live · {liveClassToday} today</>
                  : <><span className="text-slate-300 font-semibold">{liveClassToday}</span> class{liveClassToday !== 1 ? 'es' : ''} today</>
                }
              </span>
            </Link>
            <Link href="/admin/finance" className="flex-1 min-w-[140px] flex items-center gap-2.5 px-6 py-3.5 hover:bg-slate-800/50 transition-colors group border-r border-slate-800">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                <span className="text-indigo-300 font-bold">${feesThisMonth.toLocaleString()}</span> this month
              </span>
            </Link>
            <Link href="/admin/hr/leave" className="flex-1 min-w-[140px] flex items-center gap-2.5 px-6 py-3.5 hover:bg-slate-800/50 transition-colors group">
              {pendingTotal > 0
                ? <AlertTriangle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                : <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              }
              <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                {pendingTotal > 0
                  ? <><span className="text-blue-400 font-bold">{pendingTotal}</span> need attention</>
                  : <span className="text-slate-600">All clear</span>
                }
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ══ MAIN 2-COL LAYOUT ══ */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* BENTO KPI GRID */}
          {isEmpty ? (
            <div className="col-span-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Your school is ready</h3>
              <p className="text-sm text-slate-500 mb-5 max-w-xs mx-auto">Start by setting up your academic structure, then invite your first students and staff.</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/admin/academics/departments" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  <GraduationCap className="w-4 h-4" /> Add departments
                </Link>
                <Link href="/admin/invites" className="inline-flex items-center gap-2 bg-white border border-indigo-200 hover:border-indigo-300 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  <UserPlus className="w-4 h-4" /> Invite users
                </Link>
              </div>
            </div>
          ) : (
          <div data-tour="kpi-grid" className="grid grid-cols-4 gap-3">

            {/* Students — wide */}
            <Link href="/admin/students" className="col-span-2 group bg-blue-50 border border-blue-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Students</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <p className="text-4xl font-black text-blue-900 leading-none">{studentCount.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-blue-500">active this semester</p>
                {newStudentsWeek > 0 && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">+{newStudentsWeek} this week</span>
                )}
              </div>
              {cap !== Infinity && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] text-blue-400 mb-1">
                    <span>Plan cap ({cap.toLocaleString()})</span>
                    <span className="font-bold">{capPct}%</span>
                  </div>
                  <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${capPct > 85 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${capPct}%` }} />
                  </div>
                </div>
              )}
            </Link>

            {/* Fees — wide */}
            <Link href="/admin/finance" className="col-span-2 group bg-indigo-50 border border-indigo-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Fees / Month</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-indigo-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-4xl font-black text-indigo-900 leading-none">${feesThisMonth.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {pendingInvoiceCount > 0
                  ? <span className="text-xs text-blue-600 font-semibold">{pendingInvoiceCount} invoice{pendingInvoiceCount !== 1 ? 's' : ''} outstanding</span>
                  : <span className="text-xs text-indigo-500">All invoices clear</span>
                }
                {feesLastMonth > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${feesDelta >= 0 ? 'text-indigo-600 bg-indigo-100' : 'text-red-600 bg-red-100'}`}>
                    {feesDelta >= 0 ? '+' : ''}${feesDelta.toLocaleString()} vs last month
                  </span>
                )}
              </div>
            </Link>

            {/* Teachers */}
            <Link href="/admin/hr" className="group bg-violet-50 border border-violet-100 rounded-2xl p-4 hover:border-violet-200 hover:shadow-sm transition-all">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-violet-200 transition-colors">
                <UserCheck className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-2xl font-black text-violet-900 leading-none">{teacherCount.toLocaleString()}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <p className="text-xs text-violet-500">Teachers</p>
                {newTeachersMonth > 0 && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1 py-0.5 rounded-full">+{newTeachersMonth}</span>
                )}
              </div>
            </Link>

            {/* Offerings */}
            <Link href="/admin/academics" className="group bg-indigo-50 border border-indigo-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-indigo-900 leading-none">{offeringCount.toLocaleString()}</p>
              <p className="text-xs text-indigo-500 mt-1.5">Offerings</p>
            </Link>

            {/* Classes Today */}
            <Link href="/admin/live-classes" className={`group relative rounded-2xl p-4 border hover:shadow-sm transition-all ${liveNow > 0 ? 'bg-red-50 border-red-200 hover:border-red-300' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
              <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-colors ${liveNow > 0 ? 'bg-red-100 group-hover:bg-red-200' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                {liveNow > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                )}
                <Video className={`w-4 h-4 ${liveNow > 0 ? 'text-red-600' : 'text-slate-500'}`} />
              </div>
              <p className={`text-2xl font-black leading-none ${liveNow > 0 ? 'text-red-900' : 'text-slate-900'}`}>{liveClassToday}</p>
              <p className={`text-xs mt-1.5 ${liveNow > 0 ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                {liveNow > 0 ? `${liveNow} live now` : 'Classes Today'}
              </p>
            </Link>

            {/* Staff */}
            <Link href="/admin/hr" className="group bg-blue-50 border border-blue-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-blue-900 leading-none">{staffCount.toLocaleString()}</p>
              <p className="text-xs text-blue-500 mt-1.5">Staff</p>
            </Link>

          </div>
          )}

          {/* NEEDS ATTENTION — inline banner */}
          {pendingTotal > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 text-blue-700 flex-shrink-0 mr-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wide">Needs attention</span>
              </div>
              {pendingLeave > 0 && (
                <Link href="/admin/hr/leave" className="inline-flex items-center gap-1.5 bg-white border border-blue-200 hover:border-blue-400 text-blue-800 text-xs font-medium px-3 py-1 rounded-full transition-colors">
                  <Clock className="w-3 h-3" /> {pendingLeave} leave request{pendingLeave !== 1 ? 's' : ''}
                </Link>
              )}
              {pendingSubmissions > 0 && (
                <Link href="/admin/lms" className="inline-flex items-center gap-1.5 bg-white border border-blue-200 hover:border-blue-400 text-blue-800 text-xs font-medium px-3 py-1 rounded-full transition-colors">
                  <CheckCircle2 className="w-3 h-3" /> {pendingSubmissions} to grade
                </Link>
              )}
              {pendingInvoiceCount > 0 && (
                <Link href="/admin/finance/invoices" className="inline-flex items-center gap-1.5 bg-white border border-blue-200 hover:border-blue-400 text-blue-800 text-xs font-medium px-3 py-1 rounded-full transition-colors">
                  <FileText className="w-3 h-3" /> {pendingInvoiceCount} unpaid invoice{pendingInvoiceCount !== 1 ? 's' : ''}
                </Link>
              )}
            </div>
          )}

          {/* QUICK ACTIONS — pill row */}
          <div data-tour="quick-actions">
            <div className="flex items-center justify-between mb-2.5 pl-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Actions</p>
              <span className="text-[11px] text-slate-400">
                press <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-mono text-slate-500">⌘K</kbd> to search all
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map(action => (
                <Link key={action.label} href={action.href}
                  className="group inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/40 transition-all">
                  <action.icon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* PLATFORM OVERVIEW */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
              <BarChart3 className="w-4 h-4 text-slate-300" />
              <span className="font-semibold text-slate-900 text-sm">Platform Overview</span>
            </div>
            <div className="divide-y divide-gray-50">
              {statusGroups.map(group => (
                <div key={group.label} className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Link href={group.href} className="flex items-center gap-2 w-44 flex-shrink-0">
                      <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <group.Icon className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors truncate">{group.label}</span>
                    </Link>
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      {group.metrics.map(m => (
                        <Link key={m.value} href={m.href}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                            m.urgent
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}>
                          {m.urgent && <AlertTriangle className="w-3 h-3" />}
                          {m.value}
                        </Link>
                      ))}
                      <span className="w-px h-3.5 bg-gray-200 self-center flex-shrink-0" />
                      {group.links.map(l => (
                        <Link key={l.href + l.label} href={l.href}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                          <l.Icon className="w-3 h-3" />{l.label}
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

        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="space-y-4">

          {/* LIVE ACTIVITY STREAM */}
          <div data-tour="activity-stream" className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-50">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-900 text-sm flex-1">Live Activity</span>
              {auditLogs.length > 0 && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
            </div>
            {auditLogs.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-xs text-slate-400">No activity yet</p>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-4 max-h-64 overflow-y-auto">
                {(['Today', 'Yesterday', 'Earlier'] as const).filter(g => groupedLogs[g]?.length).map(g => (
                  <div key={g}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{g}</p>
                    <div className="space-y-2.5">
                      {groupedLogs[g]!.map(log => {
                        const isAnnouncement = log.action.includes('announcement')
                        return (
                          <div key={log.id} className="flex items-start gap-2.5">
                            {isAnnouncement ? (
                              <div className="w-4 h-4 rounded-md bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Megaphone className="w-2.5 h-2.5 text-cyan-600" />
                              </div>
                            ) : (
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${actionDot(log.action)}`} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 leading-snug">{actionLabel(log.action)}</p>
                              <p className="text-[10px] text-slate-400 truncate">{log.resource}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ''}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">{timeAgo(new Date(log.createdAt))}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT ENROLLMENTS */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-slate-900 text-sm">Recent Enrollments</span>
              </div>
              <Link href="/admin/academics" className="text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold">All →</Link>
            </div>
            {recentEnrollments.length === 0 ? (
              <div className="px-4 py-8 text-center"><p className="text-xs text-slate-400">No enrollments yet</p></div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentEnrollments.slice(0, 5).map(e => (
                  <div key={e.id} className="flex items-center gap-2.5 px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {studentMap[e.studentId]?.firstName?.[0]}{studentMap[e.studentId]?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {studentMap[e.studentId]?.firstName} {studentMap[e.studentId]?.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{e.courseOffering.course.code} · {e.courseOffering.course.title}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">{timeAgo(new Date(e.enrolledAt))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT ANNOUNCEMENTS */}
          {recentAnnouncements.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="font-semibold text-slate-900 text-sm">Announcements</span>
                </div>
                <Link href="/admin/announcements" className="text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold">All →</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentAnnouncements.map(a => (
                  <div key={a.id} className="flex items-start gap-2.5 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {a.isPinned && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
                        <p className="text-xs font-semibold text-slate-900 truncate">{a.title}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{a.audience.toLowerCase().replace('_', ' ')}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">{timeAgo(new Date(a.publishedAt ?? a.createdAt))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INTEGRATIONS */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-semibold text-slate-900 text-sm">Integrations</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${connectedCount === integrations.length ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                {connectedCount}/{integrations.length}
              </span>
            </div>
            <div className="px-4 py-1 divide-y divide-gray-50">
              {integrations.map(i => (
                <div key={i.label} className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-slate-600">{i.label}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${i.ok ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                    {i.ok
                      ? <><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" /> Connected</>
                      : <><XCircle className="w-3 h-3" /> Not set</>
                    }
                  </span>
                </div>
              ))}
            </div>
            {connectedCount < integrations.length && (
              <div className="px-4 pb-3 pt-1">
                <Link href="/admin/settings" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
                  <Settings className="w-3 h-3" /> Configure in Settings
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MODULE DIRECTORY — collapsible */}
      <div className="mt-8">
        <CollapsibleModuleGrid />
      </div>

    </div>
  )
}
