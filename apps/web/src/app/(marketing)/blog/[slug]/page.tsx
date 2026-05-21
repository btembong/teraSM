import Link from 'next/link'
import { ArrowLeft, Clock, User, Calendar, ArrowRight } from 'lucide-react'
import { ShareButton } from './share-button'

// ─── Post metadata registry ───────────────────────────────────────────────────

const POSTS: Record<string, {
  slug: string
  category: string
  categoryColor: string
  title: string
  excerpt: string
  author: string
  authorRole: string
  authorInitial: string
  readTime: string
  date: string
  content: string[]
}> = {
  'how-greenfield-increased-fee-collection-by-40-percent': {
    slug: 'how-greenfield-increased-fee-collection-by-40-percent',
    category: 'Case Studies',
    categoryColor: 'bg-purple-100 text-purple-700',
    title: 'How Greenfield Academy increased fee collection by 40% in one term',
    excerpt: "After switching from manual invoicing to Tera SM's automated fee engine with MoMo integration, Greenfield Academy in Cameroon collected 94% of fees by week 6.",
    author: 'Dr. Funmilayo Adeyemi',
    authorRole: 'Head of Education, Tera SM',
    authorInitial: 'F',
    readTime: '8 min read',
    date: 'May 8, 2026',
    content: [
      "Greenfield Academy, a bilingual secondary school in Bafoussam, Cameroon, had a persistent problem: by week 8 of every semester, only 60–70% of students had cleared their fees. The rest were either on informal payment arrangements, or simply behind without any system to track it.",
      "The bursar, Mr. Celestin Nkemdirim, was spending 3–4 hours every day manually updating a shared Excel file, sending individual WhatsApp messages to parents, and reconciling bank transfer references by hand. 'We were running a school, but also a manual debt-collection operation,' he told us.",
      "## The switch to Tera SM",
      "Greenfield onboarded onto Tera SM in January 2026 — just before Semester 1 started. The setup took two days: importing the student list, configuring their fee structures (tuition, boarding, and exam fees per class), and connecting their Paystack account for card and bank transfers. They also activated MTN Mobile Money, which most parents in Bafoussam prefer.",
      "On day one of the semester, the system automatically generated invoices for all 820 enrolled students and sent each parent an SMS with a payment link. No manual work.",
      "## Results: week by week",
      "By week 2, 48% of students had paid — compared to 31% at the same point the previous semester. The spike was immediate: parents responded to the automated SMS reminder in ways they never had to WhatsApp messages from the bursar.",
      "By week 4, collection had reached 72%. By week 6, it was 94%. The final collection rate for Semester 1 2026 was 97% — the highest in Greenfield's 14-year history.",
      "The automated reminders (7-day, 3-day, and 1-day before due date) handled the follow-up entirely. The bursar now spends less than 30 minutes a week on fee-related tasks — most of it reviewing the dashboard.",
      "## What made the difference",
      "Three things drove the improvement: **automated invoicing** (no more manual billing), **MTN Mobile Money** (parents could pay from their phones without visiting a bank), and **real-time visibility** for both staff and parents — parents could see exactly what was owed and pay in seconds from the parent portal.",
      "'The parents trust the system,' Mr. Nkemdirim said. 'They see the invoice, they see their child's name, they click pay. There's no confusion about which account to send to or what the reference number is.'",
      "## For the finance team",
      "On the admin side, the finance dashboard now shows live collection rates by class and fee type. The school can see exactly which students are outstanding, generate reminder reports, and process refunds through the platform without back-and-forth bank visits.",
      "The scholarship module automatically deducted financial aid from student invoices before they were generated — eliminating a major source of billing disputes.",
      "## Next steps",
      "Greenfield is now rolling out the LMS and live classes module for Semester 2. They also plan to enable the parent portal for all families, allowing parents to view results and attendance alongside fees — all in one place.",
    ],
  },
  'ai-early-warning-dropout': {
    slug: 'ai-early-warning-dropout',
    category: 'Product',
    categoryColor: 'bg-blue-100 text-blue-700',
    title: 'Introducing AI early warning: catch at-risk students before they drop out',
    excerpt: 'Our new AI model flags students who show patterns correlated with dropout — poor attendance, missed assignments, unpaid fees — so advisors can intervene early.',
    author: 'Amina Diallo',
    authorRole: 'CTO & Co-founder, Tera SM',
    authorInitial: 'A',
    readTime: '4 min read',
    date: 'April 20, 2026',
    content: [
      "Dropout is one of the most costly problems in African higher education. A student who drops out in year 2 has already consumed scholarships, housing, and staff time — and gained nothing they can use. Institutions that identify at-risk students early can intervene, adjust, and retain them.",
      "The problem is that 'at-risk' is invisible until it's obvious. By the time a student stops showing up, the decision is usually already made.",
      "## What the data tells us",
      "After analyzing anonymized data from 50+ institutions on the Tera SM platform, our data team identified five signals that, in combination, predict dropout with high accuracy — often 6–8 weeks before a student disengages:",
      "**1. Attendance rate below 60%** across two or more courses in the same semester.",
      "**2. Missed assignment rate above 40%** — not late, but not submitted at all.",
      "**3. Unpaid fees beyond 30 days** past the due date — financial stress is a leading dropout predictor.",
      "**4. No LMS login in 14+ days** — students who stop accessing course materials are mentally checked out before they officially withdraw.",
      "**5. Declining grade trend** — a drop of more than 15 points between the first CA and the second is a strong signal.",
      "## How the early warning system works",
      "Every night, Tera SM runs a scoring model against every active student's data. Students who trigger three or more of the above signals are flagged on the admin dashboard with a risk level: Moderate, High, or Critical.",
      "The flag appears in the admin AI dashboard with a summary: which signals were triggered, for how long, and a recommended action (outreach call, fee counseling, academic advising session).",
      "Advisors can log their intervention directly in the platform — so the cycle closes: flag → intervention → outcome tracked.",
      "## Early results",
      "In the three institutions that piloted the early warning system in Semester 1 2026, average semester-on-semester dropout rates dropped by 28%. One university credited the system with retaining 34 students who had previously been invisible to their advising team.",
      "The feature is now live for all Enterprise and University plan subscribers. Admins can access it at Admin → AI & Intelligence → Early Warning.",
    ],
  },
  'mobile-money-school-fees': {
    slug: 'mobile-money-school-fees',
    category: 'Education',
    categoryColor: 'bg-green-100 text-green-700',
    title: 'Why mobile money is the future of school fee collection in Sub-Saharan Africa',
    excerpt: "With bank account penetration under 45% in many African markets, MoMo wallets are often the only payment rail parents trust.",
    author: 'Jean-Baptiste Ngom',
    authorRole: 'Head of Growth, Tera SM',
    authorInitial: 'J',
    readTime: '5 min read',
    date: 'April 28, 2026',
    content: [
      "Ask a school bursar in Yaoundé, Kumasi, or Kigali how parents prefer to pay school fees, and you'll hear the same answer: mobile money. MTN MoMo, Orange Money, M-Pesa — these wallets are how everyday financial life moves in Sub-Saharan Africa.",
      "Yet most school management systems are built around bank transfers and card payments — the rails that work in Europe and North America. The result: schools with payment links that parents simply don't use, and bursars who still spend their Mondays collecting cash at the gate.",
      "## The numbers",
      "According to the GSMA Mobile Economy 2025 report, mobile money accounts outnumber bank accounts in 25 African markets. In Cameroon, Ghana, and Uganda, MoMo transaction volumes exceed formal banking channels for payments under $500.",
      "When we surveyed parents at 30 Tera SM partner institutions, 71% said they preferred to pay school fees via mobile money — citing ease, speed, and not needing to visit a branch. Among parents with children in boarding schools, where fee amounts are higher, the preference was still 58%.",
      "## What happens when you add MoMo",
      "We measured fee collection rates before and after schools activated mobile money on Tera SM. The average lift was 23 percentage points in the first semester. At Greenfield Academy in Cameroon, collection went from 67% to 94%. At Kabaka Secondary in Uganda, from 55% to 87%.",
      "The mechanism is simple: friction reduction. When a parent receives an SMS with a payment link that opens a familiar MoMo prompt, the barrier to paying is almost zero. There's no account number to copy, no reference code to remember, no branch to visit.",
      "## What schools need to know",
      "Activating mobile money through Tera SM requires a Paystack or Flutterwave account, both of which support MoMo in their respective markets. Setup takes under an hour. Funds are settled T+1 directly to the school's bank account.",
      "For schools with high MoMo adoption, we recommend enabling payment reminders via SMS (not just email) — parents respond significantly better to SMS-triggered payment flows than to email invoices.",
    ],
  },
}

