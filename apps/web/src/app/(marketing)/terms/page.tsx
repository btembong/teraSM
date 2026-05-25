import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Tera SM',
  description: 'The terms and conditions governing use of the Tera SM platform.',
  alternates: { canonical: 'https://terasms.com/terms' },
}

const LAST_UPDATED = 'May 25, 2026'

const sections = [
  {
    id: 'agreement',
    title: '1. Agreement to Terms',
    content: `By accessing or using the Tera SM platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of an organisation (an educational institution), you represent that you have authority to bind that organisation.

If you do not agree to these Terms, you may not use the Service.

These Terms apply to all users of the Service, including school administrators, teachers, students, parents, and any other role with platform access.`,
  },
  {
    id: 'description',
    title: '2. Description of Service',
    content: `Tera SM is a multi-tenant SaaS platform providing school management software for educational institutions. The Service includes modules for admissions, academics, finance, learning management, live classes, HR, communication, student life, analytics, and more — as described in detail at terasms.com/features.

The specific features available depend on the subscription plan selected by the educational institution. We reserve the right to modify, suspend, or discontinue features with reasonable notice.`,
  },
  {
    id: 'accounts',
    title: '3. Accounts and Access',
    content: `**Tenant Accounts**
Educational institutions ("Tenants") contract with Tera SM to use the platform. Tenants are responsible for all use of the Service by their end users (students, staff, parents).

**User Accounts**
Individual users access the platform through accounts created by or on behalf of the Tenant. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.

**Accuracy**
You agree to provide accurate and complete information when creating your account and to keep it up to date.

**Unauthorised Access**
You must notify your institution administrator and Tera SM immediately at security@terasms.com if you become aware of any unauthorised use of your account.`,
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable Use',
    content: `You agree not to use the Service to:

- Violate any applicable law or regulation
- Upload, transmit, or share content that is unlawful, harmful, defamatory, obscene, or infringes intellectual property rights
- Attempt to gain unauthorised access to any part of the Service or other users' data
- Interfere with or disrupt the integrity or performance of the Service
- Use automated tools to scrape, crawl, or extract data from the platform without written permission
- Impersonate any person or organisation
- Send spam, phishing messages, or unsolicited communications through the platform

Violations may result in immediate account suspension. For the full Acceptable Use Policy, see terasms.com/aup.`,
  },
  {
    id: 'subscription',
    title: '5. Subscription and Payment',
    content: `**Plans and Billing**
The Service is offered on subscription plans (Starter, Pro, Enterprise, University) as described at terasms.com/pricing. Billing is monthly or annual, as selected at sign-up.

**Free Trial**
Starter and Pro plans include a 14-day free trial. No credit card is required to start a trial. At the end of the trial, you must subscribe or lose access to the platform.

**Payment**
All fees are stated in USD. Payment is due at the start of each billing period. Failure to pay will result in a 7-day grace period after which access may be suspended.

**Upgrades and Downgrades**
You may upgrade your plan at any time (pro-rated billing applied). Downgrades take effect at the next billing cycle.

**Annual Plans**
Annual subscriptions are billed upfront. A 30-day refund is available from the date of first payment on annual plans.

**Taxes**
Prices do not include applicable taxes. You are responsible for any VAT, GST, withholding tax, or other taxes applicable to your purchase.`,
  },
  {
    id: 'data',
    title: '6. Data and Privacy',
    content: `**Tenant Data**
Data entered into the platform by a Tenant and its users ("Tenant Data") remains the property of the Tenant. Tera SM processes Tenant Data as a data processor acting on the Tenant's instructions.

**Data Processing Agreement**
Tenants who require a formal Data Processing Agreement (e.g. for GDPR compliance) may access and sign the DPA at terasms.com/dpa.

**Privacy Policy**
Our handling of personal data is governed by our Privacy Policy at terasms.com/privacy.

**Data Export on Cancellation**
Upon subscription cancellation, you have 30 days to export your data. After that period, your data will be deleted from our systems (subject to any legal retention obligations).`,
  },
  {
    id: 'ip',
    title: '7. Intellectual Property',
    content: `**Our IP**
The Tera SM platform, including its software, design, trademarks, and documentation, is owned by Tera SM Ltd. and protected by intellectual property laws. These Terms do not grant you any ownership of or license to our intellectual property beyond the right to use the Service as permitted.

**Your Content**
You retain all rights to content you upload to the platform (course materials, documents, etc.). By uploading content, you grant Tera SM a limited license to store and serve that content solely for the purpose of providing the Service.

**Feedback**
If you provide feedback or suggestions, we may use them to improve the Service without obligation to you.`,
  },
  {
    id: 'sla',
    title: '8. Service Level and Availability',
    content: `We target 99.9% uptime for the platform (Enterprise and University plans). Scheduled maintenance is performed during low-traffic windows and communicated in advance via the status page at terasms.com/status.

We are not responsible for downtime caused by factors outside our control, including internet outages, third-party service failures, or force majeure events.`,
  },
  {
    id: 'limitation',
    title: '9. Limitation of Liability',
    content: `To the maximum extent permitted by applicable law, Tera SM and its affiliates, officers, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill.

Our total cumulative liability to you for any claim arising out of or related to these Terms or the Service shall not exceed the total fees paid by you in the 12 months preceding the claim.

Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud, or any liability that cannot be excluded by law.`,
  },
  {
    id: 'termination',
    title: '10. Termination',
    content: `**By You**
You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period.

**By Us**
We may suspend or terminate your access immediately if you materially breach these Terms, fail to pay, or engage in conduct that endangers the platform or other users. We will provide reasonable notice where practicable.

**Effect of Termination**
Upon termination, your right to access the Service ceases. Data export is available for 30 days post-cancellation as described in Section 6.`,
  },
  {
    id: 'governing-law',
    title: '11. Governing Law and Disputes',
    content: `These Terms are governed by the laws of [Jurisdiction]. Any dispute arising out of or relating to these Terms or the Service that cannot be resolved amicably shall be submitted to binding arbitration under the rules of [Arbitration Body], except that either party may seek injunctive relief in court for IP infringement or data breach matters.

Nothing in this clause prevents you from bringing a claim before your local consumer protection authority where applicable law requires it.`,
  },
  {
    id: 'changes',
    title: '12. Changes to These Terms',
    content: `We may update these Terms from time to time. Material changes will be communicated to Tenant administrators by email and in-app notification at least 30 days before taking effect. Your continued use of the Service after the effective date constitutes acceptance of the new Terms.

We will maintain a changelog of material updates to these Terms.`,
  },
  {
    id: 'contact',
    title: '13. Contact',
    content: `For questions about these Terms:

legal@terasms.com
Tera SM Ltd., [Address]`,
  },
]

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span>/</span>
            <span>Terms of Service</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Terms of Service</h1>
          <p className="text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>
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
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 mb-10 text-sm text-blue-800 dark:text-blue-300">
              <strong>Summary:</strong> Use the platform legally and responsibly. Institutions are responsible for their users. Payments are billed per plan. Your data belongs to you — export it anytime. We can terminate for serious violations. Contact legal@terasms.com with questions.
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
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{heading.replace(/\*\*/g, '')}</p>
                            <p>{rest.join('\n')}</p>
                          </div>
                        )
                      }
                      if (para.startsWith('- ')) {
                        return (
                          <ul key={i} className="space-y-2">
                            {para.split('\n').map((line, j) => (
                              <li key={j} className="flex gap-2">
                                <span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">–</span>
                                <span>{line.replace('- ', '')}</span>
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
                  { label: 'Cookie Policy', href: '/cookies' },
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
