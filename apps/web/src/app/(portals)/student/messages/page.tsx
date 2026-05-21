import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MessageSquare, Users } from 'lucide-react'

export default async function StudentMessagesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const tenantId = (session.user as any).tenantId
  const userId = (session.user as any).id

  const conversations = await prisma.conversation.findMany({
    where: { tenantId, participants: { some: { userId } }, isArchived: false },
    include: {
      participants: { select: { userId: true, lastReadAt: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, createdAt: true, senderId: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  const allUserIds = [...new Set(conversations.flatMap((c) => c.participants.map((p) => p.userId)))]
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500">Your conversations and group chats</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No conversations yet</p>
            <p className="text-gray-400 text-sm mt-1">Message a teacher or classmate to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conv) => {
              const otherParticipants = conv.participants.filter((p) => p.userId !== userId)
              const lastMsg = conv.messages[0]
              const myParticipant = conv.participants.find((p) => p.userId === userId)
              const hasUnread = lastMsg && myParticipant?.lastReadAt
                ? new Date(lastMsg.createdAt) > new Date(myParticipant.lastReadAt) && lastMsg.senderId !== userId
                : !!lastMsg && lastMsg.senderId !== userId

              const displayName = conv.type === 'DIRECT'
                ? (() => { const u = userMap[otherParticipants[0]?.userId]; return u ? `${u.firstName} ${u.lastName}` : 'Unknown' })()
                : conv.name ?? 'Group Chat'

              return (
                <Link key={conv.id} href={`/student/messages/${conv.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                    {conv.type === 'GROUP'
                      ? <Users className="w-5 h-5 text-blue-600" />
                      : <span className="text-sm font-medium text-blue-700">{displayName[0]}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-gray-900 truncate ${hasUnread ? 'font-semibold' : ''}`}>{displayName}</p>
                      {lastMsg && <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                    {lastMsg && (
                      <p className={`text-sm truncate mt-0.5 ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {lastMsg.senderId === userId ? 'You: ' : ''}{lastMsg.content}
                      </p>
                    )}
                  </div>
                  {hasUnread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
