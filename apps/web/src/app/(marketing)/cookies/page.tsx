import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalToc } from '@/components/ui/legal-toc'

const SECTIONS = [
  { id: 'what', title: '1. What Are Cookies?' },
  { id: 'how', title: '2. How We Use Cookies' },
  { id: 'cookies-used', title: '3. Cookies We Use' },
  { id: 'manage', title: '4. Managing Preferences' },
  { id: 'third-party', title: '5. Third-Party Cookies' },
  { id: 'changes', title: '6. Changes' },
  { id: 'contact', title: '7. Contact' },
]

export const metadata: Metadata = {
  title: 'Cookie Policy — Tera SM',
  description: 'How Tera SM uses cookies and similar tracking technologies.',
  alternates: { canonical: 'https://terasms.com/cookies' },
}

const LAST_UPDATED = 'May 25, 2026'

const cookieTable = [
  {
    name: 'next-auth.session-token',
    type: 'Essential',
    purpose: 'Maintains your authenticated session. Without this cookie the platform cannot function.',
    duration: 'Session / 30 days',
  },
  {
    name: 'next-auth.csrf-token',
    type: 'Essential',
    purpose: 'Cross-site request forgery protection token. Prevents unauthorised form submissions.',
    duration: 'Session',
  },
  {
    name: '__Host-next-auth.session-token',
    type: 'Essential',
    purpose: 'Secure variant of the session token used in production HTTPS environments.',
    duration: '30 days',
  },
  {
    name: 'tm_cookie_consent',
    type: 'Essential',
    purpose: 'Stores your cookie consent preferences so we do not ask again on every visit.',
    duration: '1 year',
  },
  {
    name: '_ga, _ga_*',
    type: 'Analytics',
    purpose: 'Google Analytics — measures traffic patterns, page views, and user journeys on the marketing website (not inside the platform).',
    duration: '2 years',
  },
  {
    name: '_hjSession*, _hjid',
    type: 'Analytics',
    purpose: 'Hotjar — records anonymised session heatmaps and scroll maps on the marketing website to help us improve page layouts.',
    duration: '1 year',
  },
  {
    name: 'crisp-client*',
    type: 'Functional',
    purpose: 'Crisp live chat widget — enables the sales and support chat on the marketing website. Stores chat session state.',
    duration: '6 months',
  },
  {
    name: '__stripe_mid, __stripe_sid',
    type: 'Essential (payment)',
    purpose: 'Stripe payment processing cookies used during checkout to prevent fraud.',
    duration: '1 year / Session',
  },
]

export default function CookiesPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span>Cookie Policy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Cookie Policy</h1>
          <p className="text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex gap-12">
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <LegalToc sections={SECTIONS} />
          </aside>
          <div className="flex-1 min-w-0 space-y-12">
        {/* Summary */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 text-sm text-blue-800 dark:text-blue-300">
          <strong>Summary:</strong> We use essential cookies to run the platform and optional analytics cookies on our marketing website. You can manage analytics cookies through the banner on our site. The platform itself uses only session cookies required for login.
        </div>

        {/* What are cookies */}
        <section id="what">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. What Are Cookies?</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Cookies are small text files placed on your device by websites you visit. They allow the website to recognise your device and remember information about your visit (such as your login session or preferences). Similar technologies include local storage, session storage, and pixels.
          </p>
        </section>

        {/* How we use them */}
        <section id="how">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Cookies</h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Essential Cookies</p>
              <p>These are required for the platform to function. They handle authentication, session management, and security. You cannot opt out of these while using the Service.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Analytics Cookies</p>
              <p>We use Google Analytics and Hotjar on our marketing website (terasms.com) — not inside the platform — to understand how visitors interact with our pages. This helps us improve our content and design. These cookies only activate with your consent.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Functional Cookies</p>
              <p>We use Crisp for live chat on our marketing website. This stores your chat session so you can continue a conversation across pages. These are activated when you interact with the chat widget.</p>
            </div>
          </div>
        </section>

        {/* Cookie table */}
        <section id="cookies-used">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Cookies We Use</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Cookie Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Purpose</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {cookieTable.map((c) => (
                  <tr key={c.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        c.type === 'Essential' || c.type === 'Essential (payment)'
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          : c.type === 'Analytics'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs">{c.purpose}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Managing cookies */}
        <section id="manage">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Managing Your Cookie Preferences</h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>
              When you first visit our marketing website, a cookie consent banner will appear. You can accept all cookies or choose to accept only essential cookies. You can change your preferences at any time by clicking the "Cookie Settings" link in the footer.
            </p>
            <p>
              You can also manage cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking essential cookies will prevent the platform from functioning correctly.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {[
                { browser: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                { browser: 'Mozilla Firefox', url: 'https://support.mozilla.org/kb/cookies-information-websites-store' },
                { browser: 'Apple Safari', url: 'https://support.apple.com/guide/safari/sfri11471' },
                { browser: 'Microsoft Edge', url: 'https://support.microsoft.com/topic/delete-cookies-in-microsoft-edge' },
              ].map(b => (
                <a key={b.browser} href={b.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                  {b.browser}
                  <span className="text-gray-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Third party */}
        <section id="third-party">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Third-Party Cookies</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Third-party services we use (Google Analytics, Hotjar, Crisp, Stripe) may set their own cookies. These are governed by those providers' own cookie and privacy policies. We do not control third-party cookies and encourage you to review those policies directly.
          </p>
        </section>

        {/* Changes */}
        <section id="changes">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Changes to This Policy</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            We may update this Cookie Policy to reflect changes in the cookies we use or for legal and regulatory reasons. Changes will be posted on this page with an updated date. Material changes to analytics cookies will trigger a fresh consent prompt.
          </p>
        </section>

        {/* Contact */}
        <section id="contact">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Contact</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Questions about our use of cookies? Contact us at <a href="mailto:privacy@terasms.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@terasms.com</a>.
          </p>
        </section>

        {/* Related links */}
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Related Legal Documents</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Data Processing Agreement', href: '/dpa' },
              { label: 'Acceptable Use Policy', href: '/aup' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
  )
}
