'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, PaperclipIcon, X, FileText, Image, Search } from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  fileUrl?: string | null
  fileName?: string | null
  fileType?: string | null
  sender?: { id: string; firstName: string; lastName: string; avatarUrl: string | null }
}

interface TypingUser { userId: string; name: string }

function FilePreview({ url, name, type }: { url: string; name: string; type: string }) {
  if (type.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img src={url} alt={name} className="max-w-[200px] rounded-lg border border-white/20" />
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 mt-1 px-3 py-2 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors">
      <FileText className="w-4 h-4 flex-shrink-0" />
      <span className="truncate max-w-[160px]">{name}</span>
    </a>
  )
}

function TypingBubble({ users }: { users: TypingUser[] }) {
  if (users.length === 0) return null
  const label = users.length === 1
    ? `${users[0].name} is typing…`
    : `${users.map(u => u.name).join(', ')} are typing…`
  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

export default function StudentConversationPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [messages,      setMessages]      = useState<Message[]>([])
  const [content,       setContent]       = useState('')
  const [sending,       setSending]       = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [pendingFile,   setPendingFile]   = useState<File | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [typing,        setTyping]        = useState<TypingUser[]>([])
  const [convName,      setConvName]      = useState('')
  const [searching,     setSearching]     = useState(false)
  const [searchQ,       setSearchQ]       = useState('')
  const [searchResults, setSearchResults] = useState<Message[]>([])

  const bottomRef     = useRef<HTMLDivElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastMsgTime   = useRef<string>(new Date(0).toISOString())
  const didMark       = useRef(false)

  // Load session + initial messages + mark as read
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(s => setCurrentUserId(s?.user?.id ?? null))

    fetch(`/api/chat/conversations/${id}/messages`)
      .then(r => r.json())
      .then((msgs: Message[]) => {
        setMessages(msgs)
        if (msgs.length > 0) lastMsgTime.current = msgs[msgs.length - 1].createdAt
      })

    // Get conversation name
    fetch('/api/chat/conversations')
      .then(r => r.json())
      .then((convs: any[]) => {
        const conv = convs.find((c: any) => c.id === id)
        if (conv) setConvName(conv.name ?? '')
      })
  }, [id])

  // Mark as read once on mount
  useEffect(() => {
    if (didMark.current) return
    didMark.current = true
    fetch(`/api/chat/conversations/${id}/read`, { method: 'POST' }).catch(() => {})
  }, [id])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Short-poll for new messages every 2.5s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/conversations/${id}/poll?after=${encodeURIComponent(lastMsgTime.current)}`)
        if (res.ok) {
          const newMsgs: Message[] = await res.json()
          if (newMsgs.length > 0) {
            setMessages(prev => {
              const ids = new Set(prev.map(m => m.id))
              const fresh = newMsgs.filter(m => !ids.has(m.id))
              if (fresh.length === 0) return prev
              lastMsgTime.current = fresh[fresh.length - 1].createdAt
              // Mark as read for new incoming messages
              fetch(`/api/chat/conversations/${id}/read`, { method: 'POST' }).catch(() => {})
              return [...prev, ...fresh]
            })
          }
        }
      } catch { /* ignore */ }
      pollRef.current = setTimeout(poll, 2500)
    }
    pollRef.current = setTimeout(poll, 2500)
    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
  }, [id])

  // Poll typing indicators every 1.5s
  useEffect(() => {
    let mounted = true
    const pollTyping = async () => {
      try {
        const res = await fetch(`/api/chat/conversations/${id}/typing`)
        if (res.ok && mounted) setTyping((await res.json()).typing ?? [])
      } catch { /* ignore */ }
      if (mounted) setTimeout(pollTyping, 1500)
    }
    pollTyping()
    return () => { mounted = false }
  }, [id])

  // Typing indicator emit
  const emitTyping = useCallback(() => {
    fetch(`/api/chat/conversations/${id}/typing`, { method: 'POST' }).catch(() => {})
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      fetch(`/api/chat/conversations/${id}/typing`, { method: 'DELETE' }).catch(() => {})
    }, 3000)
  }, [id])

  const send = useCallback(async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!content.trim() && !pendingFile) return
    setSending(true)

    // Clear typing
    fetch(`/api/chat/conversations/${id}/typing`, { method: 'DELETE' }).catch(() => {})
    if (typingTimeout.current) clearTimeout(typingTimeout.current)

    let fileUrl: string | null = null
    let fileName: string | null = null
    let fileType: string | null = null

    if (pendingFile) {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', pendingFile)
      const upRes = await fetch('/api/chat/upload', { method: 'POST', body: fd })
      if (upRes.ok) {
        const data = await upRes.json()
        fileUrl = data.url; fileName = data.name; fileType = data.type
      }
      setUploading(false)
      setPendingFile(null)
    }

    const res = await fetch(`/api/chat/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() || (fileName ?? ''), fileUrl, fileName, fileType }),
    })
    const msg = await res.json()
    setMessages(prev => {
      const ids = new Set(prev.map(m => m.id))
      if (ids.has(msg.id)) return prev
      lastMsgTime.current = msg.createdAt
      return [...prev, msg]
    })
    setContent('')
    setSending(false)
  }, [content, pendingFile, id])

  // Message search
  useEffect(() => {
    if (!searching || !searchQ.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/chat/search?q=${encodeURIComponent(searchQ)}&conversationId=${id}`)
      if (res.ok) setSearchResults(await res.json())
    }, 300)
    return () => clearTimeout(t)
  }, [searchQ, id, searching])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setPendingFile(f)
    e.target.value = ''
  }

  const displayMessages = searching && searchQ ? searchResults : messages

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <p className="font-semibold text-gray-900 flex-1 truncate">{convName || 'Conversation'}</p>
        <button
          onClick={() => { setSearching(v => !v); setSearchQ(''); setSearchResults([]) }}
          className={`p-1.5 rounded-lg transition-colors ${searching ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Search bar */}
      {searching && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <input
            autoFocus
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search messages…"
            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQ && (
            <p className="text-xs text-gray-400 mt-1">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {displayMessages.map((msg) => {
          const isMe = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0 mt-1">
                  {msg.sender?.firstName?.[0] ?? '?'}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMe && <p className="text-xs text-gray-500 mb-1">{msg.sender?.firstName} {msg.sender?.lastName}</p>}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'}`}>
                  {msg.content && msg.content !== msg.fileName && <p>{msg.content}</p>}
                  {msg.fileUrl && msg.fileName && msg.fileType && (
                    <FilePreview url={msg.fileUrl} name={msg.fileName} type={msg.fileType} />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {!searching && <TypingBubble users={typing} />}
        <div ref={bottomRef} />
      </div>

      {/* File pending preview */}
      {pendingFile && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-3 flex-shrink-0">
          {pendingFile.type.startsWith('image/') ? <Image className="w-4 h-4 text-blue-600" /> : <FileText className="w-4 h-4 text-blue-600" />}
          <span className="text-sm text-blue-700 truncate flex-1">{pendingFile.name}</span>
          <button onClick={() => setPendingFile(null)} className="p-1 hover:bg-blue-100 rounded-lg">
            <X className="w-4 h-4 text-blue-500" />
          </button>
        </div>
      )}

      {/* Input */}
      {!searching && (
        <form onSubmit={send} className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
          <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt" />
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
            <PaperclipIcon className="w-4 h-4 text-gray-500" />
          </button>
          <input
            value={content}
            onChange={(e) => { setContent(e.target.value); if (e.target.value) emitTyping() }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e) } }}
            placeholder={pendingFile ? 'Add a caption…' : 'Type a message…'}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || uploading || (!content.trim() && !pendingFile)}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}
