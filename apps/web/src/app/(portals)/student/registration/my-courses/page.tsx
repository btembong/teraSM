import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, Clock, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { PrintButton } from './PrintButton'

const DAY_SHORT: Record<string, string> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat',
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default async function MyCoursesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const studentId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const semester = await (prisma as any).semester.findFirst({
    where: { tenantId, isCurrent: true },
    include: { academicYear: { select: { name: true } } },
  }) as any

  const enrollments: any[] = semester ? await (prisma as any).enrollment.findMany({
    where: {
      tenantId, studentId,
      courseOffering: { semesterId: semester.id },
      status: { in: ['ENROLLED', 'WAITLISTED'] },
    },
    include: {
      courseOffering: {
        include: {
          course: { include: { department: { select: { name: true } } } },
          teacher: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'asc' },
  }) : []

  // Compute waitlist positions
  const waitlistPositions: Record<string, number> = {}
  await Promise.all(
    enrollments.filter(e => e.status === 'WAITLISTED').map(async e => {
      const pos = await prisma.enrollment.count({
        where: { courseOfferingId: e.courseOfferingId, status: 'WAITLISTED', enrolledAt: { lte: e.enrolledAt } },
      })
      waitlistPositions[e.id] = pos
    })
  )

  const enrolled = enrollments.filter(e => e.status === 'ENROLLED')
  const waitlisted = enrollments.filter(e => e.status === 'WAITLISTED')
  const totalCredits = enrolled.reduce((s, e) => s + e.courseOffering.course.creditHours, 0)
  const maxCredits = semester?.maxCreditsPerStudent ?? 21

  const studentName = session.user.name ?? 'Student'
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, logoUrl: true, email: true, phone: true, country: true, address: true, city: true, state: true, postalCode: true, website: true } })

  const studentProfile = await (prisma as any).studentProfile.findFirst({
    where: { tenantId, userId: studentId },
  }) as { studentId: string; programId: string | null; level: number } | null

  type DeptInfo = { name: string; faculty: { name: string } | null } | null
  let department: DeptInfo = null
  if (studentProfile?.programId) {
    department = await (prisma as any).department.findUnique({
      where: { id: studentProfile.programId },
      include: { faculty: { select: { name: true } } },
    }) as DeptInfo
  }

  return (
    <>
      {/* ── Print isolation styles ───────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          /* Hide everything on the page */
          body * { visibility: hidden !important; }
          /* Show only the print area */
          #reg-print-area, #reg-print-area * { visibility: visible !important; }
          #reg-print-area {
            position: fixed; inset: 0;
            padding: 20px 24px;
            background: white;
          }
          /* Preserve colors */
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Table styles */
          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th, td { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; }
          thead tr { background-color: #f3f4f6 !important; }
        }
      `}</style>

      <div className="space-y-6">
        {/* ── Page header (screen only) ──────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Registrations</h1>
            {semester && (
              <p className="text-sm text-gray-500 mt-0.5">{semester.name} — {semester.academicYear.name}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/student/registration" className="text-sm text-blue-600 font-medium hover:underline">
              Back to catalog
            </Link>
            <PrintButton />
          </div>
        </div>

        {!semester ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No active semester.</p>
          </div>
        ) : (
          <>
            {/* ── Printable area ─────────────────────────────────────────── */}
            <div id="reg-print-area" className="space-y-4">

              {/* ── Outer document box (print only) ────────────────────────── */}
              <div className="print:border print:border-gray-700 print:rounded-xl">

                {/* Print-only letterhead */}
                <div className="hidden print:block print:px-7 print:pt-6">

                  {/* Logo — centered */}
                  <div className="flex justify-center mb-4">
                    {tenant?.logoUrl
                      ? <img src={tenant.logoUrl} alt="" className="h-16 object-contain" />
                      : <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xl font-bold">{(tenant?.name ?? 'SM').slice(0, 2).toUpperCase()}</span>
                        </div>
                    }
                  </div>

                  {/* Two-col: School details (left) | Admissions office + period (right) */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-snug">{tenant?.name}</p>
                      {tenant?.address && <p className="text-gray-500 mt-1">{tenant.address}</p>}
                      {(tenant?.city || tenant?.state) && (
                        <p className="text-gray-500">
                          {[tenant.city, tenant.state].filter(Boolean).join(', ')}
                          {tenant?.postalCode ? ` · ${tenant.postalCode}` : ''}
                        </p>
                      )}
                      {tenant?.country && <p className="text-gray-500">{tenant.country}</p>}
                      {tenant?.email   && <p className="text-gray-500 mt-1">{tenant.email}</p>}
                      {tenant?.phone   && <p className="text-gray-500">{tenant.phone}</p>}
                      {tenant?.website && <p className="text-gray-500">{tenant.website}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-700">Admissions Office</p>
                      <p className="text-gray-500 mt-1">Academic Year: <span className="font-semibold text-gray-800">{semester.academicYear.name}</span></p>
                      <p className="text-gray-500">Semester: <span className="font-semibold text-gray-800">{semester.name}</span></p>
                      <p className="text-gray-400 mt-1">Printed: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                    </div>
                  </div>

                  {/* Big centered heading */}
                  <div className="text-center border-y border-gray-200 my-4 py-3">
                    <p className="text-sm font-bold tracking-widest text-gray-900 uppercase">Course Registration Confirmation</p>
                  </div>

                  {/* Student info: name/email/faculty (left) | matric/dept (right) */}
                  <div className="grid grid-cols-2 gap-x-8 text-xs mb-5">
                    <div className="space-y-1.5">
                      <p><span className="text-gray-400 inline-block w-14">Student</span><span className="font-semibold text-gray-900">{studentName}</span></p>
                      <p><span className="text-gray-400 inline-block w-14">Email</span><span className="font-semibold text-gray-900">{session.user.email}</span></p>
                      <p><span className="text-gray-400 inline-block w-14">Faculty</span><span className="font-semibold text-gray-900">{department?.faculty?.name ?? '—'}</span></p>
                    </div>
                    <div className="space-y-1.5">
                      <p><span className="text-gray-400 inline-block w-24">Matric No</span><span className="font-semibold text-gray-900">{studentProfile?.studentId ?? '—'}</span></p>
                      <p><span className="text-gray-400 inline-block w-24">Department</span><span className="font-semibold text-gray-900">{department?.name ?? '—'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Student summary card — screen: full card | print: stripped */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden print:border-0 print:rounded-none print:overflow-visible">
                  {/* Screen-only: avatar, credit stats, credit bar */}
                  <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-50 print:hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">{studentName.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{studentName}</p>
                          <p className="text-xs text-gray-400">{session.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 sm:gap-4">
                        <div className="text-center">
                          <p className="text-xl font-bold text-blue-600">{enrolled.length}</p>
                          <p className="text-xs text-gray-400">Courses</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-blue-600">{totalCredits}</p>
                          <p className="text-xs text-gray-400">Credits</p>
                        </div>
                        <div className={`text-center ${totalCredits > maxCredits ? 'text-red-500' : ''}`}>
                          <p className="text-xl font-bold">{maxCredits}</p>
                          <p className="text-xs text-gray-400">Max</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>Credit load</span>
                        <span className="font-semibold">{totalCredits} / {maxCredits}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${totalCredits > maxCredits ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min((totalCredits / maxCredits) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                {/* Enrolled courses */}
                {enrolled.length === 0 ? (
                  <div className="p-10 text-center">
                    <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No courses enrolled yet.</p>
                    <Link href="/student/registration" className="text-sm text-blue-600 font-medium mt-2 inline-block hover:underline">
                      Browse catalog
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Mobile cards (hidden on md+) */}
                    <div className="divide-y divide-gray-50 md:hidden print:hidden">
                      {enrolled.map(e => {
                        const co = e.courseOffering
                        const slots = (co.schedule as any[] | null) ?? []
                        return (
                          <div key={e.id} className="px-4 py-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{co.course.code}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{co.course.title}</p>
                              </div>
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {co.course.creditHours} cr
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span>{co.teacher.firstName} {co.teacher.lastName}</span>
                              {co.room && (
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{co.room}</span>
                              )}
                            </div>
                            {slots.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {slots.map((s: any, i: number) => (
                                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3 text-blue-400" />
                                    {DAY_SHORT[s.day] ?? s.day} {fmt12(s.startTime)}–{fmt12(s.endTime)}
                                  </span>
                                ))}
                              </div>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Enrolled
                            </span>
                          </div>
                        )
                      })}
                      <div className="px-4 py-3 bg-gray-50/70 flex justify-between text-xs font-semibold text-gray-600">
                        <span>Total credits</span>
                        <span className="text-blue-600">{totalCredits}</span>
                      </div>
                    </div>

                    {/* Desktop table (hidden on mobile, always shown for print) */}
                    <div className="hidden md:block print:block overflow-x-auto print:mx-7 print:mb-6 print:border print:border-gray-300 print:rounded-lg print:overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/70">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lecturer</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Schedule</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Credits</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide print:hidden">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {enrolled.map(e => {
                            const co = e.courseOffering
                            const slots = (co.schedule as any[] | null) ?? []
                            return (
                              <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-3.5">
                                  <p className="font-semibold text-gray-900">{co.course.code}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{co.course.title}</p>
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 text-xs">
                                  {co.teacher.firstName} {co.teacher.lastName}
                                </td>
                                <td className="px-4 py-3.5">
                                  {slots.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                                      <Clock className="w-3 h-3 text-blue-400" />
                                      {DAY_SHORT[s.day] ?? s.day} {fmt12(s.startTime)}–{fmt12(s.endTime)}
                                    </div>
                                  ))}
                                </td>
                                <td className="px-4 py-3.5 text-center font-semibold text-gray-900">{co.course.creditHours}</td>
                                <td className="px-4 py-3.5 text-xs text-gray-500">
                                  {co.room ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{co.room}</span> : '—'}
                                </td>
                                <td className="px-4 py-3.5 text-center print:hidden">
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                                    <CheckCircle className="w-3 h-3" /> Enrolled
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-100 bg-gray-50/70">
                            <td colSpan={3} className="px-6 py-3 text-xs font-semibold text-gray-500 print:hidden">Total</td>
                            <td colSpan={3} className="px-6 py-3 text-xs font-semibold text-gray-700 hidden print:table-cell">
                              Total Credits: {totalCredits} / {maxCredits}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-blue-600 print:hidden">{totalCredits}</td>
                            <td colSpan={2} className="print:hidden" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
              </div>{/* end print:border wrapper */}
            </div>

            {/* Waitlisted (screen only — excluded from print) */}
            {waitlisted.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-2xl overflow-hidden print:hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-yellow-100">
                  <Users className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-800">Waitlisted Courses ({waitlisted.length})</span>
                </div>
                <div className="divide-y divide-yellow-100/50">
                  {waitlisted.map(e => (
                    <div key={e.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-900">{e.courseOffering.course.code}</span>
                        <span className="text-sm text-gray-600 ml-2">{e.courseOffering.course.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-yellow-700">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        You will be enrolled automatically when a seat opens
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
