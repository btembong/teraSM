'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  type: 'content' | 'assignment'
  isPublished: boolean
}

export function TogglePublishButton({ id, type, isPublished }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [published, setPublished] = useState(isPublished)

  async function toggle() {
    setLoading(true)
    const url = type === 'content' ? `/api/lms/content/${id}` : `/api/lms/assignments/${id}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !published }),
    })
    setLoading(false)
    if (res.ok) {
      setPublished(p => !p)
      router.refresh()
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={published ? 'Unpublish' : 'Publish'}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
      ) : published ? (
        <Eye className="w-3.5 h-3.5 text-blue-500" />
      ) : (
        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
      )}
      <span className={published ? 'text-blue-600' : 'text-gray-400'}>
        {published ? 'Published' : 'Draft'}
      </span>
    </button>
  )
}
