import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { GraduationCap, BarChart2, DollarSign, ClipboardList, AlertCircle, ChevronRight } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { SectionCard, SectionRow } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'

export default async function ParentDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const parentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const links = await prisma.parentStudent.findMany({ where: { tenantId, parentId } })
  const studentIds = links.map((l) => l.studentId)

  const children = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
  })

  const childData = await Promise.all(
    children.map(async (child) => {
      const [grades, attendance, invoices, profile] = await Promise.all([
        prisma.grade.findMany({
          where: { tenantId, studentId: child.id, publishedAt: { not: null } },
          orderBy: { updatedAt: 'desc' },
          take: 4,
          include: { courseOffering: { include: { course: true } } },
        }),
        prisma.attendance.findMany({
          where: { tenantId, studentId: child.id },
          orderBy: { date: 'desc' },
          take: 10,
        }),
        prisma.invoice.findMany({
          where: { tenantId, studentId: child.id, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
          orderBy: { dueDate: 'asc' },
          take: 3,
        }),
        prisma.studentProfile.findFirst({ where: { tenantId, userId: child.id } }),
      ])

      const presentDays = attendance.filter((a) => a.status === 'PRESENT').length
      const attendanceRate = attendance.length > 0 ? Math.round((presentDays / attendance.length) * 100) : null
      const totalOwed = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0)

      return { child, grades, invoices, profile, attendanceRate, totalOwed }
    })
  )

  const gradeColor: Record<string, string> = {
    A: 'bg-blue-600 text-white',
    B: 'bg-blue-50 text-blue-700',
    C: 'bg-blue-100 text-blue-600',
    D: 'bg-gray-100 text-gray-600',
    F: 'bg-gray-900 text-white',
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-500">Monitor your child's academic progress</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100">
          <EmptyState
            icon={AlertCircle}
            title="No children linked"
            description="Contact the school administration to link your child's account to your parent profile."
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {childData.map(({ child, grades, invoices, profile, attendanceRate, totalOwed }) => (
        <div key={child.id} className="space-y-5">

          {/* ── Child banner ── */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08),_transparent_60%)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {child.firstName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{child.firstName} {child.lastName}</h2>
                  {profile && (
                    <p className="text-blue-200 text-sm mt-0.5">
                      Level {profile.level} · CGPA {profile.cgpa.toFixed(2)} · {profile.totalCredits} credits
                    </p>
                  )}
                </div>
              </div>
              {totalOwed > 0 && (
                <Link href="/parent/fees" className="inline-flex items-center gap-1.5 bg-blue-900/90 hover:bg-blue-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
                  <AlertCircle className="w-3.5 h-3.5" />
                  ${totalOwed.toLocaleString()} outstanding
                </Link>
              )}
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="CGPA"
              value={profile ? profile.cgpa.toFixed(2) : '—'}
              icon={GraduationCap}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              href="/parent/grades"
            />
            <StatCard
              label="Attendance Rate"
              value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
              icon={ClipboardList}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              href="/parent/attendance"
            />
            <StatCard
              label="Credits Earned"
              value={profile ? String(profile.totalCredits) : '—'}
              icon={BarChart2}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              label="Outstanding Fees"
              value={totalOwed > 0 ? `$${totalOwed.toLocaleString()}` : 'Nil'}
              icon={DollarSign}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              href="/parent/fees"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* ── Recent Grades ── */}
            <SectionCard
              title="Recent Grades"
              icon={GraduationCap}
              iconColor="text-blue-500"
              action={<Link href="/parent/grades" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>}
              noPadding
            >
              {grades.length === 0 ? (
                <EmptyState icon={GraduationCap} title="No grades published yet" iconBg="bg-blue-50" iconColor="text-blue-400" />
              ) : (
                <div>
                  {grades.map((g) => (
                    <SectionRow key={g.id}>
                      <p className="text-sm text-gray-700 truncate">{g.courseOffering.course.title}</p>
                      <div className="flex items-center gap-2.5 ml-3 flex-shrink-0">
                        {g.totalScore != null && (
                          <span className="text-sm font-semibold text-gray-900">{g.totalScore}%</span>
                        )}
                        {g.letterGrade && (
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${gradeColor[g.letterGrade] ?? 'bg-gray-50 text-gray-600'}`}>
                            {g.letterGrade}
                          </span>
                        )}
                      </div>
                    </SectionRow>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* ── Outstanding Invoices ── */}
            <SectionCard
              title="Outstanding Invoices"
              icon={DollarSign}
              iconColor="text-blue-500"
              action={<Link href="/parent/fees" className="text-xs text-blue-600 hover:underline font-medium">Pay fees</Link>}
              noPadding
            >
              {invoices.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="All fees paid"
                  description="No outstanding invoices."
                  iconBg="bg-blue-50"
                  iconColor="text-blue-500"
                />
              ) : (
                <div>
                  {invoices.map((inv) => (
                    <SectionRow key={inv.id}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{inv.invoiceNo}</p>
                        <p className="text-xs text-gray-400">
                          {inv.dueDate ? `Due ${new Date(inv.dueDate).toLocaleDateString()}` : 'No due date'}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-blue-700">${(inv.totalAmount - inv.paidAmount).toLocaleString()}</p>
                        <span className="text-xs text-gray-400">{inv.status.replace('_', ' ')}</span>
                      </div>
                    </SectionRow>
                  ))}
                  <div className="px-5 py-3">
                    <Link href="/parent/fees" className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                      Pay Now <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </SectionCard>

          </div>
        </div>
      ))}
    </div>
  )
}
