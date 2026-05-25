'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, Users, Search, Plus, X } from 'lucide-react'

interface Conversation {
  id: string
  type: string
  name: string | null
  lastMessageAt: string | null
  participants: { userId: string; lastReadAt: string | null }[]
  messages: { content: string; createdAt: string; senderId: string }[]
}

interface UserResult {
  id: string
  firstName: string
  lastName: string
  role: string
}

export default function StudentMessagesPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [userMap, setUserMap] = useState<Record<string, { firstName: string; lastName: string }>>({})
  const [search, setSearch] = useState('')
  const [showNewDM, setShowNewDM] = useState(false)
  const [dmSearch, setDmSearch] = useState('')
  const [dmResults, setDmResults] = useState<UserResult[]>([])
  const [dmLoading, setDmLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  // Load session + conversations
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(s => setCurrentUserId(s?.user?.id ?? null))
    fetch('/api/chat/conversations').then(r => r.json()).then(async (convs: Conversation[]) => {
      setConversations(convs)
      const ids = [...new Set(convs.flatMap(c => c.participants.map(p => p.userId)))]
      if (ids.length === 0) return
      const params = new URLSearchParams()
      ids.forEach(id => params.append('ids', id))
      const res = await fetch(`/api/users/batch?${params}`)
      if (res.ok) setUserMap(await res.json())
    })
  }, [])

  // Search teachers/staff for new DM
  useEffect(() => {
    if (!dmSearch.trim()) { setDmResults([]); return }
    setDmLoading(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(dmSearch)}&roles=TEACHER,STAFF,HR_ADMIN,FINANCE_ADMIN,REGISTRAR,TENANT_ADMIN`)
      if (res.ok) setDmResults(await res.json())
      setDmLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [dmSearch])

  const startDM = useCallback(async (targetUserId: string) => {
    setCreating(true)
    const res = await fetch('/api/chat/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    })
    const conv = await res.json()
    setCreating(false)
    setShowNewDM(false)
    router.push(`/student/messages/${conv.id}`)
  }, [router])

  const filtered = conversations.filter(conv => {
    if (!search.trim()) return true
    const otherIds = conv.participants.filter(p => p.userId !== currentUserId).map(p => p.userId)
    const names = otherIds.map(id => {
      const u = userMap[id]
      return u ? `${u.firstName} ${u.lastName}`.toLowerCase() : ''
    })
    const convName = (conv.name ?? '').toLowerCase()
    const lastMsg = (conv.messages[0]?.content ?? '').toLowerCase()
    const q = search.toLowerCase()
    return names.some(n => n.includes(q)) || convName.includes(q) || lastMsg.includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500">Your conversations and group chats</p>
        </div>
        <button
          onClick={() => setShowNewDM(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Conversation list */}
      <div className="bg-white rounded-2xl border border-gray-200">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{search ? 'No results' : 'No conversations yet'}</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search' : 'Click "New Message" to start a conversation'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((conv) => {
              const otherParticipants = conv.participants.filter(p => p.userId !== currentUserId)
              const lastMsg = conv.messages[0]
              const myParticipant = conv.participants.find(p => p.userId === currentUserId)
              const hasUnread = lastMsg && myParticipant?.lastReadAt
                ? new Date(lastMsg.createdAt) > new Date(myParticipant.lastReadAt) && lastMsg.senderId !== currentUserId
                : !!lastMsg && lastMsg.senderId !== currentUserId

              const displayName = conv.type === 'DIRECT'
                ? (() => { const u = userMap[otherParticipants[0]?.userId]; return u ? `${u.firstName} ${u.lastName}` : 'Unknown' })()
                : conv.name ?? 'Group Chat'

              return (
                <Link key={conv.id} href={`/student/messages/${conv.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                    {conv.type === 'GROUP'
                      ? <Users className="w-5 h-5 text-blue-600" />
                      : <span className="text-sm font-medium text-blue-700">{displayName[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-gray-900 truncate ${hasUnread ? 'font-semibold' : ''}`}>{displayName}</p>
                      {lastMsg && <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                    {lastMsg && (
                      <p className={`text-sm truncate mt-0.5 ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {lastMsg.senderId === currentUserId ? 'You: ' : ''}{lastMsg.content}
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

      {/* New DM modal */}
      {showNewDM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">New Message</h2>
              <button onClick={() => setShowNewDM(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  value={dmSearch}
                  onChange={e => setDmSearch(e.target.value)}
                  placeholder="Search teachers or staff…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
                {dmLoading && <p className="text-center text-sm text-gray-400 py-4">Searching…</p>}
                {!dmLoading && dmSearch && dmResults.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">No results</p>
                )}
                {!dmLoading && !dmSearch && (
                  <p className="text-center text-sm text-gray-400 py-4">Type a name to search</p>
                )}
                {dmResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startDM(u.id)}
                    disabled={creating}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700 flex-shrink-0">
                      {u.firstName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-400 capitalize">{u.role.replace(/_/g, ' ').toLowerCase()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
