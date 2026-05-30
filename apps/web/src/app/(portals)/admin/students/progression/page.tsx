import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getActiveSemester } from '@/lib/active-semester'
import { NoActiveSemester } from '@/components/ui/no-active-semester'
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, ChevronRight, GraduationCap } from 'lucide-react'
import Link from 'next/link'

type RiskLevel = 'AT_RISK' | 'BORDERLINE' | 'ON_TRACK' | 'EXCELLENT'

function riskLevel(cgpa: number, totalCredits: number, expectedCredits: number): RiskLevel {
  const deficit = expectedCredits - totalCredits
  if (cgpa < 1.5 || deficit > 20) return 'AT_RISK'
  if (cgpa < 2.0 || deficit > 10) return 'BORDERLINE'
  if (cgpa >= 3.5 && deficit <= 0) return 'EXCELLENT'
  return 'ON_TRACK'
}

const RISK_META: Record<RiskLevel, { label: string; color: string; icon: typeof AlertTriangle }> = {
  AT_RISK:    { label: 'At Risk',    color: 'bg-red-50 text-red-700 border-red-100',       icon: AlertTriangle },
  BORDERLINE: { label: 'Borderline', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  ON_TRACK:   { label: 'On Track',   color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: TrendingUp },
  EXCELLENT:  { label: 'Excellent',  color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
}

export default async function ProgressionPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId as string

  const activeSemester = await getActiveSemester(tenantId)
  if (!activeSemester) return <NoActiveSemester feature="Student progression" />

  // Fetch all active students with their profiles
  const students = await prisma.user.findMany({
    where: { tenantId, role: 'STUDENT', status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  const studentIds = students.map(s => s.id)

  // Fetch student profiles (level, cgpa, totalCredits, programId)
  const profiles = await (prisma as any).studentProfile.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, level: true, cgpa: true, totalCredits: true, programId: true, admissionYear: true },
  })
  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.userId, p]))

  // Fetch programs for credit thresholds
  const programs = await (prisma as any).program.findMany({
    where: { tenantId },
    select: { id: true, name: true, code: true, durationYears: true, requiredCredits: true, degreeType: true },
  })
  const programMap = Object.fromEntries(programs.map((p: any) => [p.id, p]))

  // Current year from active semester
  const currentYear = new Date(activeSemester.startDate).getFullYear()

  // Build student progression data
  const rows = students.map(s => {
    const profile = profileMap[s.id]
    const program = profile?.programId ? programMap[profile.programId] : null

    const level         = profile?.level ?? 100
    const cgpa          = profile?.cgpa ?? 0
    const totalCredits  = profile?.totalCredits ?? 0
    const admissionYear = profile?.admissionYear ?? currentYear

    // Expected credits at this point: based on years in program
    const yearsInProgram   = currentYear - admissionYear + 1
    const creditsPerYear   = program ? Math.round(program.requiredCredits / program.durationYears) : 30
    const expectedCredits  = Math.min(yearsInProgram * creditsPerYear, program?.requiredCredits ?? 120)

    // Level threshold: credits needed to be at next level
    const nextLevelCredits = level < 400 ? (level / 100) * creditsPerYear : program?.requiredCredits ?? 120
    const canAdvance       = totalCredits >= nextLevelCredits && level < 400

    const risk = riskLevel(cgpa, totalCredits, expectedCredits)

    return { ...s, level, cgpa, totalCredits, expectedCredits, creditsPerYear, canAdvance, risk, program }
  })

  // Group summaries
  const summary = {
    total:      rows.length,
    atRisk:     rows.filter(r => r.risk === 'AT_RISK').length,
    borderline: rows.filter(r => r.risk === 'BORDERLINE').length,
    onTrack:    rows.filter(r => r.risk === 'ON_TRACK').length,
    excellent:  rows.filter(r => r.risk === 'EXCELLENT').length,
    canAdvance: rows.filter(r => r.canAdvance).length,
  }

  // Group by level
  const byLevel = [100, 200, 300, 400].map(lvl => ({
    level: lvl,
    students: rows.filter(r => r.level === lvl),
  })).filter(g => g.students.length > 0)

  const levelLabel = (lvl: number) => `Level ${lvl} · Year ${lvl / 100}`

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-bold text-slate-900">Student Progression</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {activeSemester.academicYear.name} · {activeSemester.name} · {rows.length} active students
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Students', value: summary.total,      color: 'bg-slate-50',   text: 'text-slate-600' },
          { label: 'At Risk',        value: summary.atRisk,      color: 'bg-red-50',     text: 'text-red-600' },
          { label: 'Borderline',     value: summary.borderline,  color: 'bg-amber-50',   text: 'text-amber-600' },
          { label: 'On Track',       value: summary.onTrack,     color: 'bg-indigo-50',  text: 'text-indigo-600' },
          { label: 'Excellent',      value: summary.excellent,   color: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Ready to Advance', value: summary.canAdvance, color: 'bg-purple-50', text: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 border border-white`}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className={`text-xs font-medium mt-1 ${s.text} opacity-80`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3.5 text-sm text-indigo-700 flex items-start gap-3">
        <GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p className="text-xs leading-relaxed">
          <strong>Progression is currently calculated from StudentProfile data.</strong> Credit totals and CGPA
          update automatically when grades are posted. To promote a student to the next level, go to their
          profile and update their level. Bulk promotion tools are coming once ProgramCourse requirements
          are configured in Academic Structure.
        </p>
      </div>

      {/* Students grouped by level */}
      {byLevel.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center">
          <GraduationCap className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-sm">No student profiles found</p>
          <p className="text-slate-400 text-xs mt-1">Students need a StudentProfile record with level, CGPA, and credits to appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {byLevel.map(group => (
            <div key={group.level} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-700">{group.level}</span>
                  </div>
                  <span className="font-semibold text-slate-900 text-sm">{levelLabel(group.level)}</span>
                  <span className="text-xs text-slate-400">{group.students.length} student{group.students.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-red-500 font-semibold">{group.students.filter(s => s.risk === 'AT_RISK').length} at risk</span>
                  <span>·</span>
                  <span className="text-purple-600 font-semibold">{group.students.filter(s => s.canAdvance).length} ready to advance</span>
                </div>
              </div>
              <table className="w-full text-sm table-hover">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Program</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">CGPA</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Credits</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Expected</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {group.students.map(s => {
                    const meta = RISK_META[s.risk]
                    const RiskIcon = meta.icon
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-3 border-r border-gray-100">
                          <p className="font-semibold text-slate-900 text-sm">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-100">
                          {s.program
                            ? <span className="text-xs text-slate-600">{s.program.code}</span>
                            : <span className="text-xs text-slate-300 italic">No program</span>}
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-100">
                          <span className={`text-sm font-bold ${s.cgpa >= 3.5 ? 'text-emerald-600' : s.cgpa >= 2.0 ? 'text-slate-900' : 'text-red-500'}`}>
                            {s.cgpa.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-100">
                          <span className="font-semibold text-slate-900">{s.totalCredits}</span>
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-100">
                          <span className="text-slate-500">{s.expectedCredits}</span>
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-100">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                            <RiskIcon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/students/${s.id}`}
                            className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
