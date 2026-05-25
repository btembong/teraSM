import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Award, CheckCircle } from 'lucide-react'
import PrintButton from './_components/PrintButton'

export default async function CourseCertificatePage({
  params,
}: {
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const tenantId = (session.user as any).tenantId

  const [offering, enrollment, submissions, assignments, tenant] = await Promise.all([
    prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: {
        course: true,
        semester: { include: { academicYear: true } },
      },
    }),
    prisma.enrollment.findFirst({
      where: { studentId: userId, courseOfferingId: offeringId },
    }),
    prisma.submission.findMany({
      where: { studentId: userId, assignment: { courseOfferingId: offeringId }, status: 'GRADED' },
      select: { score: true, assignmentId: true },
    }),
    prisma.assignment.findMany({
      where: { courseOfferingId: offeringId, isPublished: true },
      select: { id: true, title: true, maxScore: true },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    }),
  ])

  if (!offering || !enrollment) redirect(`/student/courses/${offeringId}`)

  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  })

  const totalScore = submissions.reduce((s, sub) => s + (sub.score ?? 0), 0)
  const maxScore = assignments.reduce((s, a) => s + a.maxScore, 0)
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  const completedCount = submissions.length
  const isEligible = assignments.length === 0 || completedCount >= assignments.length * 0.7

  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/student/courses/${offeringId}`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Course Certificate</h1>
      </div>

      {!isEligible ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-2">
          <Award className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="font-semibold text-gray-900">Not Yet Eligible</h2>
          <p className="text-sm text-gray-600">
            You need to complete at least 70% of assignments to receive a certificate.
            Currently: {completedCount}/{assignments.length} completed.
          </p>
        </div>
      ) : (
        <>
          {/* Certificate */}
          <div className="bg-white border-4 border-indigo-200 rounded-3xl p-10 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-indigo-300 rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-indigo-300 rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-indigo-300 rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-indigo-300 rounded-br-xl" />

            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
                {tenant?.name ?? 'Tera SM'}
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Certificate of Completion</h2>
              <p className="text-gray-500 text-sm">This is to certify that</p>
            </div>

            <div>
              <p className="text-4xl font-bold text-indigo-700">
                {student?.firstName} {student?.lastName}
              </p>
              <p className="text-gray-400 text-sm mt-1">has successfully completed</p>
            </div>

            <div className="bg-indigo-50 rounded-2xl px-8 py-4">
              <p className="text-xl font-bold text-gray-900">{offering.course.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                {offering.course.code} · {offering.semester.name} · {offering.semester.academicYear.name}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{percentage}%</p>
                <p className="text-xs text-gray-400 mt-0.5">Overall Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">Assignments Done</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-700">{offering.course.creditHours ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Credit Hours</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 border-t border-gray-100 pt-4">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Issued on {issueDate}
            </div>
          </div>

          <PrintButton />
        </>
      )}
    </div>
  )
}
