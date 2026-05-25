import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Tera SM',
  description: 'How Tera SM collects, uses, and protects your personal data.',
  alternates: { canonical: 'https://terasms.com/privacy' },
}

const LAST_UPDATED = 'May 25, 2026'

const sections = [
  {
    id: 'overview',
    title: '1. Overview',
    content: `Tera SM ("we", "our", or "us") is committed to protecting the privacy of students, staff, administrators, parents, and all other users of the Tera SM platform. This Privacy Policy explains what personal data we collect, why we collect it, how we use it, and your rights regarding that data.

By using the Tera SM platform or website, you agree to the collection and use of information in accordance with this policy. If you are using Tera SM on behalf of an educational institution (a "Tenant"), that institution is the data controller for the personal data of its users, and we act as a data processor on their behalf.`,
  },
  {
    id: 'who-we-are',
    title: '2. Who We Are',
    content: `Tera SM is a SaaS platform for educational institutions. Our registered business address is:

Tera SM Ltd.
[Business Address]
hello@terasms.com

For data protection enquiries, contact our Data Protection Officer at: privacy@terasms.com`,
  },
  {
    id: 'data-we-collect',
    title: '3. Data We Collect',
    content: `We collect the following categories of personal data:

**Account and Identity Data**
Name, email address, phone number, date of birth, gender, profile photo, and government-issued ID (for student verification purposes).

**Academic Data**
Enrollment records, course registrations, grades, attendance records, transcripts, timetables, and assignment submissions.

**Financial Data**
Fee payment records, invoice history, scholarship or bursary details. We do not store full payment card numbers — payments are processed by our gateway partners (Paystack, Flutterwave, Stripe).

**Communication Data**
Messages sent through in-app chat, announcement reads, notification preferences, and email correspondence.

**Usage Data**
Log data, IP addresses, browser type, device identifiers, pages visited, and features used within the platform.

**Technical Data**
Session tokens, authentication logs, and audit trail events.

**Special Category Data**
Where you voluntarily provide it (e.g. health-related data for sick notes or counseling bookings), this is collected with explicit consent and stored with additional safeguards.`,
  },
  {
    id: 'how-we-use',
    title: '4. How We Use Your Data',
    content: `We use personal data for the following purposes:

**Service Delivery**
To provide and operate the Tera SM platform, process registrations, generate transcripts, manage fees, enable live classes, and all other core platform functions.

**Communications**
To send transactional emails, push notifications, SMS alerts, and in-app messages related to your use of the platform (fee reminders, grade publications, announcement broadcasts).

**Safety and Security**
To detect and prevent fraud, abuse, and unauthorized access. To maintain audit logs of all platform actions.

**Legal Compliance**
To comply with applicable laws, respond to lawful requests from authorities, and enforce our Terms of Service.

**Platform Improvement**
Aggregated, anonymized usage data is used to improve product features. We do not use individually identifiable data for this purpose without consent.

**Marketing (Platform Website Only)**
If you submit a contact or demo request form on our marketing website, we use your data to follow up on your inquiry. You may opt out at any time.`,
  },
  {
    id: 'legal-basis',
    title: '5. Legal Basis for Processing',
    content: `We process personal data under the following legal bases:

- **Contract**: Processing necessary to provide the service you or your institution contracted for.
- **Legal Obligation**: Processing required to comply with applicable law.
- **Legitimate Interests**: Platform security, fraud prevention, and service improvement — balanced against your rights.
- **Consent**: Where we explicitly ask for your consent (e.g. marketing emails, special category data). You may withdraw consent at any time.

For Tenants subject to GDPR, we act as a data processor. The Tenant (educational institution) is the data controller and determines the purposes for which student and staff data is processed.`,
  },
  {
    id: 'data-sharing',
    title: '6. Data Sharing',
    content: `We do not sell personal data. We share data only in the following circumstances:

**Sub-processors**
We use carefully vetted third-party services to operate the platform. These include: Neon (PostgreSQL hosting), Vercel (web hosting), Cloudflare R2 (file storage), Resend (email delivery), and payment gateways. All sub-processors are contractually bound to process data only on our instructions.

**Your Institution**
Data you generate on the platform (grades, attendance, submissions) is accessible to authorised staff at your educational institution acting as the data controller.

**Legal Requirements**
We may disclose data if required to do so by law, court order, or government authority with proper jurisdiction.

**Business Transfers**
In the event of a merger, acquisition, or sale of assets, user data may be transferred. You will be notified of any such change and your rights will be preserved.`,
  },
  {
    id: 'data-retention',
    title: '7. Data Retention',
    content: `We retain personal data for as long as your account is active or as needed to provide services. When a Tenant's subscription ends, we retain their data for 30 days to allow for export, after which it is deleted unless a longer retention period is required by law.

Academic records (transcripts, grades) may be retained longer where required by applicable education law or regulation. We will inform Tenants of applicable minimum retention periods.

Audit logs are retained for a minimum of 1 year on Pro plans and 3 years on Enterprise and University plans.`,
  },
  {
    id: 'your-rights',
    title: '8. Your Rights',
    content: `Depending on your jurisdiction, you may have the following rights:

- **Access**: Request a copy of the personal data we hold about you.
- **Rectification**: Request correction of inaccurate data.
- **Erasure**: Request deletion of your data (subject to legal retention requirements).
- **Portability**: Receive your data in a structured, machine-readable format.
- **Objection**: Object to processing based on legitimate interests.
- **Restriction**: Request we limit processing while a dispute is resolved.
- **Withdraw Consent**: Withdraw previously given consent at any time.

To exercise any of these rights, contact us at privacy@terasms.com. For students and staff, your institution (the data controller) may need to be involved in responding to certain requests.`,
  },
  {
    id: 'security',
    title: '9. Security',
    content: `We implement industry-standard technical and organisational measures to protect your data:

- Encryption in transit (TLS 1.2+) and at rest (AES-256)
- Role-based access control with the principle of least privilege
- Two-factor authentication available for all admin and staff accounts
- Automated daily backups with point-in-time recovery
- Regular penetration testing and security audits
- Breach detection and incident response procedures

Despite these measures, no system is 100% secure. If you believe your account has been compromised, contact us immediately at security@terasms.com.`,
  },
  {
    id: 'cookies',
    title: '10. Cookies',
    content: `We use cookies and similar technologies on our marketing website. The Tera SM application uses session cookies essential to platform operation.

For full details on how we use cookies and how to manage your preferences, see our Cookie Policy at terasms.com/cookies.`,
  },
  {
    id: 'international',
    title: '11. International Transfers',
    content: `Tera SM is hosted on infrastructure primarily in the United States and Europe. Where we transfer data outside your country or the European Economic Area, we ensure appropriate safeguards are in place (Standard Contractual Clauses, adequacy decisions, or equivalent mechanisms).

Enterprise and University plan Tenants may select a preferred data residency region at account setup.`,
  },
  {
    id: 'children',
    title: '12. Children\'s Privacy',
    content: `Tera SM is used by educational institutions that may serve students under the age of 18. In such cases, the institution (as data controller) is responsible for obtaining appropriate parental consents where required by applicable law.

We do not knowingly collect personal data from children under 13 through our marketing website without parental consent.`,
  },
  {
    id: 'changes',
    title: '13. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. Material changes will be communicated to Tenant administrators by email and in-app notification at least 30 days before taking effect. The updated date at the top of this page reflects the latest revision.

Continued use of the platform after changes take effect constitutes acceptance of the revised policy.`,
  },
  {
    id: 'contact',
    title: '14. Contact Us',
    content: `For privacy-related questions or to exercise your rights:

**Data Protection Officer**
privacy@terasms.com

**General Enquiries**
hello@terasms.com

**Postal Address**
Tera SM Ltd., [Address]

If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection supervisory authority.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span>Privacy Policy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Privacy Policy</h1>
          <p className="text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex gap-12">
          {/* TOC — desktop */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Contents</p>
              <nav className="space-y-1">
                {sections.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-0.5 transition-colors leading-snug"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 mb-10 text-sm text-blue-800 dark:text-blue-300">
              <strong>Summary:</strong> We collect only what is needed to run the platform. We do not sell your data. Educational institutions control their own student data. You have rights to access, correct, and delete your data. Contact privacy@terasms.com with any questions.
            </div>

            <div className="space-y-12">
              {sections.map(s => (
                <section key={s.id} id={s.id}>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{s.title}</h2>
                  <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-4">
                    {s.content.split('\n\n').map((para, i) => {
                      if (para.startsWith('**') && para.includes('**\n')) {
                        const [heading, ...rest] = para.split('\n')
                        return (
                          <div key={i}>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{heading.replace(/\*\*/g, '')}</p>
                            <p>{rest.join('\n')}</p>
                          </div>
                        )
                      }
                      if (para.startsWith('- ')) {
                        return (
                          <ul key={i} className="space-y-2 list-none">
                            {para.split('\n').map((line, j) => {
                              const [bold, ...rest] = line.replace('- ', '').split(': ')
                              return (
                                <li key={j} className="flex gap-2">
                                  <span className="text-blue-600 dark:text-blue-400 mt-1">–</span>
                                  <span><strong className="text-gray-800 dark:text-gray-200">{bold}</strong>{rest.length ? `: ${rest.join(': ')}` : ''}</span>
                                </li>
                              )
                            })}
                          </ul>
                        )
                      }
                      return <p key={i}>{para}</p>
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* Related legal links */}
            <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Related Legal Documents</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/cookies' },
                  { label: 'Data Processing Agreement', href: '/dpa' },
                  { label: 'Acceptable Use Policy', href: '/aup' },
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
      </div>
    </div>
  )
}
