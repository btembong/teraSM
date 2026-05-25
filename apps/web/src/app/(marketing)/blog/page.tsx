'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Search, X, Sparkles, Mail } from 'lucide-react'

const CATEGORIES = ['All', 'Product', 'Education', 'Case Studies', 'Guides']

const TODAY = new Date('2026-05-25')
function isNew(dateStr: string) {
  const d = new Date(dateStr)
  return (TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 30
}

const featured = {
  slug: 'how-greenfield-increased-fee-collection-by-40-percent',
  category: 'Case Studies',
  title: 'How Greenfield Academy increased fee collection by 40% in one term',
  excerpt: "After switching from manual invoicing to Tera SM's automated fee engine with MoMo integration, Greenfield Academy in Cameroon collected 94% of fees by week 6 — up from 67% the previous term.",
  author: 'Dr. Funmilayo Adeyemi',
  initials: 'FA',
  readTime: '8 min read',
  date: 'May 8, 2026',
}

const posts = [
  {
    slug: 'qr-attendance-vs-manual',
    category: 'Guides',
    title: 'QR code attendance vs manual registers: what actually works in African schools',
    excerpt: "We analysed attendance data from 50+ institutions to understand where QR check-in outperforms paper registers — and where it doesn't.",
    author: 'Chidera Okafor',
    initials: 'CO',
    readTime: '6 min read',
    date: 'May 5, 2026',
  },
  {
    slug: 'mobile-money-school-fees',
    category: 'Education',
    title: 'Why mobile money is the future of school fee collection in Sub-Saharan Africa',
    excerpt: "With bank account penetration under 45% in many African markets, MoMo wallets are often the only payment rail parents trust.",
    author: 'Jean-Baptiste Ngom',
    initials: 'JN',
    readTime: '5 min read',
    date: 'April 28, 2026',
  },
  {
    slug: 'ai-early-warning-dropout',
    category: 'Product',
    title: 'Introducing AI early warning: catch at-risk students before they drop out',
    excerpt: 'Our new AI model flags students who show patterns correlated with dropout — poor attendance, missed assignments, unpaid fees — so advisors can intervene early.',
    author: 'Amina Diallo',
    initials: 'AD',
    readTime: '4 min read',
    date: 'April 20, 2026',
  },
  {
    slug: 'transcript-authentication-qr',
    category: 'Product',
    title: 'Solving transcript fraud with QR-authenticated documents',
    excerpt: 'Fake transcripts cost African graduates job opportunities every year. We built a scannable authentication layer into every Tera SM-generated document.',
    author: 'Chidera Okafor',
    initials: 'CO',
    readTime: '5 min read',
    date: 'April 12, 2026',
  },
  {
    slug: 'school-management-nigeria-2026',
    category: 'Guides',
    title: 'Best school management software in Nigeria (2026 comparison)',
    excerpt: "We compare the top platforms available to Nigerian institutions across features, pricing, and local payment support.",
    author: 'Jean-Baptiste Ngom',
    initials: 'JN',
    readTime: '10 min read',
    date: 'April 6, 2026',
  },
  {
    slug: 'livekit-live-classes-africa',
    category: 'Product',
    title: 'How we built lag-free live classes for low-bandwidth African networks',
    excerpt: "Standard WebRTC struggles on 3G connections. Here's the engineering behind our adaptive bitrate streaming and selective forwarding unit setup.",
    author: 'Amina Diallo',
    initials: 'AD',
    readTime: '7 min read',
    date: 'March 29, 2026',
  },
  {
    slug: 'university-accreditation-reports',
    category: 'Education',
    title: 'Automating accreditation reports: what Nigerian and Ghanaian regulators actually want',
    excerpt: 'NUC, NAB, and WAEC each have their own data formats and metrics. We worked with registrars at 12 universities to build templates that generate compliant reports in minutes.',
    author: 'Dr. Funmilayo Adeyemi',
    initials: 'FA',
    readTime: '6 min read',
    date: 'March 21, 2026',
  },
  {
    slug: 'francophone-africa-expansion',
    category: 'Product',
    title: 'Tera SM goes Francophone: full French support now live',
    excerpt: "Schools in Cameroon, Côte d'Ivoire, Senegal, and Mali can now run the entire platform in French — including PDFs, notifications, and student portals.",
    author: 'Jean-Baptiste Ngom',
    initials: 'JN',
    readTime: '3 min read',
    date: 'March 10, 2026',
  },
]

const categoryBadge: Record<string, string> = {
  'Product':      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  'Education':    'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400',
  'Case Studies': 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400',
  'Guides':       'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
}

const authorColor: Record<string, string> = {
  'FA': 'bg-blue-600',
  'CO': 'bg-indigo-600',
  'JN': 'bg-sky-600',
  'AD': 'bg-violet-600',
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: posts.length }
    for (const cat of CATEGORIES.slice(1)) map[cat] = posts.filter(p => p.category === cat).length
    return map
  }, [])

  const filtered = useMemo(() => {
    let result = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))
    }
    return result
  }, [activeCategory, search])

  const showFeatured = (activeCategory === 'All' || featured.category === activeCategory)
  const featuredMatchesSearch = !search.trim()
    || featured.title.toLowerCase().includes(search.toLowerCase())
    || featured.excerpt.toLowerCase().includes(search.toLowerCase())

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="bg-gray-950 pt-24 pb-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-600/30 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Insights from the front lines of African EdTech
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            The Tera SM Blog
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            School management best practices, product updates, and real case studies from institutions across Africa.
          </p>
        </div>
      </section>

      {/* Sticky filter bar */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 py-3">
            {/* Search */}
            <div className="relative flex-shrink-0 w-44 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {cat}
                  <span className={`text-[10px] font-bold tabular-nums ${activeCategory === cat ? 'opacity-70' : 'opacity-40'}`}>
                    {counts[cat]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured post — visible when category matches */}
      {showFeatured && featuredMatchesSearch && (
        <section className="py-12 bg-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5">Featured</p>
            <Link
              href={`/blog/${featured.slug}`}
              className="group block bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-10 text-white hover:from-blue-500 hover:to-blue-700 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">
                  {featured.category}
                </span>
                {isNew(featured.date) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Sparkles className="w-2.5 h-2.5" /> NEW
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 max-w-2xl leading-snug group-hover:underline underline-offset-2">
                {featured.title}
              </h2>
              <p className="text-blue-100 leading-relaxed max-w-2xl mb-8 text-sm">{featured.excerpt}</p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 text-sm text-blue-200">
                  <div className={`w-7 h-7 rounded-full ${authorColor[featured.initials] ?? 'bg-blue-500'} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {featured.initials}
                  </div>
                  <span>{featured.author}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featured.readTime}</span>
                  <span>·</span>
                  <span>{featured.date}</span>
                </div>
                <span className="flex items-center gap-2 px-5 py-2 bg-white text-blue-700 rounded-xl font-semibold text-sm group-hover:bg-blue-50 transition-all">
                  Read case study <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Post grid */}
      <section className="pb-16 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          {/* Filter state label */}
          {(activeCategory !== 'All' || search) && (
            <div className="flex items-center gap-3 mb-8 pt-4">
              {search ? (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''} for{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">"{search}"</span>
                </span>
              ) : (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {filtered.length} article{filtered.length !== 1 ? 's' : ''} in
                  </span>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${categoryBadge[activeCategory] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    {activeCategory}
                  </span>
                </>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Nothing found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
                {search
                  ? 'Try different keywords or clear your search.'
                  : "We haven't published in this category yet — try All or subscribe below."}
              </p>
              <button
                onClick={() => { setActiveCategory('All'); setSearch('') }}
                className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                View all articles
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((post, idx) => {
                const isWide = idx === 0 && filtered.length > 1
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className={`group flex flex-col border border-gray-100 dark:border-gray-800 rounded-2xl p-6 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md hover:shadow-blue-50 dark:hover:shadow-blue-950/20 dark:hover:bg-gray-900 transition-all hover:-translate-y-0.5 ${isWide ? 'md:col-span-2' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${categoryBadge[post.category] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {post.category}
                      </span>
                      {isNew(post.date) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <Sparkles className="w-2.5 h-2.5" /> NEW
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold text-gray-900 dark:text-white mb-3 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1 ${isWide ? 'text-xl' : 'text-base'}`}>
                      {post.title}
                    </h3>
                    <p className={`text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5 ${isWide ? 'line-clamp-3' : 'line-clamp-2'}`}>
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2.5 text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-50 dark:border-gray-800">
                      <div className={`w-6 h-6 rounded-full ${authorColor[post.initials] ?? 'bg-blue-600'} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                        {post.initials}
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 font-medium truncate">{post.author}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 flex-shrink-0"><Clock className="w-3 h-3" /> {post.readTime}</span>
                      <span>·</span>
                      <span className="flex-shrink-0">{post.date}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Inline newsletter strip */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Stay in the loop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly EdTech insights — no spam, ever.</p>
              </div>
            </div>
            <form className="flex gap-2 w-full sm:w-auto" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@school.edu"
                className="flex-1 sm:w-56 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex-shrink-0">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Newsletter CTA footer */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Never miss an insight</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
            Product updates, EdTech case studies, and school management guides — once a month, no spam.
          </p>
          <form className="flex gap-2.5 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@school.edu"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
          </form>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-3">No spam. Unsubscribe at any time.</p>
        </div>
      </section>

    </div>
  )
}
