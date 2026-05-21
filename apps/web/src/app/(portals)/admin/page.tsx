import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Users, GraduationCap, DollarSign, BookOpen, Video, Briefcase,
  Megaphone, Brain, Vote, Library, Settings, UserPlus,
  AlertTriangle, ChevronRight, CheckCircle2, XCircle, Clock,
  TrendingUp, FileText, Activity, Zap, Mail,
  BarChart3, UserCheck, BadgeCheck, UserCog, Building2,
} from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

function IntegrationRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${ok ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
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

  const today = new Date()
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

  return (
    <div className="space-y-7 pb-12">

      {/* ── Welcome banner ── */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{tenant?.name ?? 'Your School'}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {liveNow > 0 && (
                <Link href="/admin/live-classes" className="inline-flex items-center gap-1.5 bg-blue-500/90 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                  {liveNow} class{liveNow !== 1 ? 'es' : ''} live now
                </Link>
              )}
              {pendingLeave > 0 && (
                <Link href="/admin/hr/leave" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {pendingLeave} leave request{pendingLeave !== 1 ? 's' : ''}
                </Link>
              )}
              {pendingInvoiceCount > 0 && (
                <Link href="/admin/finance/invoices" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {pendingInvoiceCount} unpaid invoice{pendingInvoiceCount !== 1 ? 's' : ''}
                </Link>
              )}
              {pendingSubmissions > 0 && (
                <Link href="/admin/lms" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
                  <Clock className="w-3.5 h-3.5" />
                  {pendingSubmissions} submission{pendingSubmissions !== 1 ? 's' : ''} to grade
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div className="bg-white/10 rounded-xl px-4 py-3 text-white">
              <p className="text-2xl font-bold">{tenant?.plan ?? 'STARTER'}</p>
              <p className="text-blue-200 text-xs mt-0.5">Current plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Students" value={studentCount.toLocaleString()} icon={GraduationCap} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/students" />
        <StatCard label="Teachers" value={teacherCount.toLocaleString()} icon={UserCheck} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/students" />
        <StatCard label="Staff" value={staffCount.toLocaleString()} icon={Users} iconBg="bg-gray-100" iconColor="text-gray-500" href="/admin/students" />
        <StatCard label="Course Offerings" value={offeringCount.toLocaleString()} icon={BookOpen} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/academics" />
        <StatCard label="Fees / Month" value={`$${feesThisMonth.toLocaleString()}`} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/finance" />
        <StatCard label="Classes Today" value={liveClassToday.toLocaleString()} icon={Video} iconBg="bg-blue-50" iconColor="text-blue-600" href="/admin/live-classes" />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          <span className="text-xs text-gray-400 ml-1">— or press <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-xs font-mono text-gray-500">⌘K</kbd></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map(action => (
            <Link key={action.label} href={action.href}
              className="group flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all duration-150">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <action.icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Status Board + Health ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Status board */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900 text-sm">Platform Status</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {statusGroups.map(group => (
              <div key={group.label} className="px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-start gap-3">
                  {/* Icon + label */}
                  <Link href={group.href} className="flex items-center gap-2.5 min-w-[180px] flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <group.Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{group.label}</span>
                  </Link>

                  {/* Metrics + links */}
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    {group.metrics.map(m => (
                      <Link key={m.value} href={m.href}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          m.urgent
                            ? 'bg-gray-900 text-white hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                        }`}>
                        {m.urgent && m.urgentLabel
                          ? <><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />{m.urgentLabel}</>
                          : m.urgent
                          ? <><AlertTriangle className="w-3 h-3" />{m.value}</>
                          : m.value
                        }
                      </Link>
                    ))}
                    <span className="text-gray-200 text-xs select-none">·</span>
                    {group.links.map(l => (
                      <Link key={l.href + l.label} href={l.href}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <l.Icon className="w-3 h-3" />
                        {l.label}
                      </Link>
                    ))}
                  </div>

                  <Link href={group.href} className="flex-shrink-0 ml-1 text-gray-300 hover:text-blue-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">

          {/* Integration health */}
          <SectionCard
            title="Integrations"
            icon={Activity}
            action={
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${connectedCount === integrations.length ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {connectedCount}/{integrations.length} active
              </span>
            }
            noPadding
            bodyClassName="px-5 pb-4"
          >
            <div className="divide-y divide-gray-50">
              {integrations.map(i => (
                <IntegrationRow key={i.label} label={i.label} ok={i.ok} />
              ))}
            </div>
            {connectedCount < integrations.length && (
              <Link href="/admin/settings" className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Settings className="w-3 h-3" /> Configure in Settings
              </Link>
            )}
          </SectionCard>

          {/* Plan badge */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className="w-5 h-5 text-blue-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-200">Current Plan</span>
            </div>
            <p className="text-2xl font-bold">{tenant?.plan ?? 'STARTER'}</p>
            <p className="text-blue-200 text-xs mt-1">{studentCount.toLocaleString()} active students</p>
            <Link href="/admin/settings" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg">
              Manage plan <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </div>

      {/* ── Enrollments + Audit Log ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        <SectionCard
          title="Recent Enrollments"
          icon={UserCheck}
          iconColor="text-blue-500"
          action={<Link href="/admin/academics" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
          noPadding
        >
          {recentEnrollments.length === 0 ? (
            <EmptyState icon={UserCheck} title="No enrollments yet" iconBg="bg-blue-50" iconColor="text-blue-400" />
          ) : (
            <div>
              {recentEnrollments.map(e => (
                <SectionRow key={e.id}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {studentMap[e.studentId]?.firstName?.[0]}{studentMap[e.studentId]?.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{studentMap[e.studentId]?.firstName} {studentMap[e.studentId]?.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{e.courseOffering.course.code} — {e.courseOffering.course.title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-3">{new Date(e.enrolledAt).toLocaleDateString()}</span>
                </SectionRow>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Activity"
          icon={Activity}
          iconColor="text-gray-400"
          noPadding
        >
          {auditLogs.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" />
          ) : (
            <div>
              {auditLogs.map(log => (
                <SectionRow key={log.id}>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700">{actionLabel(log.action)}</p>
                      <p className="text-xs text-gray-400 truncate">{log.resource}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-3">{new Date(log.createdAt).toLocaleDateString()}</span>
                </SectionRow>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  )
}
