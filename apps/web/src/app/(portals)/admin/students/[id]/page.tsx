import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  User, Mail, Phone, GraduationCap, BookOpen, FileText,
  TrendingUp, Award, ChevronLeft, Calendar, Shield, ExternalLink,
} from 'lucide-react'

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const [user, profile, grades, transcriptRequests] = await Promise.all([
    prisma.user.findFirst({
      where: { id, tenantId, role: 'STUDENT' },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, avatarUrl: true, status: true, gender: true,
        dateOfBirth: true, createdAt: true, academicStanding: true,
      },
    }),
    (prisma as any).studentProfile.findUnique({
      where: { userId: id },
      include: {
        program: { select: { name: true, code: true, degreeType: true, durationYears: true } },
      },
    }),
    prisma.grade.findMany({
      where: { tenantId, studentId: id, publishedAt: { not: null } },
      include: {
        courseOffering: {
          include: {
            course: { select: { code: true, title: true, creditHours: true } },
            semester: { include: { academicYear: { select: { name: true } } } },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    }),
    (prisma as any).transcriptRequest.findMany({
      where: { tenantId, studentId: id },
      orderBy: { issuedAt: 'desc' },
      take: 5,
    }),
  ])

  if (!user) notFound()

  const gradeColor: Record<string, string> = {
    A: 'text-green-600', B: 'text-blue-600', C: 'text-amber-600',
    D: 'text-orange-600', F: 'text-red-600',
  }

  const standingColor: Record<string, string> = {
    GOOD_STANDING: 'bg-green-100 text-green-700',
    ACADEMIC_PROBATION: 'bg-amber-100 text-amber-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    DISMISSED: 'bg-red-100 text-red-700',
    GRADUATED: 'bg-blue-100 text-blue-700',
  }

  const standingLabel: Record<string, string> = {
    GOOD_STANDING: 'Good Standing',
    ACADEMIC_PROBATION: 'Academic Probation',
    SUSPENDED: 'Suspended',
    DISMISSED: 'Dismissed',
    GRADUATED: 'Graduated',
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/students"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> All Students
      </Link>

      {/* Header card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              : <span className="text-white text-xl font-bold">{initials}</span>}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{user.firstName} {user.lastName}</h1>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                user.status === 'ACTIVE' ? 'bg-green-100 text-green-700'
                : user.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600'
                : 'bg-red-100 text-red-700'
              }`}>{user.status}</span>
              {user.academicStanding && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${standingColor[user.academicStanding] ?? 'bg-gray-100 text-gray-600'}`}>
                  {standingLabel[user.academicStanding] ?? user.academicStanding}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{user.phone}</span>}
              {profile?.studentId && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />ID: <span className="font-mono font-medium text-slate-700">{profile.studentId}</span></span>}
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={`/admin/students/${id}/documents`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-3 py-2 rounded-xl transition-colors">
              <FileText className="w-3.5 h-3.5" /> Documents
            </Link>
            <Link href={`/admin/students/transcripts`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl transition-colors">
              <Shield className="w-3.5 h-3.5" /> Transcripts
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Academic profile */}
        <div className="space-y-6">

          {/* Academic stats */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Academic Profile</h2>
            </div>
            {profile ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-slate-500">Programme</span>
                  <span className="text-xs font-semibold text-slate-800 text-right max-w-[140px]">
                    {profile.program ? `${profile.program.name} (${profile.program.code})` : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-slate-500">Degree</span>
                  <span className="text-xs font-medium text-slate-700">{profile.program?.degreeType ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-slate-500">Level</span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">L{profile.level}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-slate-500">Admission Year</span>
                  <span className="text-xs font-medium text-slate-700">{profile.admissionYear}</span>
                </div>
                {profile.expectedGradYear && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs text-slate-500">Expected Grad</span>
                    <span className="text-xs font-medium text-slate-700">{profile.expectedGradYear}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-slate-500">Total Credits</span>
                  <span className="text-xs font-bold text-slate-800">{profile.totalCredits}</span>
                </div>

                {/* CGPA highlight */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-indigo-600">{(profile.cgpa ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Cumulative GPA</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No academic profile set up yet.</p>
            )}
          </div>

          {/* Transcript history */}
          {transcriptRequests.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">Transcript History</h2>
              </div>
              <div className="space-y-2">
                {(transcriptRequests as any[]).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-slate-700">{r.type === 'OFFICIAL' ? 'Official' : 'Unofficial'}</p>
                      <p className="text-xs text-slate-400">{new Date(r.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        r.status === 'READY' ? 'bg-green-100 text-green-700'
                        : r.status === 'DOWNLOADED' ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>{r.status}</span>
                      {r.pdfUrl && (
                        <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Recent grades */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">Recent Grades</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{grades.length}</span>
              </div>
              <Link href="/admin/students/grades"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                All grades <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {grades.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                No published grades yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Course</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Semester</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Credits</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Score</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Grade</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {grades.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900 text-xs">{g.courseOffering.course.code}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{g.courseOffering.course.title}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {g.courseOffering.semester.name}
                        <span className="block text-slate-400">{g.courseOffering.semester.academicYear.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-600">{g.courseOffering.course.creditHours}</td>
                      <td className="px-4 py-3 text-center text-xs text-slate-600">{g.totalScore ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${gradeColor[g.letterGrade?.charAt(0) ?? ''] ?? 'text-slate-600'}`}>
                          {g.letterGrade ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-600">{g.gradePoint?.toFixed(1) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
