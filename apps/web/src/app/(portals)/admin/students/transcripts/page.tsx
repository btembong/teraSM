import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText, ChevronRight, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function TranscriptsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId as string

  const students = await prisma.user.findMany({
    where: { tenantId, role: 'STUDENT', status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 100,
  })

  const studentIds = students.map(s => s.id)

  const profiles = await (prisma as any).studentProfile.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, studentId: true, level: true, cgpa: true, totalCredits: true },
  })
  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.userId, p]))

  const gradeCounts = await prisma.grade.groupBy({
    by: ['studentId'],
    where: { tenantId, studentId: { in: studentIds } },
    _count: { id: true },
  })
  const gradeCountMap = Object.fromEntries(gradeCounts.map(g => [g.studentId, g._count.id]))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Transcripts</h2>
          <p className="text-sm text-slate-400 mt-0.5">Generate and manage student transcripts</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <FileText className="w-4 h-4 text-slate-300" />
          <span className="font-semibold text-slate-900 text-sm">All Students — {students.length}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Student</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Student ID</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Level</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">CGPA</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Credits</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-gray-100">Courses</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No students found.</td></tr>
            )}
            {students.map(s => {
              const profile = profileMap[s.id]
              const courseCount = gradeCountMap[s.id] ?? 0
              return (
                <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-5 py-3 border-r border-gray-100">
                    <p className="font-semibold text-slate-900">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-100">
                    <span className="text-xs font-mono text-slate-600">{profile?.studentId ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-100">
                    {profile ? (
                      <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        L{profile.level}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-100">
                    <span className={`text-sm font-bold ${(profile?.cgpa ?? 0) >= 3.5 ? 'text-emerald-600' : (profile?.cgpa ?? 0) >= 2.0 ? 'text-slate-900' : 'text-red-500'}`}>
                      {profile ? profile.cgpa.toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-700 font-medium border-r border-gray-100">
                    {profile?.totalCredits ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 border-r border-gray-100">{courseCount}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/students/${s.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      Transcript <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
