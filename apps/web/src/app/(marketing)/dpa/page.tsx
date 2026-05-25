import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Data Processing Agreement — Tera SM',
  description: 'The Data Processing Agreement (DPA) governing how Tera SM processes personal data on behalf of educational institutions.',
  alternates: { canonical: 'https://terasms.com/dpa' },
}

const LAST_UPDATED = 'May 25, 2026'
const EFFECTIVE_DATE = 'May 25, 2026'

const sections = [
  {
    id: 'background',
    title: '1. Background and Purpose',
    content: `This Data Processing Agreement ("DPA") forms part of the agreement between Tera SM Ltd. ("Processor") and the educational institution ("Controller") that has subscribed to the Tera SM platform.

This DPA sets out the terms under which the Processor processes personal data on behalf of the Controller, in accordance with applicable data protection laws including the General Data Protection Regulation (EU) 2016/679 ("GDPR"), the UK GDPR, and any other applicable national or regional data protection legislation.

By using the Tera SM Service, the Controller agrees to the terms of this DPA. If you require a countersigned copy for your records, contact dpa@terasms.com.`,
  },
  {
    id: 'definitions',
    title: '2. Definitions',
    content: `For the purposes of this DPA:

**"Controller"** means the educational institution that determines the purposes and means of processing personal data.

**"Processor"** means Tera SM Ltd., which processes personal data on behalf of the Controller.

**"Data Subject"** means an identified or identifiable natural person whose personal data is processed — including students, staff, parents, and any other users of the platform.

**"Personal Data"** means any information relating to an identified or identifiable natural person.

**"Processing"** means any operation performed on personal data, including collection, storage, use, disclosure, deletion, or transfer.

**"Sub-processor"** means any third party engaged by the Processor to carry out processing activities on behalf of the Controller.

**"Applicable Law"** means the GDPR, UK GDPR, and any other applicable data protection legislation in force.`,
  },
  {
    id: 'scope',
    title: '3. Scope and Nature of Processing',
    content: `**Subject Matter**
The Processor provides school management software and related services as described at terasms.com/features.

**Duration**
Processing will continue for the duration of the Controller's active subscription and for a period of 30 days following termination (to allow data export), after which data will be deleted unless a longer retention period is required by Applicable Law.

**Nature of Processing**
Storage, organisation, retrieval, use, disclosure, and deletion of personal data for the purpose of providing the Service.

**Categories of Data Subjects**
Students, teachers, administrative staff, parents and guardians, and any other individuals whose data the Controller inputs into the platform.

**Categories of Personal Data**
Identity data (name, email, phone, date of birth), academic data (grades, attendance, registrations), financial data (fee records, payment history), communication data (messages, notifications), and usage data (login events, feature usage logs).

**Special Category Data**
May include health-related data (e.g. sick notes, counseling records) where the Controller inputs such data. The Controller is responsible for ensuring an appropriate lawful basis exists for processing special category data.`,
  },
  {
    id: 'controller-obligations',
    title: '4. Controller Obligations',
    content: `The Controller agrees to:

- Ensure it has a valid lawful basis for processing personal data and for engaging the Processor
- Provide accurate and complete instructions to the Processor regarding processing activities
- Ensure Data Subjects have been given appropriate privacy notices before their data is entered into the platform
- Obtain any necessary consents, particularly for special category data and for data subjects under 18
- Respond to Data Subject requests exercising their rights in accordance with Applicable Law
- Notify the Processor of any changes to its instructions or applicable legal requirements that affect processing`,
  },
  {
    id: 'processor-obligations',
    title: '5. Processor Obligations',
    content: `The Processor agrees to:

**Process Only on Instructions**
Process personal data only on documented instructions from the Controller, unless required to do so by Applicable Law (in which case the Processor will notify the Controller unless prohibited by law).

**Confidentiality**
Ensure that all personnel authorised to process personal data are bound by appropriate confidentiality obligations.

**Security**
Implement and maintain appropriate technical and organisational measures to protect personal data, as described in Annex II of this DPA and in our Security Policy at terasms.com/security.

**Sub-processors**
Only engage sub-processors with the Controller's prior authorisation (general authorisation is given via acceptance of this DPA, subject to notification of changes). Ensure sub-processors are bound by equivalent data protection obligations.

**Assistance with Rights**
Assist the Controller in responding to Data Subject requests by providing relevant functionality within the platform and, where technically possible, cooperating with requests for access, rectification, erasure, or portability.

**Breach Notification**
Notify the Controller without undue delay (and within 72 hours where feasible) upon becoming aware of a personal data breach affecting the Controller's data.

**Deletion or Return**
Upon termination of the Service, delete or return all personal data (at the Controller's choice) within 30 days, unless Applicable Law requires longer retention.

**Audit Rights**
Provide the Controller with all information necessary to demonstrate compliance with this DPA, and allow and contribute to audits or inspections conducted by the Controller or its mandated auditor (subject to reasonable notice and confidentiality protections).`,
  },
  {
    id: 'sub-processors',
    title: '6. Sub-processors',
    content: `The Controller provides general authorisation for the Processor to engage sub-processors. The Processor maintains an up-to-date list of sub-processors below. The Processor will notify the Controller of any changes to sub-processors at least 30 days in advance. The Controller may object to new sub-processors within 14 days of notification.

**Current Sub-processors:**

| Sub-processor | Location | Purpose |
|---|---|---|
| Neon Inc. | USA (AWS) | PostgreSQL database hosting |
| Vercel Inc. | USA / EU | Web application hosting |
| Cloudflare Inc. | USA / Global | File storage (R2), CDN, DNS |
| Resend Inc. | USA | Transactional email delivery |
| Upstash Inc. | USA / EU | Redis cache and message queues |
| Stripe Inc. | USA | Payment processing (where applicable) |
| Paystack Inc. | Nigeria / USA | Payment processing (where applicable) |
| Flutterwave Inc. | Nigeria / USA | Payment processing (where applicable) |
| Africa's Talking | Kenya | SMS delivery (where applicable) |
| Twilio Inc. | USA | SMS and WhatsApp (where applicable) |

Enterprise and University plan Tenants may request data residency within a specific region; in such cases, sub-processor locations will be confirmed accordingly.`,
  },
  {
    id: 'transfers',
    title: '7. International Data Transfers',
    content: `Where the Processor transfers personal data to a country or territory outside the European Economic Area (or the UK) that does not benefit from an adequacy decision, it will ensure that appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) as adopted by the European Commission, or UK International Data Transfer Agreements (IDTAs) as applicable.

The Controller may request copies of relevant transfer mechanisms by contacting dpa@terasms.com.`,
  },
  {
    id: 'security-measures',
    title: '8. Technical and Organisational Security Measures',
    content: `The Processor implements and maintains the following measures to protect personal data:

**Access Controls**
- Role-based access control (RBAC) with principle of least privilege
- Two-factor authentication for all administrative access
- Unique credentials per employee; shared accounts prohibited

**Encryption**
- All data in transit encrypted via TLS 1.2 or higher
- All data at rest encrypted using AES-256 or equivalent

**Availability and Resilience**
- Automated daily backups with point-in-time recovery
- Geo-redundant database hosting
- 99.9% uptime SLA with incident response procedures

**Monitoring and Audit**
- Full audit logging of access and modification events
- Automated intrusion detection and alerting
- Regular penetration testing by qualified third parties

**Personnel**
- Background checks on personnel with access to production systems
- Data protection training on onboarding and annually thereafter
- Confidentiality agreements for all personnel`,
  },
  {
    id: 'breach',
    title: '9. Personal Data Breaches',
    content: `In the event the Processor becomes aware of a personal data breach affecting the Controller's data:

1. The Processor will notify the Controller without undue delay and within 72 hours where feasible.
2. The notification will include: description of the nature of the breach; categories and approximate number of Data Subjects affected; likely consequences; measures taken or proposed.
3. The Processor will cooperate fully with the Controller's investigation and assist with any notifications required by Applicable Law to supervisory authorities or affected Data Subjects.

Breach notifications should be sent to: security@terasms.com`,
  },
  {
    id: 'termination',
    title: '10. Termination and Data Deletion',
    content: `Upon expiry or termination of the Service:

- The Controller has 30 days to export their data using the platform's built-in export tools.
- After 30 days, the Processor will securely delete all Controller data (including backups) unless Applicable Law requires longer retention.
- Upon request, the Processor will provide a written certification of deletion within 14 days of completing the deletion process.`,
  },
  {
    id: 'liability',
    title: '11. Liability',
    content: `Each party's liability under this DPA is subject to the limitations set out in the main Terms of Service, except that no limitation shall apply to: breaches of confidentiality obligations; a party's indemnification obligations for third-party claims resulting from its breach of this DPA; or liability that cannot be limited under Applicable Law.`,
  },
  {
    id: 'governing-law',
    title: '12. Governing Law',
    content: `This DPA is governed by the same governing law as the main Terms of Service, subject to any mandatory provisions of Applicable Data Protection Law that apply regardless of choice of law.`,
  },
  {
    id: 'contact',
    title: '13. Contact and Execution',
    content: `To execute a countersigned DPA, or for any questions related to this agreement, contact:

dpa@terasms.com
Tera SM Ltd., [Address]

Effective date of this version: ${EFFECTIVE_DATE}`,
  },
]

