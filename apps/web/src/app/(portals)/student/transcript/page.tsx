import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText, Download, Shield, Clock, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'

export default async function TranscriptPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const tenantId = (session.user as any).tenantId
  const userId   = (session.user as any).id

  const [user, grades, requests, offerApplication] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { tenant: true } }),
    prisma.grade.findMany({
      where: { tenantId, studentId: userId, publishedAt: { not: null } },
      include: {
        courseOffering: {
          include: {
            course: { include: { department: true } },
            semester: { include: { academicYear: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    (prisma as any).transcriptRequest.findMany({
      where: { tenantId, studentId: userId },
      orderBy: { issuedAt: 'desc' },
      take: 10,
    }),
    prisma.admissionApplication.findFirst({
      where: { tenantId, email: (session.user as any).email, status: { in: ['OFFERED', 'ACCEPTED'] }, offerLetterUrl: { not: null } },
      select: { referenceNumber: true, offerLetterUrl: true, programOfInterest: true, offerExpiry: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Group by academic year
  const byYear: Record<string, typeof grades> = {}
  for (const g of grades) {
    const year = g.courseOffering.semester.academicYear.name
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(g)
  }

  // Compute CGPA
  let totalPoints = 0, totalCredits = 0
  for (const g of grades) {
    totalPoints  += (g.gradePoint ?? 0) * g.courseOffering.course.creditHours
    totalCredits += g.courseOffering.course.creditHours
  }
  const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'

  const gradeColor: Record<string, string> = {
    A: 'text-green-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-orange-600', F: 'text-red-600',
  }

  const statusBadge = (status: string) => {
    if (status === 'READY')      return <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ready</span>
    if (status === 'DOWNLOADED') return <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Downloaded</span>
    return <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Pending</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Transcript</h1>
          <p className="text-gray-500">Official and unofficial academic records</p>
        </div>
      </div>

      {/* Download buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Official */}
        <a
          href="/api/student/transcript/pdf?type=official"
          className="flex items-start gap-4 p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors group"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base">Official Transcript</p>
            <p className="text-blue-200 text-sm mt-0.5">Watermarked PDF · QR verification code · Registrar signature</p>
          </div>
          <Download className="w-4 h-4 mt-1 text-blue-300 group-hover:text-white transition-colors" />
        </a>

        {/* Unofficial */}
        <a
          href="/api/student/transcript/pdf?type=unofficial"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 p-5 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-2xl transition-colors group"
        >
          <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
            <FileText className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base text-gray-900">Unofficial Transcript</p>
            <p className="text-gray-500 text-sm mt-0.5">Instant · For personal reference only · Opens in browser</p>
          </div>
          <ExternalLink className="w-4 h-4 mt-1 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </a>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <p>Official transcripts are digitally signed and contain a QR code that allows any institution to verify authenticity instantly by scanning.</p>
      </div>

      {/* Offer Letter */}
      {offerApplication?.offerLetterUrl && (
        <div className="flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-900 text-sm">Admission Offer Letter</p>
              <p className="text-xs text-green-700">
                {offerApplication.programOfInterest ?? 'Offer of Admission'}
                {offerApplication.referenceNumber ? ` · Ref: ${offerApplication.referenceNumber}` : ''}
                {offerApplication.offerExpiry ? ` · Expires: ${new Date(offerApplication.offerExpiry).toLocaleDateString('en-GB')}` : ''}
              </p>
            </div>
          </div>
          <a href={offerApplication.offerLetterUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0">
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      )}

      {/* Student info + CGPA */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user?.tenant.name.charAt(0)}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{user?.tenant.name}</p>
                <p className="text-xs text-gray-400">Official Transcript</p>
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex gap-8">
                <div><p className="text-gray-400 text-xs">Student Name</p><p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p></div>
                <div><p className="text-gray-400 text-xs">Email</p><p className="font-medium text-gray-900">{user?.email}</p></div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-blue-600">{cgpa}</p>
            <p className="text-sm text-gray-400">Cumulative GPA</p>
            <p className="text-sm text-gray-600 mt-1">{totalCredits} total credits</p>
            <p className="text-sm text-gray-500">{grades.length} courses</p>
          </div>
        </div>
      </div>

      {/* Request history */}
      {requests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Download History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {requests.map((r: any) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.type === 'OFFICIAL' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {r.type === 'OFFICIAL'
                    ? <Shield className="w-4 h-4 text-blue-600" />
                    : <FileText className="w-4 h-4 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{r.type === 'OFFICIAL' ? 'Official Transcript' : 'Unofficial Transcript'}</p>
                  <p className="text-xs text-gray-400">{new Date(r.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}{r.purpose ? ` · ${r.purpose}` : ''}</p>
                </div>
                {statusBadge(r.status)}
                {r.pdfUrl && (
                  <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    <Download className="w-4 h-4 text-gray-400" />
                  </a>
                )}
                {r.type === 'OFFICIAL' && r.verificationCode && (
                  <a href={`/verify/${r.verificationCode}`} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0" title="Verify document">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grades by Year */}
      {Object.keys(byYear).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-2xl">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No published grades on record.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byYear).map(([year, yearGrades]) => {
            const yPoints  = yearGrades.reduce((s, g) => s + (g.gradePoint ?? 0) * g.courseOffering.course.creditHours, 0)
            const yCredits = yearGrades.reduce((s, g) => s + g.courseOffering.course.creditHours, 0)
            const yGpa     = yCredits > 0 ? (yPoints / yCredits).toFixed(2) : '—'
            return (
              <div key={year} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{year}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{yCredits} credits</span>
                    <span className="font-bold text-gray-900">GPA: {yGpa}</span>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-2 text-xs text-gray-500 font-medium">Semester</th>
                      <th className="text-left px-5 py-2 text-xs text-gray-500 font-medium">Course</th>
                      <th className="text-left px-5 py-2 text-xs text-gray-500 font-medium">Title</th>
                      <th className="text-center px-5 py-2 text-xs text-gray-500 font-medium">Credits</th>
                      <th className="text-center px-5 py-2 text-xs text-gray-500 font-medium">Score</th>
                      <th className="text-center px-5 py-2 text-xs text-gray-500 font-medium">Grade</th>
                      <th className="text-center px-5 py-2 text-xs text-gray-500 font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearGrades.map((g) => (
                      <tr key={g.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-2.5 text-gray-500 text-xs">{g.courseOffering.semester.name}</td>
                        <td className="px-5 py-2.5 font-medium text-gray-900">{g.courseOffering.course.code}</td>
                        <td className="px-5 py-2.5 text-gray-600">{g.courseOffering.course.title}</td>
                        <td className="px-5 py-2.5 text-center text-gray-600">{g.courseOffering.course.creditHours}</td>
                        <td className="px-5 py-2.5 text-center text-gray-600">{g.totalScore ?? '—'}</td>
                        <td className="px-5 py-2.5 text-center">
                          <span className={`font-bold text-base ${gradeColor[g.letterGrade ?? ''] ?? ''}`}>{g.letterGrade ?? '—'}</span>
                        </td>
                        <td className="px-5 py-2.5 text-center text-gray-600">{g.gradePoint?.toFixed(1) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