// ─── Related posts ────────────────────────────────────────────────────────────

const ALL_POSTS = [
  { slug: 'qr-attendance-vs-manual',                   category: 'Guides',       title: 'QR code attendance vs manual registers: what actually works',                     date: 'May 5, 2026',    readTime: '6 min' },
  { slug: 'ai-early-warning-dropout',                  category: 'Product',      title: 'Introducing AI early warning: catch at-risk students before they drop out',       date: 'April 20, 2026', readTime: '4 min' },
  { slug: 'transcript-authentication-qr',              category: 'Product',      title: 'Solving transcript fraud with QR-authenticated documents',                        date: 'April 12, 2026', readTime: '5 min' },
  { slug: 'mobile-money-school-fees',                  category: 'Education',    title: 'Why mobile money is the future of school fee collection',                         date: 'April 28, 2026', readTime: '5 min' },
  { slug: 'school-management-nigeria-2026',            category: 'Guides',       title: 'Best school management software in Nigeria (2026 comparison)',                    date: 'April 6, 2026',  readTime: '10 min'},
  { slug: 'livekit-live-classes-africa',               category: 'Product',      title: 'How we built lag-free live classes for low-bandwidth African networks',            date: 'March 29, 2026', readTime: '7 min' },
  { slug: 'how-greenfield-increased-fee-collection-by-40-percent', category: 'Case Studies', title: 'How Greenfield Academy increased fee collection by 40% in one term', date: 'May 8, 2026', readTime: '8 min' },
  { slug: 'francophone-africa-expansion',              category: 'Product',      title: 'Tera SM goes Francophone: full French support now live',                          date: 'March 10, 2026', readTime: '3 min' },
]