export default function DpaPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span>Data Processing Agreement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Data Processing Agreement</h1>
          <p className="text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED} · Effective: {EFFECTIVE_DATE}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex gap-12">
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Contents</p>
              <nav className="space-y-1">
                {sections.map(s => (
                  <a key={s.id} href={`#${s.id}`} className="block text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-0.5 transition-colors leading-snug">
                    {s.title}
                  </a>
                ))}
              </nav>
              <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">Need a signed copy?</p>
                <a href="mailto:dpa@terasms.com" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">dpa@terasms.com</a>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl p-5 mb-10 text-sm text-amber-800 dark:text-amber-300">
              <strong>For GDPR compliance:</strong> This DPA applies automatically to all Tenants. Enterprise and University plan Tenants may request a countersigned PDF copy for their records by contacting dpa@terasms.com.
            </div>

            <div className="space-y-12">
              {sections.map(s => (
                <section key={s.id} id={s.id}>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{s.title}</h2>
                  <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-4">
                    {s.content.split('\n\n').map((para, i) => {
                      if (para.includes('| ') && para.includes('|---')) {
                        const rows = para.trim().split('\n').filter(r => !r.match(/^\|[-|]+$/))
                        const [header, ...body] = rows
                        const headers = header.split('|').filter(Boolean).map(h => h.trim())
                        return (
                          <div key={i} className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 mt-4">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                  {headers.map((h, j) => <th key={j} className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{h}</th>)}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {body.map((row, j) => {
                                  const cells = row.split('|').filter(Boolean).map(c => c.trim())
                                  return (
                                    <tr key={j} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                      {cells.map((c, k) => <td key={k} className="px-4 py-3 text-gray-600 dark:text-gray-400">{c}</td>)}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )
                      }
                      if (para.startsWith('**') && para.includes('**\n')) {
                        const [heading, ...rest] = para.split('\n')
                        return (
                          <div key={i}>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{heading.replace(/\*\*/g, '')}</p>
                            <p>{rest.join('\n')}</p>
                          </div>
                        )
                      }
                      if (para.startsWith('1. ') || para.startsWith('- ')) {
                        return (
                          <ul key={i} className="space-y-2">
                            {para.split('\n').map((line, j) => (
                              <li key={j} className="flex gap-2">
                                <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">{line.startsWith('1.') || line.match(/^\d\./) ? line.match(/^\d/)?.[0] + '.' : '–'}</span>
                                <span>{line.replace(/^[\d]+\. /, '').replace('- ', '')}</span>
                              </li>
                            ))}
                          </ul>
                        )
                      }
                      return <p key={i}>{para}</p>
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Related Legal Documents</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/cookies' },
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
