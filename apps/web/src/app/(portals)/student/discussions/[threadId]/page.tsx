'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ThumbsUp, CheckCircle, Paperclip, Send, Lock } from 'lucide-react'

interface Author {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  role: string
}

interface Post {
  id: string
  content: string
  authorId: string
  author: Author | null
  isAnonymous: boolean
  isBestAnswer: boolean
  upvoteCount: number
  hasVoted: boolean
  fileUrl: string | null
  fileName: string | null
  fileType: string | null
  parentId: string | null
  createdAt: string
}

interface Thread {
  id: string
  title: string
  isLocked: boolean
  isPinned: boolean
  courseOffering: { course: { title: string } }
}

export default function DiscussionThreadPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const router = useRouter()
  const [thread, setThread] = useState<Thread | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string; type: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/lms/discussions/${threadId}/posts`)
      .then(r => r.json())
      .then(data => {
        setThread(data.thread)
        setPosts(data.posts ?? [])
      })
  }, [threadId])

  async function uploadFile(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/chat/upload', { method: 'POST', body: fd })
    if (!res.ok) return
    const data = await res.json()
    setPendingFile({ url: data.url, name: data.name, type: data.type })
  }

  async function sendPost() {
    if (!content.trim() && !pendingFile) return
    setSubmitting(true)
    const res = await fetch(`/api/lms/discussions/${threadId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        isAnonymous,
        fileUrl: pendingFile?.url ?? null,
        fileName: pendingFile?.name ?? null,
        fileType: pendingFile?.type ?? null,
      }),
    })
    const post = await res.json()
    setPosts(prev => [...prev, { ...post, hasVoted: false }])
    setContent('')
    setPendingFile(null)
    setSubmitting(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function toggleVote(postId: string) {
    const res = await fetch(`/api/lms/discussions/posts/${postId}/vote`, { method: 'POST' })
    const data = await res.json()
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvoteCount: data.upvoteCount, hasVoted: data.hasVoted } : p))
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 truncate">{thread.title}</h1>
            {thread.isPinned && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">Pinned</span>}
            {thread.isLocked && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-gray-400">{thread.courseOffering.course.title}</p>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No replies yet. Be the first to post!
          </div>
        )}
        {posts.map(post => (
          <PostCard key={post.id} post={post} onVote={toggleVote} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {!thread.isLocked && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 sticky bottom-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write a reply…"
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {pendingFile && (
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="truncate">{pendingFile.name}</span>
              <button onClick={() => setPendingFile(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Paperclip className="w-4 h-4 text-gray-500" />
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600"
                />
                <span className="text-xs text-gray-500">Post anonymously</span>
              </label>
            </div>
            <button
              onClick={sendPost}
              disabled={submitting || (!content.trim() && !pendingFile)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Posting…' : 'Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PostCard({ post, onVote }: { post: Post; onVote: (id: string) => void }) {
  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`.trim() || 'Anonymous'
    : 'Anonymous'
  const isImage = post.fileType?.startsWith('image/')

  return (
    <div className={`bg-white rounded-2xl border p-5 space-y-3 ${post.isBestAnswer ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'}`}>
      {post.isBestAnswer && (
        <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
          <CheckCircle className="w-4 h-4" /> Best Answer
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
          {authorName.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="text-sm font-medium text-gray-900">{authorName}</span>
          {post.author?.role && !post.isAnonymous && (
            <span className="ml-2 text-xs text-gray-400">{post.author.role}</span>
          )}
        </div>
        <span className="ml-auto text-xs text-gray-400">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>

      {post.fileUrl && (
        <div className="mt-2">
          {isImage ? (
            <img src={post.fileUrl} alt={post.fileName ?? 'attachment'} className="max-h-64 rounded-xl border border-gray-200 object-contain" />
          ) : (
            <a href={post.fileUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-indigo-600 hover:underline bg-indigo-50 px-3 py-2 rounded-lg">
              <Paperclip className="w-3.5 h-3.5" /> {post.fileName}
            </a>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onVote(post.id)}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${post.hasVoted ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          {post.upvoteCount > 0 ? post.upvoteCount : ''} Helpful
        </button>
      </div>
    </div>
  )
}
