import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ClipboardList, Calendar, MapPin, Clock, BookOpen } from 'lucide-react'

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default async function InvigilationPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId
  const teacherId = (session.user as any).id

  const assignments = await prisma.examInvigilation.findMany({
    where: { tenantId, teacherId },
    include: {
      examSchedule: {
        include: { courseOffering: { include: { course: true } } },
      },
    },
    orderBy: { examSchedule: { examDate: 'asc' } },
  })

  const upcoming = assignments.filter(a => new Date(a.examSchedule.examDate) >= new Date())
  const past = assignments.filter(a => new Date(a.examSchedule.examDate) < new Date())

  function ExamCard({ a }: { a: typeof assignments[0] }) {
    const exam = a.examSchedule
    const course = exam.courseOffering.course
    const date = new Date(exam.examDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{exam.title}</p>
              {a.isPrimary && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Primary Invigilator</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{course.code} — {course.title}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{fmt12(exam.startTime)} – {fmt12(exam.endTime)}</span>
              {exam.venue && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{exam.venue}</span>}
            </div>
            {exam.notes && <p className="text-xs text-gray-400 mt-2 italic">{exam.notes}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-gray-700">{exam.totalMarks} marks</p>
            <p className="text-xs text-gray-400">total</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exam Invigilation Roster</h1>
        <p className="text-sm text-gray-500 mt-0.5">Exams you are assigned to invigilate</p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No invigilation assignments found.</p>
          <p className="text-sm text-gray-400 mt-1">Your admin will assign you to exams when scheduled.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Upcoming ({upcoming.length})
              </h2>
              {upcoming.map(a => <ExamCard key={a.id} a={a} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                Past ({past.length})
              </h2>
              <div className="opacity-60 space-y-3">
                {past.map(a => <ExamCard key={a.id} a={a} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
