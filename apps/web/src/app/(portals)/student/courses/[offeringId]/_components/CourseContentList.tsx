'use client'

import { useState } from 'react'
import { ExternalLink, CheckCircle2, Circle } from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  description: string | null
  type: string
  url: string
}

interface Props {
  contents: ContentItem[]
  completedIds: Set<string>
  offeringId: string
}

const contentTypeColor: Record<string, string> = {
  PDF: 'bg-blue-50 text-blue-600',
  VIDEO: 'bg-blue-100 text-blue-700',
  LINK: 'bg-blue-50 text-blue-600',
  DOCUMENT: 'bg-gray-100 text-gray-600',
  IMAGE: 'bg-blue-50 text-blue-600',
  AUDIO: 'bg-gray-100 text-gray-600',
}

export default function CourseContentList({ contents, completedIds: initial }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(initial))

  async function markViewed(contentId: string) {
    if (completed.has(contentId)) return
    setCompleted(prev => new Set([...prev, contentId]))
    await fetch(`/api/lms/content/${contentId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: true }),
    })
  }

  const pct = contents.length > 0 ? Math.round((completed.size / contents.length) * 100) : 0

  return (
    <div>
      {/* Progress bar */}
      {contents.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {completed.size}/{contents.length} viewed
          </span>
        </div>
      )}

      {contents.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No materials uploaded yet.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {contents.map((c) => (
            <a
              key={c.id}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => markViewed(c.id)}
              className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${contentTypeColor[c.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {c.type}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{c.title}</p>
                  {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {completed.has(c.id)
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <Circle className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />}
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
