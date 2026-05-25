import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy — Tera SM',
  description: 'Rules governing acceptable use of the Tera SM platform for all users.',
  alternates: { canonical: 'https://terasms.com/aup' },
}

const LAST_UPDATED = 'May 25, 2026'

const prohibited = [
  {
    category: 'Illegal Activity',
    items: [
      'Using the platform to facilitate any activity that violates applicable laws or regulations',
      'Uploading or distributing content that infringes copyright, trademarks, or other intellectual property rights',
      'Engaging in or facilitating fraud, money laundering, or other financial crimes',
      'Processing, storing, or transmitting payment card data in violation of PCI DSS',
    ],
  },
  {
    category: 'Harmful Content',
    items: [
      'Uploading, sharing, or transmitting content that is obscene, defamatory, or promotes hatred or violence',
      'Child sexual abuse material (CSAM) or any content that sexually exploits minors',
      'Content that threatens, harasses, or bullies any individual',
      'Disinformation or deliberately false content designed to mislead',
    ],
  },
  {
    category: 'Platform Abuse',
    items: [
      'Attempting to gain unauthorised access to any account, system, or data beyond your permitted role',
      'Using automated tools to scrape, crawl, or harvest data without written authorisation',
      'Conducting denial-of-service attacks, sending spam, or engaging in network abuse',
      'Reverse engineering, decompiling, or attempting to extract the platform source code',
      'Introducing malware, viruses, ransomware, or any malicious code',
      'Probing or testing the security of the platform without prior written authorisation',
    ],
  },
  {
    category: 'Account Misuse',
    items: [
      'Creating multiple accounts to circumvent suspension or usage limits',
      'Sharing your login credentials with any other person',
      'Impersonating any person, school, or organisation',
      'Using another person\'s credentials without their consent',
    ],
  },
  {
    category: 'Privacy Violations',
    items: [
      'Collecting or storing personal data about other users beyond what is necessary for your authorised role',
      'Recording, monitoring, or intercepting other users\' communications without consent',
      'Publishing private information about another person without their consent ("doxxing")',
      'Uploading personal data of individuals who have not been informed of or consented to such processing',
    ],
  },
  {
    category: 'Academic Integrity',
    items: [
      'Submitting work generated entirely by AI tools without disclosure where prohibited by your institution',
      'Facilitating plagiarism, contract cheating, or other academic dishonesty',
      'Attempting to access exam content or questions outside of authorised channels',
      'Manipulating attendance records, grades, or academic records without authorisation',
    ],
  },
]

export default function AupPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span>Acceptable Use Policy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Acceptable Use Policy</h1>
          <p className="text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Summary */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 text-sm text-blue-800 dark:text-blue-300">
          <strong>Summary:</strong> Use Tera SM responsibly and within the law. Do not upload harmful content, attempt to breach security, misuse other users' data, or facilitate academic dishonesty. Violations may result in immediate account suspension.
        </div>

        {/* Purpose */}
        <section id="purpose">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Purpose</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            This Acceptable Use Policy ("AUP") sets out the rules for acceptable use of the Tera SM platform and all related services. This policy applies to all users — students, teachers, administrators, parents, and any other individual with access to the platform.
          </p>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
            This AUP is incorporated by reference into our <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link>. By using the platform, you agree to comply with this policy.
          </p>
        </section>

        {/* General principles */}
        <section id="principles">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. General Principles</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Be Lawful', desc: 'Use the platform only for lawful purposes in accordance with all applicable laws and regulations.' },
              { title: 'Be Respectful', desc: 'Treat all other users — students, staff, parents — with dignity and respect.' },
              { title: 'Be Honest', desc: 'Do not impersonate others, submit false information, or misrepresent your identity or role.' },
              { title: 'Be Responsible', desc: 'You are responsible for all activity under your account. Keep your credentials secure.' },
            ].map(p => (
              <div key={p.title} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{p.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Prohibited */}
        <section id="prohibited">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">3. Prohibited Conduct</h2>
          <div className="space-y-8">
            {prohibited.map(group => (
              <div key={group.category}>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  {group.category}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-red-400 flex-shrink-0 mt-0.5">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Content standards */}
        <section id="content">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Content Standards</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            All content uploaded or shared through the platform — including course materials, chat messages, assignment submissions, announcements, and profile information — must meet the following standards:
          </p>
          <ul className="space-y-3">
            {[
              'Accurate and not misleading',
              'Compliant with applicable copyright and licensing requirements',
              'Appropriate for an educational environment and the age range of the institution\'s student body',
              'Free from personal data of third parties who have not consented to its inclusion',
              'In the language(s) supported by the institution',
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Reporting */}
        <section id="reporting">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Reporting Violations</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            If you become aware of a violation of this AUP, report it immediately:
          </p>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Platform abuse or security issues</p>
              <a href="mailto:security@terasms.com" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">security@terasms.com</a>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Content violations or AUP concerns</p>
              <a href="mailto:trust@terasms.com" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">trust@terasms.com</a>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Students and staff should also report violations to their institution administrator. Institutions have the primary responsibility to moderate user behaviour within their tenancy.
          </p>
        </section>

        {/* Enforcement */}
        <section id="enforcement">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Enforcement</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            Violations of this AUP may result in, at Tera SM's or the institution's discretion:
          </p>
          <ul className="space-y-2">
            {[
              'A warning issued to the user and their institution administrator',
              'Temporary suspension of the account pending investigation',
              'Permanent termination of the account',
              'Termination of the institution\'s subscription (for serious or repeated Tenant-level violations)',
              'Referral to law enforcement authorities where required by law or where criminal conduct is involved',
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">!</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
            We will give reasonable notice and opportunity to respond before taking enforcement action, except in cases where immediate suspension is necessary to protect users, data, or platform integrity.
          </p>
        </section>

        {/* Changes */}
        <section id="changes">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Changes to This Policy</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            We may update this AUP from time to time. Material changes will be communicated to Tenant administrators with at least 30 days' notice. Continued use of the platform after changes take effect constitutes acceptance.
          </p>
        </section>

        {/* Related */}
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Related Legal Documents</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Cookie Policy', href: '/cookies' },
              { label: 'Data Processing Agreement', href: '/dpa' },
              { label: 'Security', href: '/security' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
