import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, GraduationCap, Building2, BookOpen, Users, DollarSign, UserCog } from 'lucide-react'

export const metadata: Metadata = { title: 'Solutions — Tera SM' }

const byType = [
  {
    id: 'secondary',
    icon: GraduationCap,
    title: 'Primary & Secondary Schools',
    desc: 'Manage the full student lifecycle from enrolment to graduation. Attendance, grades, fee collection, and parent communication — all in one place.',
    features: ['Student registration & ID cards', 'Class attendance (QR + manual)', 'Term results & report cards', 'Fee invoicing with MoMo support', 'Parent portal with SMS alerts', 'Timetable & exam scheduling'],
    cta: 'Perfect fit for Starter plan',
    href: '/pricing',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'colleges',
    icon: Building2,
    title: 'Colleges & Polytechnics',
    desc: 'Handle course registration, credit units, GPA tracking, and departmental management for growing institutions.',
    features: ['Credit-unit course registration', 'GPA/CGPA calculator', 'Department & faculty management', 'Full LMS with assignments & quizzes', 'HR + payroll for staff', 'Official transcript generation'],
    cta: 'Best on Pro plan',
    href: '/pricing',
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'universities',
    icon: BookOpen,
    title: 'Universities',
    desc: 'Full-scale academic management for multi-faculty, multi-campus institutions. Thesis portals, accreditation reports, and AI-powered analytics.',
    features: ['Multi-campus management', 'Thesis & dissertation portal', 'Accreditation report generator', 'AI early warning & dropout detection', 'Custom branding per faculty', 'REST API + webhooks for integration'],
    cta: 'Enterprise & University plans',
    href: '/pricing',
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'vocational',
    icon: Building2,
    title: 'Vocational & Training Institutes',
    desc: 'Shorter cohorts, practical assessments, and certification issuance — designed for skills-based training programs.',
    features: ['Short-course & cohort management', 'Practical assessment tracking', 'Digital certificate issuance', 'Employer partnership portal', 'Job board integration', 'Alumni & placement tracking'],
    cta: 'Starter or Pro plan',
    href: '/pricing',
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
]

const byRole = [
  {
    icon: Users,
    title: 'For School Administrators',
    desc: 'One dashboard for the whole institution. Enrolment stats, fee collection rates, attendance trends, and pending approvals — all in real time.',
    points: ['Real-time enrolment and fee dashboards', 'Leave request approvals', 'Announcement broadcasting', 'Audit logs for all actions', 'Custom report builder'],
  },
  {
    icon: BookOpen,
    title: 'For Teachers & Lecturers',
    desc: 'Focus on teaching, not paperwork. Manage your courses, mark attendance, grade assignments, and host live classes from one screen.',
    points: ['Course materials upload & management', 'One-click attendance marking', 'AI grading assistant', 'Live classes with recording', 'Student progress at a glance'],
  },
  {
    icon: GraduationCap,
    title: 'For Students',
    desc: 'A personalized portal with everything in one place — schedule, results, fees, messages, and AI-powered academic support.',
    points: ['Personalized dashboard & schedule', 'Grade history & GPA tracker', 'Pay fees via MoMo / Paystack', 'AI academic advisor', 'Digital transcript download'],
  },
  {
    icon: Users,
    title: 'For Parents',
    desc: 'Stay connected to your child\'s academic journey. View grades, attendance, and pay fees — all from your phone.',
    points: ['Real-time grade and attendance updates', 'Fee payment on behalf of child', 'Direct message to teachers', 'Result and report card download', 'Absence notifications'],
  },
  {
    icon: DollarSign,
    title: 'For Finance Offices',
    desc: 'End the spreadsheet chaos. Automated invoicing, payment tracking, scholarship management, and revenue reports.',
    points: ['Automated fee invoicing', 'Payment reconciliation dashboard', 'Scholarship and bursary management', 'Overdue fee reminders', 'Revenue analytics by program/term'],
  },
  {
    icon: UserCog,
    title: 'For HR Departments',
    desc: 'From recruitment to payslips. Manage the full employee lifecycle without leaving the platform.',
    points: ['Employee records and contracts', 'Leave application and approval', 'Payroll calculation and payslips', '360-degree performance reviews', 'Substitute teacher management'],
  },
]

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Solutions for every institution</h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            Whether you're a 200-student secondary school or a 20,000-student university,
            Tera SM scales to fit your institution exactly.
          </p>
        </div>
      </section>

      {/* By institution type */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">By institution type</h2>
          <p className="text-gray-500 text-center mb-16">Find the setup that matches your institution's structure.</p>
          <div className="grid md:grid-cols-2 gap-8">
            {byType.map((s) => (
              <div key={s.id} id={s.id} className={`${s.bg} rounded-3xl p-8 border border-transparent`}>
                <div className={`w-12 h-12 ${s.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                  <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{s.desc}</p>
                <ul className="space-y-2 mb-6">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.iconColor.replace('text-', 'bg-')}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={s.href} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                  {s.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* By role */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">By role</h2>
          <p className="text-gray-500 text-center mb-16">Tailored experiences for every person in your institution.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {byRole.map((r) => (
              <div key={r.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <r.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{r.title}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{r.desc}</p>
                <ul className="space-y-1.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-gray-600">
                      <div className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Not sure which plan fits?</h2>
          <p className="text-blue-100 mb-8">Book a 20-minute demo and we'll recommend the right setup for your institution.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-2xl font-semibold hover:bg-blue-50 transition-all">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="mailto:hello@terasms.com" className="px-8 py-4 border border-white/30 text-white rounded-2xl font-semibold hover:bg-white/10 transition-all">
              Talk to us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
