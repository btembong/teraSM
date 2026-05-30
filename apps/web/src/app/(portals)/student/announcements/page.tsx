'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Pin, Newspaper, GraduationCap, Video, X, ExternalLink } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { AnnouncementsReadMarker } from '@/components/announcements-read-marker'

interface Announcement {
  id: string
  type: 'ANNOUNCEMENT' | 'NEWS' | 'DEANS_MESSAGE'
  title: string
  body: string
  imageUrl: string | null
  videoUrl: string | null
  audience: string
  isPinned: boolean
  publishedAt: string | null
  createdAt: string
  author?: { firstName: string; lastName: string } | null
}

interface Campaign {
  id: string
  type: 'BANNER' | 'POPUP'
  title: string
  body: string | null
  imageUrl: string | null
  ctaText: string | null
  ctaUrl: string | null
}

type Tab = 'all' | 'news' | 'deans'

const tabItems: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'all',   label: 'Announcements', icon: Megaphone },
  { id: 'news',  label: 'News',          icon: Newspaper },
  { id: 'deans', label: "Dean's Messages", icon: GraduationCap },
]

function fmt(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function StudentAnnouncementsPage() {
  const [tab, setTab]               = useState<Tab>('all')
  const [items, setItems]           = useState<Announcement[]>([])
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/announcements?audience=STUDENTS').then(r => r.json()),
      fetch('/api/student/campaigns').then(r => r.json()),
    ]).then(([ann, camp]) => {
      setItems(Array.isArray(ann)  ? ann  : [])
      setCampaigns(Array.isArray(camp) ? camp : [])
      setLoading(false)
    })
  }, [])

  const dismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
    fetch(`/api/student/campaigns/${id}/dismiss`, { method: 'POST' }).catch(() => {})
  }

  const filtered = items.filter(a => {
    if (tab === 'news')  return a.type === 'NEWS'
    if (tab === 'deans') return a.type === 'DEANS_MESSAGE'
    return a.type === 'ANNOUNCEMENT'
  })

  const banners = campaigns.filter(c => c.type === 'BANNER'  && !dismissed.has(c.id))
  const popups  = campaigns.filter(c => c.type === 'POPUP'   && !dismissed.has(c.id))
  const activePopup = popups[0] ?? null

  return (
    <div className="space-y-5">
      {/* Mark all loaded announcements as read */}
      <AnnouncementsReadMarker ids={items.map(a => a.id)} />

      {/* Active popup */}
      {activePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => dismiss(activePopup.id)} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-400" />
            </button>
            {activePopup.imageUrl && (
              <img src={activePopup.imageUrl} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
            )}
            <h3 className="font-bold text-gray-900 text-lg mb-2">{activePopup.title}</h3>
            {activePopup.body && <p className="text-gray-600 text-sm mb-4">{activePopup.body}</p>}
            <div className="flex gap-3">
              {activePopup.ctaText && activePopup.ctaUrl && (
                <a href={activePopup.ctaUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  {activePopup.ctaText}
                </a>
              )}
              <button onClick={() => dismiss(activePopup.id)}
                className="flex-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-medium transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner campaigns */}
      {banners.map(b => (
        <div key={b.id} className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-5 py-4 flex items-center gap-4 text-white">
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{b.title}</p>
            {b.body && <p className="text-indigo-100 text-sm mt-0.5">{b.body}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {b.ctaText && b.ctaUrl && (
              <a href={b.ctaUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                {b.ctaText} <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button onClick={() => dismiss(b.id)} className="p-1.5 hover:bg-white/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">News & Announcements</h1>
        <p className="text-gray-500 text-sm mt-0.5">Stay up to date with school news and updates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 rounded-2xl p-1.5">
        {tabItems.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
              tab === t.id ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={tab === 'news' ? Newspaper : tab === 'deans' ? GraduationCap : Megaphone}
          title={`No ${tab === 'news' ? 'news posts' : tab === 'deans' ? "Dean's messages" : 'announcements'} yet`}
          description="Check back soon for updates from your school."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(a => {
            const isExpanded = expanded === a.id
            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border p-6 transition-all ${a.isPinned ? 'border-indigo-200 shadow-sm' : 'border-gray-200'}`}
              >
                {/* News cover image */}
                {a.type === 'NEWS' && a.imageUrl && (
                  <img src={a.imageUrl} alt="" className="w-full h-48 object-cover rounded-xl mb-4" />
                )}

                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    a.type === 'NEWS' ? 'bg-blue-50' :
                    a.type === 'DEANS_MESSAGE' ? 'bg-violet-50' : 'bg-indigo-50'
                  }`}>
                    {a.isPinned
                      ? <Pin className="w-5 h-5 text-indigo-500" />
                      : a.type === 'NEWS'
                      ? <Newspaper className="w-5 h-5 text-blue-600" />
                      : a.type === 'DEANS_MESSAGE'
                      ? <GraduationCap className="w-5 h-5 text-violet-600" />
                      : <Megaphone className="w-5 h-5 text-indigo-600" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 mb-1">{a.title}</h2>

                    {/* Dean's message video embed */}
                    {a.type === 'DEANS_MESSAGE' && a.videoUrl && isExpanded && (
                      <div className="mb-3 rounded-xl overflow-hidden aspect-video">
                        <iframe
                          src={a.videoUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                    {a.type === 'DEANS_MESSAGE' && a.videoUrl && !isExpanded && (
                      <div
                        className="mb-2 flex items-center gap-2 text-sm text-violet-600 cursor-pointer hover:text-violet-700"
                        onClick={() => setExpanded(a.id)}
                      >
                        <Video className="w-4 h-4" /> Click to watch video message
                      </div>
                    )}

                    <p className={`text-gray-700 text-sm leading-relaxed whitespace-pre-wrap ${!isExpanded && a.body.length > 300 ? 'line-clamp-3' : ''}`}>
                      {a.body}
                    </p>
                    {a.body.length > 300 && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : a.id)}
                        className="text-indigo-600 text-xs mt-1 hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 flex-wrap">
                      {a.author && <span>By {a.author.firstName} {a.author.lastName}</span>}
                      <span>·</span>
                      <span>{fmt(a.publishedAt ?? a.createdAt)}</span>
                      {a.isPinned && (
                        <span className="text-indigo-500 flex items-center gap-0.5">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
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
