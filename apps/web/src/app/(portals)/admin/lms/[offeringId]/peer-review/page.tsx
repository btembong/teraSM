import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Users, CheckCircle2, Clock, Star } from 'lucide-react'

export default async function CoursePeerReviewPage({
  params,
}: {
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  // Fetch all submissions for this course that have peer reviews
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: { courseOfferingId: offeringId, tenantId },
      peerReviews: { some: {} },
    },
    include: {
      assignment: { select: { title: true, maxScore: true } },
      peerReviews: {
        select: {
          id: true,
          reviewerId: true,
          score: true,
          feedback: true,
          rubric: true,
          status: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  // Collect all reviewer + student ids
  const studentIds  = [...new Set(submissions.map(s => s.studentId))]
  const reviewerIds = [...new Set(submissions.flatMap(s => s.peerReviews.map(r => r.reviewerId)))]
  const allIds      = [...new Set([...studentIds, ...reviewerIds])]

  const users = await prisma.user.findMany({
    where: { id: { in: allIds } },
    select: { id: true, firstName: true, lastName: true },
  })
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  const totalReviews  = submissions.reduce((s, sub) => s + sub.peerReviews.length, 0)
  const pending       = submissions.reduce((s, sub) => s + sub.peerReviews.filter(r => r.status === 'PENDING').length, 0)
  const submitted     = submissions.reduce((s, sub) => s + sub.peerReviews.filter(r => r.status === 'SUBMITTED').length, 0)

  const avgScore = (() => {
    const scored = submissions.flatMap(s => s.peerReviews.filter(r => r.score !== null).map(r => r.score!))
    if (!scored.length) return null
    return (scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1)
  })()

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews',  value: totalReviews },
          { label: 'Pending',        value: pending,   color: pending > 0 ? 'text-amber-600' : 'text-gray-900' },
          { label: 'Submitted',      value: submitted },
          { label: 'Avg Peer Score', value: avgScore ?? '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className={`text-2xl font-bold ${(s as any).color ?? 'text-gray-900'}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No peer reviews assigned yet.</p>
          <p className="text-xs mt-1">Peer review assignments will appear here once created.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => {
            const student     = userMap[sub.studentId]
            const studentName = student ? `${student.firstName} ${student.lastName}` : sub.studentId
            const avgPeer = sub.peerReviews.filter(r => r.score !== null).length > 0
              ? (sub.peerReviews.reduce((s, r) => s + (r.score ?? 0), 0) / sub.peerReviews.filter(r => r.score !== null).length).toFixed(1)
              : null

            return (
              <div key={sub.id} className="bg-white rounded-2xl border border-gray-200">
                {/* Submission header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {student?.firstName?.[0] ?? '?'}{student?.lastName?.[0] ?? ''}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{studentName}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 ml-9">{sub.assignment.title}</p>
                  </div>
                  <div className="text-right">
                    {avgPeer !== null && (
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-sm font-bold text-gray-900">{avgPeer}</span>
                        <span className="text-xs text-gray-400">/ {sub.assignment.maxScore} avg</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">{sub.peerReviews.length} reviewer{sub.peerReviews.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Individual reviews */}
                <div className="divide-y divide-gray-50">
                  {sub.peerReviews.map(review => {
                    const reviewer     = userMap[review.reviewerId]
                    const reviewerName = reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : review.reviewerId
                    const isPending    = review.status === 'PENDING'

                    return (
                      <div key={review.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                              {reviewer?.firstName?.[0] ?? '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-700">{reviewerName}</p>
                              {review.feedback && (
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-3">{review.feedback}</p>
                              )}
                              {!review.feedback && isPending && (
                                <p className="text-xs text-gray-300 italic mt-1">No feedback submitted yet</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {review.score !== null ? (
                              <span className="text-sm font-bold text-blue-700">
                                {review.score}/{sub.assignment.maxScore}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                              isPending
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {isPending
                                ? <><Clock className="w-2.5 h-2.5" /> Pending</>
                                : <><CheckCircle2 className="w-2.5 h-2.5" /> Submitted</>
                              }
                            </span>
                          </div>
                        </div>

                        {/* Rubric breakdown */}
                        {review.rubric && Array.isArray((review.rubric as any).criteria) && (
                          <div className="mt-3 ml-9 grid grid-cols-2 gap-2">
                            {((review.rubric as any).criteria as Array<{ name: string; maxScore: number; score?: number; comment?: string }>).map((c, i) => (
                              <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="text-xs font-medium text-gray-600 truncate">{c.name}</p>
                                  <span className="text-xs font-bold text-gray-700 ml-2 flex-shrink-0">
                                    {c.score ?? '—'}/{c.maxScore}
                                  </span>
                                </div>
                                {c.comment && <p className="text-[10px] text-gray-400 leading-relaxed">{c.comment}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