const categoryColor: Record<string, string> = {
  'Product':      'bg-blue-100 text-blue-700',
  'Education':    'bg-green-100 text-green-700',
  'Case Studies': 'bg-purple-100 text-purple-700',
  'Guides':       'bg-orange-100 text-orange-700',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug]
  const related = ALL_POSTS.filter(p => p.slug !== params.slug).slice(0, 3)

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-6xl font-black text-gray-200 mb-4">404</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h1>
          <p className="text-gray-500 mb-6">This article doesn't exist or has been moved.</p>
          <Link href="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Top breadcrumb */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Blog
          </Link>
          <ShareButton />
        </div>
      </div>

      {/* Article header */}
      <header className="max-w-3xl mx-auto px-6 pt-14 pb-10">
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5 ${post.categoryColor}`}>
          {post.category}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed mb-8">{post.excerpt}</p>

        {/* Author + meta */}
        <div className="flex items-center gap-4 pb-8 border-b border-gray-100">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0">
            {post.authorInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{post.author}</p>
            <p className="text-xs text-gray-400">{post.authorRole}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
          </div>
        </div>
      </header>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-6 pb-16">
        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-5">
          {post.content.map((block, i) => {
            if (block.startsWith('## ')) {
              return (
                <h2 key={i} className="text-2xl font-bold text-gray-900 mt-10 mb-4 first:mt-0">
                  {block.replace('## ', '')}
                </h2>
              )
            }
            // Render **bold** inline
            const parts = block.split(/(\*\*[^*]+\*\*)/)
            return (
              <p key={i} className="text-base text-gray-700 leading-relaxed">
                {parts.map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
                    : part
                )}
              </p>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">Want results like these?</h3>
          <p className="text-blue-100 mb-6 text-sm">Start a free 14-day trial — no credit card required. Our team will help you go live in the first week.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register" className="px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors">
              Book a demo
            </Link>
          </div>
        </div>
      </article>

      {/* Author bio */}
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
            {post.authorInitial}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 text-sm">{post.author}</p>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{post.authorRole}</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Writing about education technology, African EdTech markets, and how schools can use better tools to serve students.
            </p>
          </div>
        </div>
      </div>

      {/* Related posts */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">More from the blog</h2>
            <Link href="/blog" className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {related.map(r => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${categoryColor[r.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {r.category}
                </span>
                <h3 className="font-semibold text-gray-900 mb-3 leading-snug text-sm group-hover:text-blue-600 transition-colors line-clamp-3">
                  {r.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
                  <User className="w-3 h-3" />
                  <span>{r.date}</span>
                  <span>·</span>
                  <span>{r.readTime} read</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
