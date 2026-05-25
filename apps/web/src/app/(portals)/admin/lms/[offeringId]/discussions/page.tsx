import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MessageSquare, Pin, Users } from 'lucide-react'

export default async function CourseDiscussionsPage({
  params,
}: {
  params: Promise<{ offeringId: string }>
}) {
  const { offeringId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const threads = await prisma.discussionThread.findMany({
    where: { tenantId, courseOfferingId: offeringId },
    include: {
      _count: { select: { posts: true } },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, authorId: true },
      },
    },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
  })

  const authorIds = [...new Set(threads.flatMap(t => t.posts.map(p => p.authorId)))]
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, firstName: true, lastName: true },
  })
  const authorMap = Object.fromEntries(authors.map(u => [u.id, u]))

  const pinned   = threads.filter(t => t.isPinned)
  const regular  = threads.filter(t => !t.isPinned)
  const totalPosts = threads.reduce((s, t) => s + t._count.posts, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Threads', value: threads.length },
          { label: 'Total Replies', value: totalPosts },
          { label: 'Pinned',        value: pinned.length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Thread list */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Discussion Threads</h2>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No discussions yet.</p>
            <p className="text-xs mt-1">Threads created by students or staff will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {threads.map(thread => {
              const lastPost = thread.posts[0]
              const lastAuthor = lastPost ? authorMap[lastPost.authorId] : null
              return (
                <div key={thread.id} className="flex items-start justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {thread.isPinned && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}
                        <p className="text-sm font-semibold text-gray-900">{thread.title}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span>
                          {new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {lastPost && (
                          <>
                            <span>·</span>
                            <span>
                              Last reply {new Date(lastPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {lastAuthor ? ` by ${lastAuthor.firstName}` : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{thread._count.posts}</span>
                    <span className="text-gray-300">{thread._count.posts === 1 ? 'reply' : 'replies'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
