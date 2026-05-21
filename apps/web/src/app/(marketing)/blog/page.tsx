'use client'

import Link from 'next/link'
import { ArrowRight, Clock, User } from 'lucide-react'

const categories = ['All', 'Product', 'Education', 'Case Studies', 'Guides']

const featured = {
  slug: 'how-greenfield-increased-fee-collection-by-40-percent',
  category: 'Case Studies',
  title: 'How Greenfield Academy increased fee collection by 40% in one term',
  excerpt: "After switching from manual invoicing to Tera SM's automated fee engine with MoMo integration, Greenfield Academy in Cameroon collected 94% of fees by week 6 — up from 67% the previous term.",
  author: 'Dr. Funmilayo Adeyemi',
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
    readTime: '6 min read',
    date: 'May 5, 2026',
  },
  {
    slug: 'mobile-money-school-fees',
    category: 'Education',
    title: 'Why mobile money is the future of school fee collection in Sub-Saharan Africa',
    excerpt: "With bank account penetration under 45% in many African markets, MoMo wallets are often the only payment rail parents trust. Here's how schools can meet them there.",
    author: 'Jean-Baptiste Ngom',
    readTime: '5 min read',
    date: 'April 28, 2026',
  },
  {
    slug: 'ai-early-warning-dropout',
    category: 'Product',
    title: 'Introducing AI early warning: catch at-risk students before they drop out',
    excerpt: 'Our new AI model flags students who show patterns correlated with dropout — poor attendance, missed assignments, unpaid fees — so advisors can intervene early.',
    author: 'Amina Diallo',
    readTime: '4 min read',
    date: 'April 20, 2026',
  },
  {
    slug: 'transcript-authentication-qr',
    category: 'Product',
    title: 'Solving transcript fraud with QR-authenticated documents',
    excerpt: 'Fake transcripts cost African graduates job opportunities every year. We built a scannable authentication layer into every Tera SM-generated document.',
    author: 'Chidera Okafor',
    readTime: '5 min read',
    date: 'April 12, 2026',
  },
  {
    slug: 'school-management-nigeria-2026',
    category: 'Guides',
    title: 'Best school management software in Nigeria (2026 comparison)',
    excerpt: "We compare the top platforms available to Nigerian institutions across features, pricing, and local payment support. Spoiler: most aren't built for Nigeria.",
    author: 'Jean-Baptiste Ngom',
    readTime: '10 min read',
    date: 'April 6, 2026',
  },
  {
    slug: 'livekit-live-classes-africa',
    category: 'Product',
    title: 'How we built lag-free live classes for low-bandwidth African networks',
    excerpt: "Standard WebRTC struggles on 3G connections. Here's the engineering behind our adaptive bitrate streaming and selective forwarding unit setup.",
    author: 'Amina Diallo',
    readTime: '7 min read',
    date: 'March 29, 2026',
  },
  {
    slug: 'university-accreditation-reports',
    category: 'Education',
    title: 'Automating accreditation reports: what Nigerian and Ghanaian regulators actually want',
    excerpt: 'NUC, NAB, and WAEC each have their own data formats and metrics. We worked with registrars at 12 universities to build templates that generate compliant reports in minutes.',
    author: 'Dr. Funmilayo Adeyemi',
    readTime: '6 min read',
    date: 'March 21, 2026',
  },
  {
    slug: 'francophone-africa-expansion',
    category: 'Product',
    title: 'Tera SM goes Francophone: full French support now live',
    excerpt: "Schools in Cameroon, Côte d'Ivoire, Senegal, and Mali can now run the entire platform in French — including PDFs, notifications, and student portals.",
    author: 'Jean-Baptiste Ngom',
    readTime: '3 min read',
    date: 'March 10, 2026',
  },
]

const categoryColor: Record<string, string> = {
  'Product':      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  'Education':    'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  'Case Studies': 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
  'Guides':       'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/30 dark:via-gray-950 dark:to-indigo-950/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Blog</h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed">
            School management insights, product updates, and case studies from the front lines of African EdTech.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-4 no-scrollbar">
            {categories.map((cat, i) => (
              <button
                key={cat}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  i === 0
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured post */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Featured</p>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-white">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 bg-white/20 text-white">
              {featured.category}
            </span>
            <h2 className="text-3xl font-bold mb-4 max-w-2xl leading-snug">{featured.title}</h2>
            <p className="text-blue-100 leading-relaxed max-w-2xl mb-8">{featured.excerpt}</p>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm text-blue-200">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {featured.author}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {featured.readTime}</span>
                <span>{featured.date}</span>
              </div>
              <Link
                href={`/blog/${featured.slug}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all"
              >
                Read case study <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Post grid */}
      <section className="pb-24 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border border-gray-100 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm dark:hover:bg-gray-900 transition-all"
              >
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${categoryColor[post.category] ?? 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  {post.category}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <span>{post.author}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                  <span>·</span>
                  <span>{post.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Stay in the loop</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Product updates, EdTech insights, and school management guides — once a month, no spam.</p>
          <form className="flex gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@school.edu"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
