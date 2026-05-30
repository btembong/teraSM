import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText } from 'lucide-react'
import { StudentTranscriptRow } from './TranscriptActions'

export default async function TranscriptsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId as string

  const [students, profiles, requests] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, role: 'STUDENT', status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 200,
    }),
    (prisma as any).studentProfile.findMany({
      where: { tenantId },
      select: { userId: true, studentId: true, level: true, cgpa: true, totalCredits: true },
    }),
    (prisma as any).transcriptRequest.findMany({
      where: { tenantId },
      select: { studentId: true, issuedAt: true },
      orderBy: { issuedAt: 'desc' },
    }),
  ])

  const profileMap = Object.fromEntries(
    (profiles as any[]).map((p: any) => [p.userId, p])
  )

  // Count requests + latest date per student
  const countMap: Record<string, number> = {}
  const lastMap:  Record<string, string>  = {}
  for (const r of requests as any[]) {
    countMap[r.studentId] = (countMap[r.studentId] ?? 0) + 1
    if (!lastMap[r.studentId]) lastMap[r.studentId] = r.issuedAt.toISOString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Transcripts</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Generate official transcripts and view request history per student
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <FileText className="w-4 h-4 text-slate-300" />
          <span className="font-semibold text-slate-900 text-sm">
            All Students — {students.length}
          </span>
        </div>

        {students.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-400">No active students found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {students.map(s => {
              const p = profileMap[s.id]
              return (
                <StudentTranscriptRow
                  key={s.id}
                  id={s.id}
                  name={`${s.firstName} ${s.lastName}`}
                  email={s.email}
                  studentIdCode={p?.studentId ?? null}
                  level={p?.level ?? null}
                  cgpa={p?.cgpa ?? null}
                  totalCredits={p?.totalCredits ?? 0}
                  requestCount={countMap[s.id] ?? 0}
                  lastRequest={lastMap[s.id] ?? null}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
