import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Megaphone, Pin } from 'lucide-react'

const audienceColor: Record<string, string> = {
  ALL: 'bg-blue-600 text-white',
  STUDENTS: 'bg-blue-50 text-blue-700',
  STAFF: 'bg-blue-100 text-blue-800',
}

export default async function StudentAnnouncementsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId

  const announcements = await prisma.announcement.findMany({
    where: {
      tenantId,
      isPublished: true,
      OR: [{ audience: 'ALL' }, { audience: 'STUDENTS' }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
    },
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
  })

  const authorIds = [...new Set(announcements.map((a) => a.authorId))]
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, firstName: true, lastName: true },
  })
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-500">School news and important updates</p>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => {
            const author = authorMap[a.authorId]
            return (
              <div key={a.id} className={`bg-white rounded-2xl border p-6 ${a.isPinned ? 'border-orange-200' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                    {a.isPinned
                      ? <Pin className="w-5 h-5 text-blue-500" />
                      : <Megaphone className="w-5 h-5 text-blue-600" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900">{a.title}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${audienceColor[a.audience] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.audience}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      {author && <span>Posted by {author.firstName} {author.lastName}</span>}
                      <span>·</span>
                      <span>{new Date(a.publishedAt ?? a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
