import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle, ArrowLeft, Users, GraduationCap, Shield } from 'lucide-react'

// ─── Module data ──────────────────────────────────────────────────────────────

const MODULES: Record<string, {
  title: string
  tagline: string
  description: string
  color: string
  badge: string
  capabilities: string[]
  forStudent?: string[]
  forTeacher?: string[]
  forAdmin?: string[]
  metrics: { value: string; label: string }[]
  related: { slug: string; title: string }[]
}> = {
  academics: {
    title: 'Academics',
    tagline: 'From registration to transcript — fully digital.',
    description: 'Replace every paper-based academic process with a unified digital workflow. Course registration, timetable generation, grade entry, and transcript issuance — all connected, all auditable.',
    color: 'from-indigo-500 to-blue-600',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
    capabilities: [
      'Academic calendar management with term, semester, and holiday configuration',
      'AI-assisted timetable generator — conflict-free scheduling in minutes',
      'Timetable viewer per student, per teacher, and per class',
      'Exam timetable with room, venue, and invigilator assignment',
      'One-click sync to Google Calendar or Apple Calendar',
      'Course registration with prerequisite validation and clash detection',
      'Add/drop period with deadline enforcement and waitlist management',
      'Attendance tracking — manual, QR code, or auto-mark on class join',
      'Grade entry with per-course CA + exam breakdown',
      'GPA and CGPA calculator with what-if scenario tool',
      'Progress toward degree completion as percentage of total credits',
      'Results publication with controlled release per course',
      'Official transcript with watermark and document authentication QR code',
      'Certificate generator — enrollment, completion, and degree',
      'Academic appeals workflow for grade disputes',
      'Online proctored exams with webcam monitoring and browser lockdown',
      'Question bank for reusable exam paper generation',
    ],
    forStudent: [
      'Register for courses, see seat availability, and resolve clashes before confirming',
      'View weekly timetable and exam schedule with room and venue links',
      'Track GPA each semester and simulate future scenarios with what-if calculator',
      'Download official transcript instantly — or email it directly to an institution',
    ],
    forTeacher: [
      'Enter grades via a clean grade sheet — CA and exam scores calculated automatically',
      'Mark attendance in one tap or let the system auto-mark when students join live class',
      'View your own timetable and receive instant cancellation or rescheduling alerts',
    ],
    forAdmin: [
      'Configure academic years, semesters, faculties, departments, programs, and courses',
      'Run the AI timetable generator and approve or adjust the output',
      'Publish results for all courses in one action — with controlled release dates',
      'Generate and download official transcripts or certificates for any student',
    ],
    metrics: [
      { value: '100%', label: 'Clash-free scheduling' },
      { value: '80%', label: 'Less admin time on records' },
      { value: '< 1 min', label: 'Transcript generation' },
    ],
    related: [
      { slug: 'lms', title: 'Learning Management System' },
      { slug: 'analytics', title: 'Analytics & Reporting' },
      { slug: 'ai', title: 'AI & Intelligence' },
    ],
  },

  finance: {
    title: 'Finance',
    tagline: 'Collect fees on time. Every time.',
    description: 'End the spreadsheet chaos and WhatsApp fee chasing. Automated invoicing, multi-gateway payments, scholarship management, and real-time revenue dashboards — all in one place.',
    color: 'from-green-500 to-emerald-600',
    badge: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    capabilities: [
      'Fee structure setup per program, level, semester, and course',
      'Student fee invoicing with itemized breakdowns',
      'Online payment via Paystack, Flutterwave, Stripe, MTN MoMo, and Orange Money',
      'Installment and payment plan management with per-student schedules',
      'Scholarship and bursary management — apply, approve, and auto-deduct',
      'Automated late fee engine with configurable penalty rules',
      'Fee deadline reminders at 7-day, 3-day, and 1-day intervals via SMS, email, and push',
      'Payment receipt and invoice PDF download per transaction',
      'Outstanding balance overview dashboard with aging breakdown',
      'Financial aid application and review workflow',
      'Refund request submission and processing',
      'Departmental budget management and tracking',
      'Revenue analytics by program, term, campus, and payment method',
      'Bank reconciliation tools',
      'Financial report export in PDF, Excel, and CSV',
    ],
    forStudent: [
      'See outstanding balance and full fee breakdown on the dashboard',
      'Pay via card, bank transfer, MoMo, or Orange Money in under 2 minutes',
      'Enroll in an installment plan and view your full payment schedule',
      'Download receipts and invoices for every transaction',
      'Check scholarship status — approved amount and balance remaining',
    ],
    forAdmin: [
      'Configure fee structures per program and semester in the finance settings',
      'Monitor real-time fee collection rates across all programs on one dashboard',
      'Approve scholarship and financial aid applications with one click',
      'Export revenue reports for any date range in PDF, Excel, or CSV',
      'Run the reconciliation tool to match bank deposits with platform records',
    ],
    metrics: [
      { value: '94%', label: 'Avg. collection rate' },
      { value: '60% → 94%', label: 'Typical improvement' },
      { value: '5 gateways', label: 'Payment methods supported' },
    ],
    related: [
      { slug: 'academics', title: 'Academics' },
      { slug: 'analytics', title: 'Analytics & Reporting' },
      { slug: 'hr', title: 'HR Management' },
    ],
  },

  lms: {
    title: 'Learning Management System',
    tagline: 'Teach, assign, and grade — all in one place.',
    description: 'A full-featured LMS purpose-built for African institutions. Upload course content, run assignments with AI grading, detect plagiarism, and track every student\'s progress — without any third-party tools.',
    color: 'from-violet-500 to-purple-600',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    capabilities: [
      'Course content management — upload slides, PDFs, videos, and external links',
      'Adaptive learning paths that adjust content based on student performance',
      'SCORM and xAPI support for third-party eLearning packages',
      'Interactive content with H5P — quizzes, drag-and-drop, and flashcards',
      'Video lesson creator — record, upload, and annotate in-platform',
      'Discussion forums per course with threaded conversations',
      'Assignments with file submission, deadlines, and configurable late penalties',
      'Peer review assignments with student rubrics',
      'AI grading assistant — auto-score objectives, generate essay feedback',
      'Plagiarism detection with document similarity scoring',
      'Visual progress tracker per student per course',
      'Offline content download for low-connectivity environments (PWA)',
      'Course prerequisite enforcement',
      'Micro-credentials and digital badge issuance on completion',
    ],
    forStudent: [
      'Access all course materials in one organised place — slides, videos, readings',
      'Submit assignments before the deadline and track your submission status',
      'Receive AI feedback on your essay before the teacher reviews it',
      'See your progress through each course as a visual completion percentage',
      'Download materials for offline use on low-bandwidth connections',
    ],
    forTeacher: [
      'Upload and organise course content in drag-and-drop modules',
      'Create assignments with rubrics, submission types, and late penalty rules',
      'Use the AI grading assistant to speed up objective marking',
      'Review plagiarism scores before finalising grades',
      'See at-a-glance which students are falling behind on progress',
    ],
    forAdmin: [
      'Monitor LMS adoption and content completion rates across all courses',
      'Enable or disable specific LMS features per department',
      'Configure plagiarism sensitivity thresholds institution-wide',
    ],
    metrics: [
      { value: '40%', label: 'Less time on grading' },
      { value: 'Offline', label: 'PWA support for low bandwidth' },
      { value: 'Built-in', label: 'No Moodle or Canvas needed' },
    ],
    related: [
      { slug: 'live-classes', title: 'Live Classes' },
      { slug: 'academics', title: 'Academics' },
      { slug: 'ai', title: 'AI & Intelligence' },
    ],
  },

  'live-classes': {
    title: 'Live Classes',
    tagline: 'Built-in video conferencing. No Zoom subscription needed.',
    description: 'Full WebRTC video conferencing built directly into Tera SM. Breakout rooms, auto-recording, virtual whiteboard, and attendance auto-mark — all linked to your course and calendar.',
    color: 'from-purple-500 to-pink-600',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    capabilities: [
      'Built-in WebRTC video conferencing — no external subscription required',
      'Breakout rooms — split your class into groups mid-session',
      'Auto-recording with cloud storage and replay linked to course',
      'Virtual collaborative whiteboard for diagrams and annotations',
      'Live polls and Q&A during class',
      'Hand raise and emoji reactions',
      'Screen sharing for presentations and demos',
      'Attendance auto-marked when students join the session',
      'Scheduled class reminders via push, email, and SMS',
      'Class cancellation alerts with instant push notification',
      'Recording access limited to enrolled students only',
    ],
    forStudent: [
      'Join live classes from browser or mobile app — no software download',
      'Raise your hand, react, or ask questions during the session',
      'Access recordings after class — linked directly to your course page',
      'Attendance is marked automatically the moment you join',
    ],
    forTeacher: [
      'Schedule a live class and it appears on every enrolled student\'s timetable',
      'Launch breakout rooms in one click during the session',
      'Start the whiteboard for collaborative diagrams and problem-solving',
      'Run a live poll to check understanding without leaving the classroom',
    ],
    forAdmin: [
      'Monitor active live classes across all departments in real time',
      'Configure storage limits for recordings per plan tier',
      'View per-class attendance reports automatically populated from sessions',
    ],
    metrics: [
      { value: '$0', label: 'Per-minute cost (vs. Zoom)' },
      { value: 'Auto', label: 'Attendance marking' },
      { value: 'Unlimited', label: 'Recording storage on Enterprise+' },
    ],
    related: [
      { slug: 'lms', title: 'Learning Management System' },
      { slug: 'academics', title: 'Academics' },
      { slug: 'communication', title: 'Communication' },
    ],
  },

  hr: {
    title: 'HR Management',
    tagline: 'From recruitment to payslips — one system.',
    description: 'Manage the complete employee lifecycle for teachers, admin, and support staff. Recruitment pipelines, contract storage, payroll calculation, and 360-degree reviews — all built in.',
    color: 'from-teal-500 to-cyan-600',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
    capabilities: [
      'Employee records for all staff types — teachers, admin, and support',
      'Recruitment pipeline — job postings, applicant tracking, interview scheduling',
      'Contract management with document storage and renewal alerts',
      'Staff onboarding workflow with checklist and progress tracking',
      'Leave management — application, approval, and balance tracking',
      'Attendance tracking for staff',
      'Payroll management with tax and deduction configuration',
      'Payslip generation in PDF — auto-emailed to each staff member',
      'Annual and 360-degree performance reviews',
      'Professional development tracker — training, workshops, certifications',
      'Substitute teacher management with auto-suggest on absence',
      'Searchable staff directory by name, department, and role',
      'Disciplinary case management with documentation trail',
    ],
    forTeacher: [
      'Apply for leave from your portal and track approval status in real time',
      'Download payslips directly from the staff dashboard',
      'Complete your self-assessment for performance reviews online',
      'Log professional development activities and certifications',
    ],
    forAdmin: [
      'Run payroll for all staff in minutes — payslips auto-generated and sent',
      'Approve or decline leave requests with one click',
      'Post job vacancies and manage the entire hiring pipeline in one place',
      'Generate HR reports on headcount, leave balances, and payroll costs',
    ],
    metrics: [
      { value: '8 min', label: 'Payroll run time (vs. 3 hours)' },
      { value: '100%', label: 'Digital payslip delivery' },
      { value: 'Auto', label: 'Substitute teacher suggestions' },
    ],
    related: [
      { slug: 'finance', title: 'Finance' },
      { slug: 'analytics', title: 'Analytics & Reporting' },
      { slug: 'communication', title: 'Communication' },
    ],
  },

  ai: {
    title: 'AI & Intelligence',
    tagline: 'Powered by Claude. Built for education.',
    description: 'Tera SM\'s AI layer is built on the Claude API. It understands educational context — not a generic chatbot bolted on. From early dropout detection to smart timetable generation, AI works silently in the background.',
    color: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    capabilities: [
      'AI academic advisor — course recommendations based on GPA, goals, and prerequisites',
      'AI chatbot for 24/7 student and staff FAQ support',
      'Smart timetable generator — conflict-free scheduling with one click',
      'Early warning system — flags dropout risk weeks in advance',
      'Predictive analytics — enrollment, revenue, and pass rate forecasting',
      'Natural language search across the entire platform',
      'AI essay feedback — students improve before teacher review',
      'Attendance pattern anomaly detection',
      'AI grading assistant for objective assignments',
      'Smart substitute teacher suggestions when staff are absent',
    ],
    forStudent: [
      'Ask the AI advisor which courses to take to graduate on time',
      'Get instant essay feedback before submitting to your lecturer',
      'Search for anything on the platform in plain English',
      'Chat with the 24/7 bot for answers on fees, deadlines, and registration',
    ],
    forTeacher: [
      'Let AI grade objective questions automatically — focus on subjective work',
      'Receive alerts when a student\'s attendance pattern suggests they are at risk',
      'Use AI-generated timetable suggestions as a starting point for scheduling',
    ],
    forAdmin: [
      'See the early warning dashboard flagging students at dropout risk',
      'Run the AI timetable generator for a full semester in under a minute',
      'Use predictive enrollment analytics to plan staffing and resources',
    ],
    metrics: [
      { value: '30%', label: 'Fewer student dropouts' },
      { value: '< 1 min', label: 'Timetable generation' },
      { value: 'Claude', label: 'Powered by Anthropic' },
    ],
    related: [
      { slug: 'academics', title: 'Academics' },
      { slug: 'analytics', title: 'Analytics & Reporting' },
      { slug: 'lms', title: 'Learning Management System' },
    ],
  },

  analytics: {
    title: 'Analytics & Reporting',
    tagline: 'Every data point. Every role. One platform.',
    description: 'Role-specific dashboards and a drag-and-drop custom report builder. From enrollment trends to dropout risk flags — Tera SM turns raw school data into actionable insight.',
    color: 'from-lime-500 to-green-600',
    badge: 'bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-400',
    capabilities: [
      'Role-specific dashboards for students, teachers, admins, finance, and HR',
      'Custom report builder — drag-and-drop any data point into a report',
      'Enrollment trends and forecasting with historical comparison',
      'Revenue forecasting and analytics by program, term, and payment method',
      'Teacher performance analytics — pass rates, attendance, engagement',
      'Student pass/fail rate per course and per semester',
      'AI-powered early warning system with dropout risk scoring',
      'Accreditation report auto-generation',
      'Government and ministry compliance report formatting',
      'Data export in PDF, Excel, and CSV',
      'Full audit logs — who did what, when, across the entire platform',
    ],
    forAdmin: [
      'See institution-wide KPIs on the dashboard the moment you log in',
      'Build custom reports on any combination of data — no SQL needed',
      'Export accreditation reports with the correct format for your country',
      'Review the full audit trail of every action taken on the platform',
    ],
    metrics: [
      { value: 'Real-time', label: 'Dashboard updates' },
      { value: 'Auto', label: 'Accreditation report generation' },
      { value: 'PDF/XLS/CSV', label: 'Export formats' },
    ],
    related: [
      { slug: 'academics', title: 'Academics' },
      { slug: 'finance', title: 'Finance' },
      { slug: 'ai', title: 'AI & Intelligence' },
    ],
  },

  communication: {
    title: 'Communication & Engagement',
    tagline: 'Every channel. One platform.',
    description: 'In-app chat, class group chats, broadcast announcements, WhatsApp and SMS integration, and push notifications — all controlled from one communication hub.',
    color: 'from-cyan-500 to-blue-500',
    badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
    capabilities: [
      'In-app direct messaging between any two users on the platform',
      'Class group chats auto-created when a student registers for a course',
      'Department announcement channels — broadcast read-only messages',
      'Admin and school-wide broadcast messages',
      'File and image sharing in all chat types',
      'Message read receipts and searchable chat history',
      'End-to-end encrypted private messages',
      'School social feed with moderated comments',
      'WhatsApp Business API integration for SMS and notification delivery',
      'Africa\'s Talking SMS integration for bulk messaging',
      'Push notifications for mobile and browser',
      'New announcement badges with unread count indicators',
      'Email newsletter builder with segmented sends',
      'Customizable per-user notification preferences',
      'Reminders engine for deadlines, fees, events, and results',
    ],
    forStudent: [
      'Message your lecturer directly from your course page',
      'Join the class group chat automatically when you register for a course',
      'Set your own notification preferences — choose which alerts reach you and how',
      'Never miss a deadline — receive reminder alerts at 7-day, 3-day, and 1-day intervals',
    ],
    forTeacher: [
      'Send an announcement to your entire class in one message',
      'Reply to student questions in the course group chat',
      'Set office hours reminders and send to all students at once',
    ],
    forAdmin: [
      'Broadcast institution-wide alerts via push, SMS, WhatsApp, and email simultaneously',
      'Build and send an email newsletter with the drag-and-drop builder',
      'Monitor message volumes and notification delivery rates',
    ],
    metrics: [
      { value: '5 channels', label: 'Push, SMS, WhatsApp, email, in-app' },
      { value: 'Auto', label: 'Class group chat creation' },
      { value: 'E2E', label: 'Encrypted private messages' },
    ],
    related: [
      { slug: 'student-portal', title: 'Student Portal' },
      { slug: 'parent-portal', title: 'Parent Portal' },
      { slug: 'live-classes', title: 'Live Classes' },
    ],
  },

  'student-portal': {
    title: 'Student Portal',
    tagline: 'Everything a student needs. One login.',
    description: 'A personalised digital home for every student — courses, grades, fees, timetable, messages, and AI support. Available on web and mobile, with offline support for low-connectivity areas.',
    color: 'from-sky-500 to-blue-600',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    capabilities: [
      'Personalised dashboard with quick-access widgets for courses, fees, results, and schedule',
      'Gmail SSO and email/password login with 2FA',
      'Multi-step onboarding wizard with progress checklist',
      'Digital student ID with QR code',
      'Course registration with catalogue browsing, seat display, and clash detection',
      'Add/drop within the deadline window with waitlist enrollment',
      'Semester and cumulative GPA with grade history timeline',
      'Grade appeal submission and status tracking',
      'Official and unofficial transcript download',
      'Email transcript directly to an institution with delivery tracking',
      'Fee payment via card, bank transfer, MoMo, or Orange Money',
      'Full payment history, receipts, and installment schedule',
      'Weekly timetable and exam schedule with room links',
      'One-click Google or Apple Calendar sync',
      'Counseling and mental health appointment booking',
      'Clubs, events, and student life in one portal',
      'Gamification — XP, badges, leaderboards, and attendance streaks',
    ],
    metrics: [
      { value: 'Web + Mobile', label: 'iOS, Android, and PWA' },
      { value: 'Offline', label: 'Works on low bandwidth' },
      { value: '1 login', label: 'For everything' },
    ],
    related: [
      { slug: 'academics', title: 'Academics' },
      { slug: 'finance', title: 'Finance' },
      { slug: 'lms', title: 'LMS' },
    ],
  },

  'parent-portal': {
    title: 'Parent Portal',
    tagline: "Stay connected to your child's academic journey.",
    description: "Real-time visibility into grades, attendance, fees, and messages with teachers — all from a dedicated parent portal accessible on any device.",
    color: 'from-pink-500 to-rose-500',
    badge: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
    capabilities: [
      "Real-time child academic progress — grades, attendance, and results",
      'Fee payment on behalf of child via all supported gateways',
      'Report card and transcript downloads',
      'Direct messaging with teachers and tutors',
      'Parent-teacher appointment booking',
      'Push, SMS, and email alerts for results, fees, and absences',
      'Multiple child support — manage all children from one account',
    ],
    metrics: [
      { value: 'Real-time', label: 'Grade and attendance updates' },
      { value: 'Direct', label: 'Messaging with teachers' },
      { value: 'Multi-child', label: 'Manage all children in one login' },
    ],
    related: [
      { slug: 'communication', title: 'Communication' },
      { slug: 'student-portal', title: 'Student Portal' },
      { slug: 'finance', title: 'Finance' },
    ],
  },

  security: {
    title: 'Security & Compliance',
    tagline: 'Enterprise-grade security built from day one.',
    description: 'RBAC, full audit trails, GDPR compliance tools, IP whitelisting, and automated daily backups. Security is not an add-on — it is built into every layer of the platform.',
    color: 'from-slate-600 to-gray-800',
    badge: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400',
    capabilities: [
      'Role-based access control (RBAC) with granular permission assignment',
      'IP whitelisting for admin portal access',
      'Full audit trail of every platform action — who did what, when',
      'GDPR compliance tools — consent management, data export, right to erasure',
      'Automated daily backups with point-in-time recovery',
      'Data encryption at rest and in transit (AES-256 + TLS 1.3)',
      'Two-factor authentication for staff and admin accounts',
      'Session management and forced logout controls',
      'SOC 2 Type II compliant infrastructure',
    ],
    metrics: [
      { value: '99.9%', label: 'Uptime SLA' },
      { value: 'Daily', label: 'Automated backups' },
      { value: 'AES-256', label: 'Encryption at rest' },
    ],
    related: [
      { slug: 'infrastructure', title: 'SaaS Infrastructure' },
      { slug: 'analytics', title: 'Analytics & Audit Logs' },
    ],
  },

  infrastructure: {
    title: 'SaaS Infrastructure',
    tagline: 'Multi-tenant. Custom-branded. Always on.',
    description: 'True multi-tenant architecture with fully isolated data per school, custom branding per institution, and a REST API for integration with any third-party system.',
    color: 'from-gray-600 to-gray-800',
    badge: 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-400',
    capabilities: [
      'Multi-tenant architecture with fully isolated data per school',
      'Custom branding — logo, colors, and custom domain per institution',
      'Subscription plans with feature flags per tier',
      'Super admin dashboard for platform operators',
      'Open REST API with full documentation and sandbox environment',
      'Webhook support for triggering external systems on platform events',
      'Multi-language support — English, French, Arabic, Swahili, Portuguese',
      'Offline-first PWA mode for low-connectivity environments',
      'Mobile apps for iOS and Android',
      'Tenant-level usage limits — student caps, storage, admin seats',
      '99.9% uptime SLA with status page',
      'Data residency options — choose hosting region per tenant',
    ],
    metrics: [
      { value: '99.9%', label: 'Uptime SLA' },
      { value: '6+', label: 'Languages supported' },
      { value: 'Custom', label: 'Domain per school' },
    ],
    related: [
      { slug: 'security', title: 'Security & Compliance' },
      { slug: 'analytics', title: 'Analytics & Reporting' },
    ],
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return Object.keys(MODULES).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const mod = MODULES[slug]
  if (!mod) return { title: 'Feature — Tera SM' }
  return {
    title: `${mod.title} — Tera SM`,
    description: mod.description,
    openGraph: {
      title: `${mod.title} — Tera SM`,
      description: mod.tagline,
      url: `https://terasms.com/features/${slug}`,
    },
    alternates: { canonical: `https://terasms.com/features/${slug}` },
  }
}

export default async function FeatureDeepDivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mod = MODULES[slug]
  if (!mod) notFound()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Hero ── */}
      <section className={`bg-gradient-to-br ${mod.color} py-20 px-6`}>
        <div className="max-w-4xl mx-auto">
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All features
          </Link>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-4 ${mod.badge}`}>
            Module
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{mod.title}</h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">{mod.tagline}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm shadow-lg"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 border border-white/25 text-white font-semibold rounded-xl hover:bg-white/25 transition-colors text-sm"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Metrics ── */}
      <section className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
          {mod.metrics.map(m => (
            <div key={m.label} className="text-center px-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{m.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Description + Capabilities ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[2fr_3fr] gap-14">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About this module</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{mod.description}</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All capabilities</h2>
            <ul className="space-y-3">
              {mod.capabilities.map(c => (
                <li key={c} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      {(mod.forStudent || mod.forTeacher || mod.forAdmin) && (
        <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-10 text-center">Who it is for</h2>
            <div className={`grid gap-6 ${[mod.forStudent, mod.forTeacher, mod.forAdmin].filter(Boolean).length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {mod.forStudent && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-4">
                    <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">For Students</h3>
                  <ul className="space-y-2">
                    {mod.forStudent.map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {mod.forTeacher && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">For Teachers</h3>
                  <ul className="space-y-2">
                    {mod.forTeacher.map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-2" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {mod.forAdmin && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">For Admins</h3>
                  <ul className="space-y-2">
                    {mod.forAdmin.map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0 mt-2" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Related modules ── */}
      <section className="py-20 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Related modules</h2>
          <div className="flex flex-wrap gap-3">
            {mod.related.map(r => (
              <Link
                key={r.slug}
                href={`/features/${r.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              >
                {r.title} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
            <Link
              href="/features"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-300 transition-all"
            >
              View all 19 modules
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">See {mod.title} in action</h2>
          <p className="text-blue-100 mb-8">Book a live demo and we will walk through this module with your institution in mind.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm shadow-lg"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
