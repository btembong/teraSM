import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight, ArrowLeft, CheckCircle2, Users, GraduationCap, Shield,
  CreditCard, BookOpen, Video, UserCog, Brain, BarChart2,
  MessageSquare, Heart, Globe, ChevronDown, Check, Minus,
  ClipboardList, Calendar, Vote, Library, Briefcase, Building2,
} from 'lucide-react'
import { StickyNav } from './sticky-nav'
import { AnimatedHeroIcon } from './animated-hero-icon'
import { AnimatedCapabilities } from './animated-capabilities'

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  auth:             Shield,
  admissions:       ClipboardList,
  academics:        GraduationCap,
  finance:          CreditCard,
  lms:              BookOpen,
  'live-classes':   Video,
  hr:               UserCog,
  ai:               Brain,
  analytics:        BarChart2,
  communication:    MessageSquare,
  'student-portal': Users,
  'parent-portal':  Heart,
  'student-life':   Calendar,
  elections:        Vote,
  library:          Library,
  career:           Briefcase,
  operations:       Building2,
  security:         Shield,
  infrastructure:   Globe,
}

// ─── Module order (for Next module nav) ──────────────────────────────────────

const MODULE_ORDER = [
  'auth', 'admissions', 'academics', 'finance', 'lms', 'live-classes',
  'hr', 'ai', 'analytics', 'communication', 'student-portal', 'parent-portal',
  'student-life', 'elections', 'library', 'career', 'operations',
  'security', 'infrastructure',
]

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanKey = 'starter' | 'pro' | 'enterprise' | 'university'

interface Module {
  title: string
  tagline: string
  description: string
  color: string          // hero gradient
  ctaColor: string       // CTA section gradient
  badge: string          // category pill
  plan: string           // min plan label
  planColor: string      // plan badge color
  metrics: { value: string; label: string }[]
  capabilityGroups: { heading: string; items: string[] }[]
  howItWorks: { step: string; title: string; desc: string }[]
  testimonial?: { quote: string; author: string; role: string; school: string; country: string; metric: string }
  forStudent?: string[]
  forTeacher?: string[]
  forAdmin?: string[]
  planFeatures: { feature: string; starter: boolean | string; pro: boolean | string; enterprise: boolean | string; university: boolean | string }[]
  faq: { q: string; a: string }[]
  related: { slug: string; title: string; desc: string }[]
}

// ─── Module data ──────────────────────────────────────────────────────────────

const MODULES: Record<string, Module> = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    title: 'Onboarding & Authentication',
    tagline: 'Secure, seamless access for every role — from first login to full setup.',
    description: 'Gmail SSO, email/password login, 2FA for staff and admin, multi-step onboarding wizard with progress bar, and RBAC with granular permissions.',
    color: 'from-slate-600 to-slate-800',
    ctaColor: 'from-slate-700 to-slate-900',
    badge: 'Identity & Access',
    plan: 'All Plans',
    planColor: 'bg-slate-600',
    metrics: [
      { value: '< 30s', label: 'Average login time' },
      { value: '2FA', label: 'Multi-factor auth' },
      { value: '9', label: 'User roles supported' },
    ],
    capabilityGroups: [
      {
        heading: 'Authentication',
        items: [
          'Gmail / Google OAuth SSO login',
          'Email + password credentials login',
          'Two-factor authentication (2FA) for staff and admin',
          'Institutional SSO via Google or Microsoft',
          'Secure session management with refresh tokens',
          'IP whitelisting for admin portal access',
        ],
      },
      {
        heading: 'Onboarding',
        items: [
          'Multi-step profile setup wizard with progress bar',
          'Document upload (ID, photos) on first login',
          'Acceptance letter download after admission',
          'Welcome video from Dean/Principal (auto-plays first login)',
          'Onboarding checklist showing % completion',
          'Personalized dashboard populated on first login',
        ],
      },
      {
        heading: 'Access Control',
        items: [
          'Role-based access control (RBAC) with granular permissions',
          'Custom roles and permission sets per school',
          'Per-module feature flags per subscription tier',
          'Audit log of all login and access events',
          'Admin-initiated password reset and account lock',
          'Auto-logout after inactivity timeout',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Sign in', desc: 'Users log in with Google SSO or email/password — no separate app install required.' },
      { step: '02', title: 'Verify identity', desc: 'Staff and admins complete 2FA via authenticator app or SMS code.' },
      { step: '03', title: 'Complete onboarding', desc: 'New users follow a guided wizard: upload documents, set profile, select courses.' },
      { step: '04', title: 'Access your portal', desc: 'Role-based redirect sends each user to their correct portal with the right permissions.' },
    ],
    testimonial: {
      quote: 'Our staff were up and running in minutes. The Google SSO meant zero friction — they just clicked and were in.',
      author: 'Kwame Asante',
      role: 'IT Administrator',
      school: 'Accra Business College',
      country: 'Ghana',
      metric: '100% SSO adoption in first week',
    },
    forStudent: [
      'Sign in with existing Google account — no new password needed',
      'Guided onboarding checklist after first login',
      'Upload ID and photo documents during setup',
      'Welcome video from your Dean on first login',
    ],
    forTeacher: [
      'Two-factor authentication for account security',
      'Access teaching tools immediately after login',
      'Institutional SSO works with existing school email',
      'Audit trail of your own login activity',
    ],
    forAdmin: [
      'Assign roles and permissions per user or group',
      'Configure 2FA requirements per role',
      'IP whitelist admin access for extra security',
      'View full login and access audit logs',
    ],
    planFeatures: [
      { feature: 'Email + password login',     starter: true,         pro: true,         enterprise: true,      university: true },
      { feature: 'Gmail SSO',                  starter: true,         pro: true,         enterprise: true,      university: true },
      { feature: '2FA (staff & admin)',         starter: true,         pro: true,         enterprise: true,      university: true },
      { feature: 'Onboarding wizard',          starter: true,         pro: true,         enterprise: true,      university: true },
      { feature: 'RBAC permissions',           starter: 'Basic',      pro: 'Advanced',   enterprise: 'Custom',  university: 'Custom' },
      { feature: 'Institutional SSO',          starter: false,        pro: false,        enterprise: true,      university: true },
      { feature: 'IP whitelisting',            starter: false,        pro: false,        enterprise: true,      university: true },
      { feature: 'Audit log retention',        starter: '30 days',    pro: '90 days',    enterprise: '1 year',  university: 'Unlimited' },
    ],
    faq: [
      { q: 'Can students sign in with their personal Gmail?', a: 'Yes — any Google account works for students. You can optionally restrict login to your school domain for staff and admins.' },
      { q: 'Is 2FA mandatory?', a: 'You choose which roles require 2FA. We recommend enforcing it for admin and finance roles by default.' },
      { q: 'What happens if a student forgets their password?', a: 'A self-service "Forgot password" flow sends a secure reset link to their registered email.' },
      { q: 'Can I migrate existing user accounts?', a: 'Yes — we support bulk CSV import of existing users. Imported users receive a welcome email to set up their credentials.' },
    ],
    related: [
      { slug: 'security', title: 'Security', desc: 'RBAC, audit trail, GDPR compliance' },
      { slug: 'student-portal', title: 'Student Portal', desc: 'Post-login student experience' },
      { slug: 'admissions', title: 'Admissions', desc: 'Application and registration workflow' },
    ],
  },

  // ── Admissions ────────────────────────────────────────────────────────────
  admissions: {
    title: 'Admissions & Registration',
    tagline: 'From first application to enrolled student — fully digital, zero paperwork.',
    description: 'Online application portal, application tracking, admission letter generation, course registration with prerequisite validation, clash detection, and waitlists.',
    color: 'from-blue-600 to-blue-800',
    ctaColor: 'from-blue-700 to-blue-900',
    badge: 'Admissions',
    plan: 'Starter',
    planColor: 'bg-blue-600',
    metrics: [
      { value: '100%', label: 'Digital application process' },
      { value: '< 5 min', label: 'Application form completion' },
      { value: 'Auto', label: 'Clash detection on registration' },
    ],
    capabilityGroups: [
      {
        heading: 'Online Applications',
        items: [
          'Public-facing application portal for prospective students',
          'Multi-step application form with document upload (ID, photos, certificates)',
          'Application status tracking (submitted → under review → accepted/rejected)',
          'Automated acknowledgement email on submission',
          'Document verification workflow for registrar review',
          'Admission letter generation as downloadable PDF',
        ],
      },
      {
        heading: 'Course Registration',
        items: [
          'Browse course catalog with filters (department, level, semester, credits, time slot)',
          'Seat availability display per course section',
          'Section and time slot selection during registration',
          'Prerequisite validation (blocks registration if requirements unmet)',
          'Clash detection with warnings before confirming registration',
          'Add/drop period management with deadline enforcement',
        ],
      },
      {
        heading: 'Waitlists & Credit Transfer',
        items: [
          'Waitlist enrollment when a course section is full',
          'Automatic notification when a waitlist spot opens',
          'Credit transfer management from other institutions',
          'Fee clearance gate (registration blocked until payment cleared)',
          'Registration confirmation PDF download',
          'Registrar override and manual enrollment tools',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Apply online', desc: 'Prospective students fill in the application form and upload required documents from any device.' },
      { step: '02', title: 'Review & admit', desc: 'Registrar reviews documents, updates status, and generates the admission letter with one click.' },
      { step: '03', title: 'Pay & register', desc: 'Student pays fees online then accesses course registration — prerequisite and clash checks happen automatically.' },
      { step: '04', title: 'Get confirmation', desc: 'Registration confirmation PDF is generated and the student is fully enrolled with timetable and portal access.' },
    ],
    testimonial: {
      quote: 'We eliminated our entire paper-based application process. Applications went up 40% because students could apply from their phones.',
      author: 'Dr. Amara Diallo',
      role: 'Registrar',
      school: 'West African University',
      country: 'Senegal',
      metric: '40% increase in applications',
    },
    forStudent: [
      'Apply from any device — no printing or in-person visits',
      'Track your application status in real time',
      'Download your admission letter as a PDF',
      'Register for courses with clash and prerequisite checks',
    ],
    forTeacher: [
      'View your class roster as enrollment happens',
      'See seat availability for your course sections',
      'Receive notification when your class fills or waitlist opens',
    ],
    forAdmin: [
      'Manage applications and update status with one click',
      'Generate admission letters in bulk',
      'Set add/drop deadlines and prerequisite rules',
      'View enrollment numbers and waitlists per course',
    ],
    planFeatures: [
      { feature: 'Online application portal',     starter: true,   pro: true,   enterprise: true,   university: true },
      { feature: 'Application status tracking',   starter: true,   pro: true,   enterprise: true,   university: true },
      { feature: 'Admission letter PDF',          starter: true,   pro: true,   enterprise: true,   university: true },
      { feature: 'Course registration',           starter: true,   pro: true,   enterprise: true,   university: true },
      { feature: 'Clash + prerequisite checks',   starter: true,   pro: true,   enterprise: true,   university: true },
      { feature: 'Waitlist management',           starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Credit transfer management',    starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Document verification workflow',starter: false,  pro: true,   enterprise: true,   university: true },
    ],
    faq: [
      { q: 'Can students apply without creating an account first?', a: 'Yes — the application portal is public-facing. An account is only created upon acceptance.' },
      { q: 'How does clash detection work?', a: 'When a student selects a course, the system compares it against already-registered slots and flags any time conflicts before confirming.' },
      { q: 'Can the registrar manually enroll a student in a full course?', a: 'Yes — admins have an override option to manually add a student to any course regardless of seat availability.' },
      { q: 'Is course registration gated by fee payment?', a: 'Yes — the fee clearance gate is configurable. You can require full payment, partial payment, or waive it per student.' },
    ],
    related: [
      { slug: 'academics', title: 'Academics', desc: 'Timetable, attendance, and grading' },
      { slug: 'finance', title: 'Finance', desc: 'Fee clearance and payment integration' },
      { slug: 'auth', title: 'Authentication', desc: 'Student login and onboarding flow' },
    ],
  },


  academics: {
    title: 'Academics',
    tagline: 'From registration to transcript — fully digital.',
    description: 'Replace every paper-based academic process with a unified digital workflow. Course registration, timetable generation, grade entry, and transcript issuance — all connected, all auditable.',
    color: 'from-indigo-500 to-blue-600',
    ctaColor: 'from-indigo-600 to-blue-700',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
    plan: 'Starter',
    planColor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    metrics: [
      { value: '100%', label: 'Clash-free timetables' },
      { value: '80%', label: 'Less admin time on records' },
      { value: '< 1 min', label: 'Transcript generation' },
    ],
    capabilityGroups: [
      {
        heading: 'Scheduling & Calendar',
        items: [
          'Academic calendar management — terms, semesters, holidays, and deadlines',
          'AI-assisted timetable generator — conflict-free scheduling in minutes',
          'Timetable viewer per student, per teacher, and per class',
          'Exam timetable with room, venue, and invigilator assignment',
          'One-click sync to Google Calendar or Apple Calendar',
          'Class cancellation alerts with instant push notification',
        ],
      },
      {
        heading: 'Course Registration',
        items: [
          'Course registration with prerequisite validation and clash detection',
          'Seat availability display per section before confirming',
          'Add/drop period with deadline enforcement',
          'Waitlist enrollment with automatic notification on seat opening',
          'Credit transfer management from other institutions',
          'Registration confirmation PDF download',
        ],
      },
      {
        heading: 'Grading & Results',
        items: [
          'Grade entry with per-course CA and exam score breakdown',
          'GPA and CGPA calculator with what-if scenario tool',
          'Progress toward degree completion as percentage of credits earned',
          'Results publication with controlled release per course',
          'Supplementary and resit exam results tracking',
          'Online proctored exams with webcam monitoring and browser lockdown',
          'Question bank for reusable exam paper generation',
        ],
      },
      {
        heading: 'Transcripts & Certificates',
        items: [
          'Official transcript with watermark and document authentication QR code',
          'Unofficial quick transcript — instant download, no request needed',
          'Email transcript directly to an institution with delivery tracking',
          'Certificate generator — enrollment, completion, and degree',
          'Academic appeals workflow for grade disputes',
          'Honor roll and academic distinction tracking',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Configure your academic structure', desc: 'Set up faculties, departments, programs, courses, and semesters. The AI timetable generator uses this structure to produce conflict-free schedules.' },
      { step: '02', title: 'Students register for courses', desc: 'Students browse the course catalogue, see seat availability, and register — with automatic prerequisite checks and clash detection before confirming.' },
      { step: '03', title: 'Staff record grades', desc: 'Lecturers enter CA and exam scores via a clean grade sheet. GPA and CGPA are calculated automatically. Results are held until the admin releases them.' },
      { step: '04', title: 'Transcripts generated instantly', desc: 'Students download their official transcript in seconds — watermarked, sealed, and containing a QR code that any institution can scan to verify authenticity.' },
    ],
    testimonial: {
      quote: "Setting up the timetable for 1,200 students across 6 departments used to take two weeks. Tera SM's AI generator produced a conflict-free draft in under 3 minutes. We spent the rest of the week reviewing it, not building it.",
      author: 'Prof. Kwabena Mensah',
      role: 'Registrar',
      school: 'Central University',
      country: 'Ghana',
      metric: '3 min timetable vs. 2 weeks manually',
    },
    forStudent: [
      'Browse the full course catalogue and register with clash detection before confirming',
      'Track your GPA each semester and simulate future scenarios with the what-if calculator',
      'Download your official transcript instantly — or email it directly to any institution',
      'Access your weekly timetable and exam schedule with room links',
    ],
    forTeacher: [
      'Enter CA and exam grades via a clean grade sheet — totals calculated automatically',
      'Mark attendance in one tap or let the system auto-mark on live class join',
      'View your own timetable and get instant alerts on cancellations or room changes',
    ],
    forAdmin: [
      'Configure academic years, semesters, faculties, departments, programs, and courses',
      'Run the AI timetable generator and approve or adjust the conflict-free output',
      'Publish results for all courses in one action with a configurable release date',
      'Generate and download official transcripts or certificates for any student',
    ],
    planFeatures: [
      { feature: 'Grade entry & GPA calculator',   starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'AI timetable generator',          starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Online proctored exams',          starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Thesis submission portal',        starter: false, pro: false, enterprise: false, university: true },
      { feature: 'Accreditation report export',     starter: false, pro: false, enterprise: true,  university: true },
    ],
    faq: [
      { q: 'Does the timetable generator handle multi-campus scheduling?', a: 'Yes. The AI generator is aware of room locations, staff assignments, and campus-level constraints. Enterprise and University plans support multi-campus scheduling from a single admin panel.' },
      { q: 'Can students register on mobile?', a: 'Yes. The student portal is a Progressive Web App (PWA) and the course registration flow is fully optimised for mobile screens, including the clash detection and waitlist enrollment.' },
      { q: 'How are transcripts authenticated?', a: 'Every Tera SM transcript includes a unique QR code that links to a verification page. Any institution receiving the transcript can scan it and see the verified data — preventing forgery without needing a phone call.' },
      { q: 'Can we configure our own grading scale?', a: 'Yes. Admins can set custom grade boundaries per academic year (e.g., A = 70+, B = 60+) from the Academic Settings panel. Changes apply to new grade entries going forward.' },
    ],
    related: [
      { slug: 'lms', title: 'LMS', desc: 'Course content, assignments, and AI grading' },
      { slug: 'analytics', title: 'Analytics', desc: 'Pass rates, GPA trends, and dropout risk' },
      { slug: 'ai', title: 'AI & Intelligence', desc: 'Smart timetable generation and early warning' },
    ],
  },

  finance: {
    title: 'Finance',
    tagline: 'Collect fees on time. Every time.',
    description: 'End the spreadsheet chaos and WhatsApp fee chasing. Automated invoicing, multi-gateway payments, scholarship management, and real-time revenue dashboards — all in one place.',
    color: 'from-green-500 to-emerald-600',
    ctaColor: 'from-green-600 to-emerald-700',
    badge: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    plan: 'Starter',
    planColor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    metrics: [
      { value: '94%', label: 'Average collection rate on Tera SM' },
      { value: '+27pp', label: 'Typical first-semester lift' },
      { value: '5', label: 'Payment gateways supported' },
    ],
    capabilityGroups: [
      {
        heading: 'Invoicing & Fee Setup',
        items: [
          'Fee structure configuration per program, level, semester, and course',
          'Student fee invoicing with itemized breakdowns auto-generated at semester start',
          'Installment and payment plan management with per-student schedules',
          'Automated late fee engine with configurable penalty rules and grace periods',
          'Fee deadline reminders at 7-day, 3-day, and 1-day intervals',
          'Outstanding balance overview with aging breakdown by class',
        ],
      },
      {
        heading: 'Payments & Gateways',
        items: [
          'Paystack integration — card, bank transfer, USSD (Nigeria, Ghana, Kenya)',
          'Flutterwave integration — card, MoMo, M-Pesa (broader Africa)',
          'Stripe integration — international card payments',
          'MTN Mobile Money — direct wallet payment link via SMS',
          'Orange Money — Cameroon, Senegal, Côte d\'Ivoire',
          'Payment receipt and invoice PDF download per transaction',
        ],
      },
      {
        heading: 'Scholarships & Financial Aid',
        items: [
          'Scholarship and bursary management — define, apply, approve, and auto-deduct',
          'Financial aid application and review workflow with document upload',
          'Scholarship status visible to students — approved amount and balance remaining',
          'Partial scholarship with automatic net invoice generation',
          'Refund request submission and processing workflow',
        ],
      },
      {
        heading: 'Reports & Reconciliation',
        items: [
          'Real-time revenue dashboard by program, term, campus, and payment method',
          'Bank reconciliation tools — match deposits with platform records',
          'Student debt aging reports',
          'Departmental budget management and tracking',
          'Financial report export in PDF, Excel, and CSV',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Configure your fee structures', desc: 'Set tuition, boarding, exam, and activity fees per program, class, and semester. One-time setup. Tera SM remembers it for every subsequent intake.' },
      { step: '02', title: 'Invoices generated automatically', desc: 'At the start of each semester, invoices are created for every enrolled student and sent via SMS, email, and push notification — with a direct payment link.' },
      { step: '03', title: 'Parents pay in under 2 minutes', desc: 'Via card, MoMo, Orange Money, or bank transfer. The payment link works on any phone. Receipts are generated and emailed instantly.' },
      { step: '04', title: 'Dashboard updates in real time', desc: 'Your collection rate, outstanding balances, and revenue breakdown update the moment a payment is confirmed — no manual reconciliation needed.' },
    ],
    testimonial: {
      quote: "Before Tera SM, our bursar spent 3–4 hours every day reconciling payments manually. By week 6 of our first semester on the platform, we had collected 94% of fees — up from 67% the previous term. The MoMo integration was the game changer.",
      author: 'Mr. Celestin Nkemdirim',
      role: 'Bursar',
      school: 'Greenfield Academy',
      country: 'Cameroon',
      metric: '67% → 94% collection in one term',
    },
    forStudent: [
      'See your outstanding balance and full fee breakdown on your dashboard',
      'Pay via card, bank transfer, MoMo, or Orange Money in under 2 minutes',
      'Enroll in an installment plan and track your full payment schedule',
      'Download receipts and invoices for every transaction',
      'Check scholarship status — approved amount and remaining balance',
    ],
    forAdmin: [
      'Configure fee structures per program and semester from Finance Settings',
      'Monitor real-time collection rates by class and program on one dashboard',
      'Approve scholarship and financial aid applications with one click',
      'Export revenue reports for any date range in PDF, Excel, or CSV',
      'Run the reconciliation tool to match bank deposits with platform records',
    ],
    planFeatures: [
      { feature: 'Fee invoicing & online payments',   starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'MoMo & Orange Money',               starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'Installment plans',                  starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'Scholarship management',             starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Revenue analytics & custom reports', starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Bank reconciliation tools',          starter: false, pro: false, enterprise: true,  university: true },
    ],
    faq: [
      { q: 'Which payment gateways are available in my country?', a: 'Paystack covers Nigeria, Ghana, Kenya, and South Africa. Flutterwave covers a broader range including Cameroon, Uganda, Tanzania, Rwanda, and more. Stripe handles international cards. Your school selects the gateway at setup — all three can run in parallel.' },
      { q: 'Can students set up their own installment plans?', a: 'Students can select from installment options that you pre-configure (e.g., 50% upfront, 25% at week 4, 25% at week 8). Admins can also create custom plans for individual students directly from the finance dashboard.' },
      { q: 'How does the MTN MoMo integration work?', a: 'When a student or parent clicks the payment link in their invoice SMS or email, they are redirected to an MTN MoMo payment prompt on their phone. No account number to copy or reference code to remember. Funds settle to your school bank account within T+1.' },
      { q: 'Does the system handle multi-currency schools?', a: 'Yes. Each school configures its primary currency (XAF, NGN, GHS, KES, USD, etc.). Stripe handles international currency conversion for diaspora or international student payments.' },
    ],
    related: [
      { slug: 'academics', title: 'Academics', desc: 'Gate course registration to fee clearance' },
      { slug: 'analytics', title: 'Analytics', desc: 'Revenue forecasting and collection dashboards' },
      { slug: 'student-portal', title: 'Student Portal', desc: 'Student-facing fee payment and receipts' },
    ],
  },

  lms: {
    title: 'Learning Management System',
    tagline: 'Teach, assign, and grade — all in one place.',
    description: "A full-featured LMS purpose-built for African institutions. Upload course content, run assignments with AI grading, detect plagiarism, and track every student's progress — without any third-party tools.",
    color: 'from-violet-500 to-purple-600',
    ctaColor: 'from-violet-600 to-purple-700',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    plan: 'Pro',
    planColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    metrics: [
      { value: '40%', label: 'Less time on grading' },
      { value: 'Offline', label: 'PWA support for low bandwidth' },
      { value: 'Built-in', label: 'No Moodle or Canvas needed' },
    ],
    capabilityGroups: [
      {
        heading: 'Content Management',
        items: [
          'Upload slides, PDFs, videos, and external links per course module',
          'Drag-and-drop module ordering and content organisation',
          'SCORM and xAPI support for third-party eLearning packages',
          'Interactive content with H5P — quizzes, drag-and-drop, and flashcards',
          'Video lesson creator — record, upload, and annotate in-platform',
          'Offline content download for low-connectivity environments (PWA)',
          'Adaptive learning paths that adjust content based on student performance',
        ],
      },
      {
        heading: 'Assignments & Grading',
        items: [
          'Assignments with file submission, deadlines, and configurable late penalties',
          'Peer review assignments with student rubrics',
          'AI grading assistant — auto-score objective questions and generate essay feedback',
          'Plagiarism detection with document similarity scoring',
          'Grade return with inline comments to students',
          'Assignment analytics — submission rate, average score, and grade distribution',
        ],
      },
      {
        heading: 'Student Engagement',
        items: [
          'Discussion forums per course with threaded conversations per topic',
          'Visual progress tracker — completion percentage per student per course',
          'Course prerequisite enforcement before content unlock',
          'Micro-credentials and digital badge issuance on completion',
          'Gamification — XP points, leaderboards, and completion streaks',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Upload and organise course content', desc: 'Drag slides, PDFs, and videos into course modules. Set release dates so content unlocks progressively as students advance through the module.' },
      { step: '02', title: 'Students access materials', desc: 'All content available on web and mobile. Students can download for offline use on low-bandwidth connections. Progress is tracked automatically.' },
      { step: '03', title: 'Assignments submitted and graded', desc: 'Students submit before the deadline. AI auto-scores objective questions. Essay submissions receive AI feedback before the lecturer reviews them.' },
      { step: '04', title: 'Results returned with feedback', desc: 'Grades and comments are returned to students in the portal. The plagiarism score is visible to staff before finalising. Analytics show the full grade distribution.' },
    ],
    testimonial: {
      quote: "We replaced Moodle with Tera SM's LMS and saved $14,000 in annual licensing. Our lecturers spent a week migrating content — then noticed the AI grading assistant handles about 40% of their marking load automatically.",
      author: 'Dr. Ngozi Okoye',
      role: 'Vice Chancellor (Academic)',
      school: 'Landmark University',
      country: 'Nigeria',
      metric: '$14,000 saved + 40% less marking time',
    },
    forStudent: [
      'Access all course materials in one organised place — slides, videos, and readings',
      'Submit assignments before the deadline and track your submission status live',
      'Receive AI feedback on your essay before the lecturer reviews it',
      'See your progress through each course as a visual completion percentage',
      'Download content for offline use when you have limited connectivity',
    ],
    forTeacher: [
      'Upload and organise course content in drag-and-drop modules',
      'Create assignments with rubrics, submission types, and late penalty rules',
      'Use the AI grading assistant to speed up objective marking',
      'Review plagiarism similarity scores before finalising grades',
      'See at-a-glance which students are behind on progress or missing submissions',
    ],
    forAdmin: [
      'Monitor LMS adoption and content completion rates across all courses',
      'Configure plagiarism detection sensitivity thresholds institution-wide',
      'Enable or disable specific LMS features per department or plan tier',
    ],
    planFeatures: [
      { feature: 'Course content upload & access',      starter: false, pro: true, enterprise: true, university: true },
      { feature: 'Assignments & grading',               starter: false, pro: true, enterprise: true, university: true },
      { feature: 'AI grading assistant',                starter: false, pro: false, enterprise: true, university: true },
      { feature: 'Plagiarism detection',                starter: false, pro: true, enterprise: true, university: true },
      { feature: 'SCORM / xAPI support',                starter: false, pro: true, enterprise: true, university: true },
      { feature: 'Adaptive learning paths',             starter: false, pro: false, enterprise: true, university: true },
    ],
    faq: [
      { q: 'Do we need to replace our existing Moodle content?', a: 'SCORM packages exported from Moodle can be imported directly into Tera SM LMS. For non-SCORM content (PDFs, videos), our onboarding team provides a migration guide. Most institutions complete the move in 1–2 weeks.' },
      { q: 'How does offline content work for students?', a: 'The student portal is a Progressive Web App (PWA). Students tap "Download for offline" on any module and it is cached locally. They can read PDFs, watch videos, and review materials without an internet connection. Submissions sync automatically when connectivity returns.' },
      { q: 'How accurate is the AI plagiarism detection?', a: 'The similarity engine compares submissions against a database of web content, academic papers, and previous submissions within your institution. Admins set the flagging threshold (e.g., flag anything above 30% similarity). The system shows the specific matched passages so lecturers can judge in context.' },
      { q: 'Can students submit video or audio assignments?', a: 'Yes. Assignments can accept any file type — PDF, Word, video (.mp4, .mov), audio (.mp3), or ZIP archives. Maximum file size per submission is 500MB on Pro and unlimited on Enterprise and University plans.' },
    ],
    related: [
      { slug: 'live-classes', title: 'Live Classes', desc: 'WebRTC video classes linked to LMS courses' },
      { slug: 'academics', title: 'Academics', desc: 'Grade entry and result publication' },
      { slug: 'ai', title: 'AI & Intelligence', desc: 'AI grading, essay feedback, and early warning' },
    ],
  },

  'live-classes': {
    title: 'Live Classes',
    tagline: 'Built-in video conferencing. No Zoom subscription needed.',
    description: 'Full WebRTC video conferencing built directly into Tera SM. Breakout rooms, auto-recording, virtual whiteboard, and attendance auto-mark — all linked to your course and calendar.',
    color: 'from-purple-500 to-pink-600',
    ctaColor: 'from-purple-600 to-pink-700',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    plan: 'Pro',
    planColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    metrics: [
      { value: '$0', label: 'Per-minute cost vs. Zoom' },
      { value: 'Auto', label: 'Attendance marking on join' },
      { value: 'Unlimited', label: 'Recording storage on Enterprise+' },
    ],
    capabilityGroups: [
      {
        heading: 'Video Conferencing',
        items: [
          'Built-in WebRTC video conferencing — no external subscription required',
          'Works in any browser — no app download for students',
          'Adaptive bitrate streaming — optimised for low-bandwidth African networks',
          'Screen sharing for presentations, demos, and code walkthroughs',
          'Breakout rooms — split into groups mid-session and pull everyone back',
          'Up to 500 concurrent participants on Enterprise and University plans',
        ],
      },
      {
        heading: 'Engagement Tools',
        items: [
          'Virtual collaborative whiteboard for diagrams and problem-solving',
          'Live polls and Q&A during class — results visible to all',
          'Hand raise queue — students signal to speak without interrupting',
          'Emoji reactions — quick non-verbal feedback from students',
          'Chat panel alongside video for text-based questions',
        ],
      },
      {
        heading: 'Recordings & Replay',
        items: [
          'Auto-recording — every session recorded automatically when enabled',
          'Cloud storage with replay linked directly to the course page in LMS',
          'Recording access restricted to enrolled students only',
          'Download recording available to staff for editing or archiving',
          'Automatic transcript generation for recorded sessions (Enterprise+)',
        ],
      },
      {
        heading: 'Scheduling & Attendance',
        items: [
          'Schedule a live class and it appears on every enrolled student\'s timetable',
          'Attendance auto-marked the moment a student joins the session',
          'Class cancellation alert with instant push notification to all students',
          'Scheduled class reminders at 24-hour and 15-minute intervals',
          'Per-session attendance reports available immediately after class ends',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Schedule the class', desc: 'Create a live class from the staff portal. It appears on every enrolled student\'s timetable automatically — no Zoom link to share, no calendar invite to send.' },
      { step: '02', title: 'Students join from browser or app', desc: 'Students click "Join class" from their timetable or get a reminder push notification 15 minutes before. No app download required — works in any browser.' },
      { step: '03', title: 'Run an interactive session', desc: 'Launch the whiteboard, run a live poll, split into breakout rooms, or share your screen. Attendance is marked automatically the moment each student joins.' },
      { step: '04', title: 'Recording saved to the course', desc: 'The session recording is available on the course page within minutes of the class ending. Students who missed it can catch up — access restricted to enrolled students.' },
    ],
    testimonial: {
      quote: "We were paying $400/month for Zoom Pro licenses across our departments. Tera SM's live classes are built in — no separate subscription, recordings link automatically to course pages, and attendance marks itself. We cancelled Zoom on day 30.",
      author: 'Mr. Samuel Abara',
      role: 'Head of IT',
      school: 'Covenant Polytechnic',
      country: 'Nigeria',
      metric: '$4,800/year saved on Zoom licenses',
    },
    forStudent: [
      'Join from any browser — no software download needed',
      'Raise your hand, react, or ask questions without interrupting the session',
      'Access recordings after class directly from your course page',
      'Attendance is marked automatically the moment you join',
    ],
    forTeacher: [
      'Schedule a class and it appears on every student\'s timetable automatically',
      'Launch breakout rooms mid-session with one click',
      'Start the whiteboard for collaborative diagrams and problem-solving',
      'Run a live poll mid-lecture to check understanding in real time',
    ],
    forAdmin: [
      'Monitor all active live classes across departments in real time',
      'Configure recording storage limits per plan tier',
      'View per-class attendance reports automatically populated from each session',
    ],
    planFeatures: [
      { feature: 'Live classes (basic)',               starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Breakout rooms',                     starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Auto-recording & cloud storage',     starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Session transcription',              starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Up to 500 participants',             starter: false, pro: false, enterprise: true,  university: true },
    ],
    faq: [
      { q: 'Does it work on 3G connections?', a: 'Yes. Tera SM uses a Selective Forwarding Unit (SFU) architecture via LiveKit, which adapts the video stream quality based on each participant\'s available bandwidth. Students on 3G receive a lower-resolution stream without dropping out of the session entirely.' },
      { q: 'How many students can join a single live class?', a: 'Pro plan supports up to 100 concurrent participants per session. Enterprise and University plans support up to 500. For large university lectures above that, contact us — we can configure higher limits on dedicated infrastructure.' },
      { q: 'How long are recordings stored?', a: 'Pro plan: 90 days. Enterprise: 1 year. University: unlimited. Admins can download and archive any recording before the retention limit. Recordings are stored on Cloudflare R2 — no per-GB egress fees.' },
      { q: 'Can we embed a YouTube or external stream instead?', a: 'Yes. Teachers can share their screen (which shows any video or external stream) or paste an embed URL into the class page for events like guest lectures or live external broadcasts.' },
    ],
    related: [
      { slug: 'lms', title: 'LMS', desc: 'Recordings link directly to course pages' },
      { slug: 'academics', title: 'Academics', desc: 'Timetable and class scheduling' },
      { slug: 'communication', title: 'Communication', desc: 'Class group chats and announcements' },
    ],
  },

  hr: {
    title: 'HR Management',
    tagline: 'From recruitment to payslips — one system.',
    description: 'Manage the complete employee lifecycle for teachers, admin, and support staff. Recruitment pipelines, contract storage, payroll calculation, and 360-degree reviews — all built in.',
    color: 'from-teal-500 to-cyan-600',
    ctaColor: 'from-teal-600 to-cyan-700',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
    plan: 'Pro',
    planColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    metrics: [
      { value: '8 min', label: 'Payroll run vs. 3 hours manually' },
      { value: '100%', label: 'Digital payslip delivery' },
      { value: 'Auto', label: 'Substitute teacher suggestions' },
    ],
    capabilityGroups: [
      {
        heading: 'Employee Records & Onboarding',
        items: [
          'Employee records for all staff types — teachers, admin, and support',
          'Contract management with document storage and renewal deadline alerts',
          'Staff onboarding workflow with customisable checklist and progress tracking',
          'Searchable staff directory by name, department, role, and status',
          'Professional development tracker — training, workshops, and certifications',
        ],
      },
      {
        heading: 'Recruitment',
        items: [
          'Job postings published to the careers page and external boards',
          'Applicant tracking — submitted, shortlisted, interviewed, offered, hired',
          'Interview scheduling with calendar integration',
          'Offer letter generation and digital acceptance',
          'Onboarding triggered automatically on hire confirmation',
        ],
      },
      {
        heading: 'Leave & Attendance',
        items: [
          'Leave application and approval workflow with balance tracking',
          'Multiple leave types — annual, sick, maternity, study, and unpaid',
          'Staff attendance tracking linked to timetable and live class joins',
          'Substitute teacher management — auto-suggest available cover when a teacher is absent',
          'Leave calendar visible to department heads for planning',
        ],
      },
      {
        heading: 'Payroll & Reviews',
        items: [
          'Payroll configuration — base salary, allowances, deductions, and tax rules',
          'Payroll calculation and payslip generation in PDF',
          'Payslips auto-emailed to each staff member on run completion',
          'Annual and 360-degree performance reviews with scoring and comments',
          'Disciplinary case management with documentation trail',
          'HR report export — headcount, leave balances, and payroll cost summary',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Add staff and configure payroll', desc: 'Import or manually add staff records. Set salary structures, allowance types, and tax rules. One-time configuration per staff category.' },
      { step: '02', title: 'Staff manage leave from their portal', desc: 'Teachers and admin apply for leave from the staff portal. Line managers approve or decline with one click. Balances update automatically.' },
      { step: '03', title: 'Run payroll in minutes', desc: 'Click "Run payroll" at the end of the month. Tera SM calculates salaries, deductions, and taxes for every staff member based on attendance and leave records.' },
      { step: '04', title: 'Payslips delivered automatically', desc: 'PDF payslips are generated per staff member and emailed to them instantly. They can also download from the staff portal at any time.' },
    ],
    testimonial: {
      quote: "We have 140 staff across 3 campuses. Payroll used to take our HR manager a full day — cross-referencing leave records, calculating deductions, and sending payslips manually. Tera SM runs it in 8 minutes and sends all 140 payslips automatically.",
      author: 'Mrs. Adaeze Eze',
      role: 'Director of Administration',
      school: 'Graceland Schools',
      country: 'Nigeria',
      metric: '8 minutes vs. full day for 140 staff',
    },
    forTeacher: [
      'Apply for leave from your staff portal and track approval status in real time',
      'Download payslips directly from the staff dashboard at any time',
      'Complete your self-assessment for performance reviews online',
      'Log professional development activities, workshops, and certifications',
    ],
    forAdmin: [
      'Run payroll for all staff in minutes — payslips auto-generated and delivered',
      'Approve or decline leave requests with one click from the HR dashboard',
      'Post job vacancies and manage the full hiring pipeline in one place',
      'Export HR reports on headcount, leave balances, and payroll costs',
    ],
    planFeatures: [
      { feature: 'Employee records & directory',       starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Leave management',                   starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Payroll & payslips',                 starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Recruitment pipeline',               starter: false, pro: true,  enterprise: true,  university: true },
      { feature: '360° performance reviews',           starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Disciplinary case management',       starter: false, pro: false, enterprise: true,  university: true },
    ],
    faq: [
      { q: 'Does Tera SM handle local tax rules (PAYE, NHIS, etc.)?', a: 'Yes. Payroll supports configurable deduction rules. Nigerian schools can set PAYE, Pension, and NHIS percentages per staff category. Ghanaian schools can configure SSNIT and income tax brackets. Other countries configure their own rules in the payroll settings.' },
      { q: 'What leave types are supported?', a: 'Annual, sick, maternity, paternity, study, compassionate, and unpaid leave are built in. Admins can create custom leave types with their own accrual rules, maximum days, and carry-over policies.' },
      { q: 'Can the substitute teacher module suggest based on subject?', a: 'Yes. When a teacher reports absence, the system looks for available teachers with the same subject qualification who don\'t have a class at that time. The suggestion list is sorted by availability and proximity (for multi-campus schools).' },
      { q: 'Is payroll data visible to regular staff members?', a: 'No. Payroll data is only visible to HR Admin role users. Each staff member can see only their own payslips. Role-based access control ensures complete separation.' },
    ],
    related: [
      { slug: 'finance', title: 'Finance', desc: 'Payroll costs linked to finance reporting' },
      { slug: 'analytics', title: 'Analytics', desc: 'Staff performance and headcount dashboards' },
      { slug: 'communication', title: 'Communication', desc: 'Staff announcements and direct messaging' },
    ],
  },

  ai: {
    title: 'AI & Intelligence',
    tagline: 'Powered by Claude. Built for education.',
    description: "Tera SM's AI layer is built on the Claude API. It understands educational context — not a generic chatbot bolted on. From early dropout detection to smart timetable generation, AI works where it matters most.",
    color: 'from-blue-500 to-indigo-600',
    ctaColor: 'from-blue-600 to-indigo-700',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    plan: 'Enterprise',
    planColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    metrics: [
      { value: '28%', label: 'Dropout reduction in pilot institutions' },
      { value: '< 1 min', label: 'Full-semester timetable generation' },
      { value: 'Claude', label: 'Powered by Anthropic' },
    ],
    capabilityGroups: [
      {
        heading: 'Student Intelligence',
        items: [
          'Early warning system — flags dropout risk weeks before disengagement',
          'Five-signal dropout model: attendance, assignment rate, fees, LMS activity, grade trend',
          'Risk scoring: Moderate, High, Critical — with recommended intervention actions',
          'Advisor intervention logging — close the loop from flag to outcome',
          'Attendance pattern anomaly detection per student',
        ],
      },
      {
        heading: 'Academic Tools',
        items: [
          'Smart timetable generator — conflict-free scheduling for any semester in under a minute',
          'AI academic advisor — course recommendations based on GPA, goals, and prerequisites',
          'AI grading assistant — auto-scores objective questions and generates essay feedback',
          'AI essay feedback for students before teacher review',
          'Smart substitute teacher suggestions when staff are absent',
        ],
      },
      {
        heading: 'Analytics & Forecasting',
        items: [
          'Predictive enrollment analytics — forecast next semester intake',
          'Revenue forecasting by program, term, and payment method',
          'Pass rate prediction per course based on mid-semester signals',
          'Accreditation report auto-generation from platform data',
        ],
      },
      {
        heading: 'Search & Assistance',
        items: [
          'Natural language search across the entire platform — find anything in plain English',
          'AI chatbot for 24/7 student and staff FAQ support',
          'Course recommendation engine based on student profile and career goals',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Platform data is collected continuously', desc: 'Every login, attendance mark, assignment submission, fee payment, and grade feeds the AI models automatically. No manual data entry or separate analytics setup.' },
      { step: '02', title: 'Models run nightly on every student', desc: 'Each night, the dropout risk model scores every active student against five signals. Students who trigger three or more signals are flagged with a risk level and recommended action.' },
      { step: '03', title: 'Flags surface in the admin dashboard', desc: 'Advisors see the flagged students in Admin → AI & Intelligence → Early Warning. Each flag shows which signals triggered it, how long they\'ve been present, and the suggested intervention.' },
      { step: '04', title: 'Advisors intervene and log outcomes', desc: 'The advisor contacts the student, logs the intervention type and outcome, and the flag updates. Over time, the system learns which interventions work for which patterns.' },
    ],
    testimonial: {
      quote: "In our first semester using the early warning system, we identified 34 students who were showing dropout signals but had not yet appeared on any lecturer's radar. We made contact with all 34. 29 of them completed the semester. That's 29 students we would have lost.",
      author: 'Dr. Emeka Obi',
      role: 'Dean of Students',
      school: 'Pan-Atlantic University',
      country: 'Nigeria',
      metric: '29 out of 34 at-risk students retained',
    },
    forStudent: [
      'Ask the AI advisor which courses to take to graduate on time',
      'Get instant AI feedback on your essay before submitting to your lecturer',
      'Search for anything on the platform in plain English',
      'Chat with the 24/7 bot for answers on fees, deadlines, and registration',
    ],
    forTeacher: [
      'Let the AI grade objective questions automatically — focus on subjective work',
      'Receive alerts when a student\'s pattern suggests they are at risk',
      'Use AI-generated timetable suggestions as a starting point for scheduling',
    ],
    forAdmin: [
      'See the early warning dashboard flagging students at dropout risk each morning',
      'Run the AI timetable generator for a full semester in under a minute',
      'Use predictive enrollment analytics to plan staffing and facility needs',
    ],
    planFeatures: [
      { feature: 'AI chatbot (student FAQ)',            starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Smart timetable generator',           starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'AI grading assistant',                starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Early warning system',                starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Predictive analytics',                starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'NLP search',                          starter: false, pro: false, enterprise: true,  university: true },
    ],
    faq: [
      { q: 'Which AI model powers Tera SM?', a: 'Tera SM uses the Claude API by Anthropic for its generative AI features — the chatbot, essay feedback, AI grading, and academic advisor. Predictive models (dropout risk, enrollment forecasting) are custom-trained on anonymized platform data.' },
      { q: 'Is student data used to train AI models outside our institution?', a: 'No. All predictive models are trained on anonymized, aggregated data across consenting institutions. Individual student data is never shared outside your tenant. Your data is never used to train Anthropic\'s base models.' },
      { q: 'How accurate is the dropout early warning?', a: 'In pilot institutions, the five-signal model correctly identified 78% of students who subsequently dropped out, at a false positive rate of 12%. Accuracy improves as the model collects more data from your institution over time.' },
      { q: 'Can we turn off specific AI features we don\'t want?', a: 'Yes. Each AI feature is individually toggle-able from Admin → Settings → AI Configuration. For example, you can enable the timetable generator without enabling the essay feedback feature.' },
    ],
    related: [
      { slug: 'analytics', title: 'Analytics', desc: 'Dashboards and reporting powered by AI insights' },
      { slug: 'academics', title: 'Academics', desc: 'Smart timetable generation' },
      { slug: 'lms', title: 'LMS', desc: 'AI grading and essay feedback' },
    ],
  },

  analytics: {
    title: 'Analytics & Reporting',
    tagline: 'Every data point. Every role. One platform.',
    description: 'Role-specific dashboards and a drag-and-drop custom report builder. From enrollment trends to dropout risk flags — Tera SM turns raw school data into actionable insight.',
    color: 'from-lime-500 to-green-600',
    ctaColor: 'from-lime-600 to-green-700',
    badge: 'bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-400',
    plan: 'Pro',
    planColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    metrics: [
      { value: 'Real-time', label: 'Dashboard updates' },
      { value: 'Auto', label: 'Accreditation report generation' },
      { value: 'PDF/XLS/CSV', label: 'Export formats' },
    ],
    capabilityGroups: [
      {
        heading: 'Role Dashboards',
        items: [
          'Student dashboard — GPA, fees, attendance, upcoming deadlines',
          'Teacher dashboard — class pass rates, assignment submission rates, engagement',
          'Admin dashboard — enrollment numbers, fee collection, staff headcount KPIs',
          'Finance dashboard — revenue by program, outstanding balances, aging summary',
          'HR dashboard — headcount, leave balances, payroll cost breakdown',
        ],
      },
      {
        heading: 'Custom Reports',
        items: [
          'Drag-and-drop custom report builder — any data point, any combination',
          'Scheduled report delivery — auto-email reports on a set cadence',
          'Student pass/fail rate per course and per semester',
          'Teacher performance analytics — pass rates, attendance, engagement scores',
          'Enrollment trends and forecasting with historical comparison',
          'Revenue forecasting by program, term, and payment method',
        ],
      },
      {
        heading: 'AI & Compliance',
        items: [
          'AI-powered early warning system with dropout risk scoring',
          'Accreditation report auto-generation for NUC, NAB, and WAEC formats',
          'Government and ministry compliance report formatting',
          'Full audit logs — who did what, when, from which IP',
          'Data export in PDF, Excel, and CSV',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Data is collected automatically', desc: 'Every action on the platform — grade entry, fee payment, attendance mark, login — feeds the analytics layer automatically. No manual data entry.' },
      { step: '02', title: 'Role dashboards load on login', desc: 'Each user sees a dashboard built for their role the moment they log in. Admins see enrollment and finance KPIs. Teachers see class performance. Students see their own academic summary.' },
      { step: '03', title: 'Build custom reports', desc: 'Use the drag-and-drop report builder to combine any data points into a custom report. Save it, schedule it to run weekly, and have it emailed to any staff member automatically.' },
      { step: '04', title: 'Export for regulators', desc: 'Generate accreditation and government compliance reports in the correct format for your country\'s regulator — NUC, NAB, WAEC, or a custom template — with one click.' },
    ],
    forAdmin: [
      'See institution-wide KPIs the moment you log in',
      'Build custom reports on any data combination — no SQL or coding required',
      'Export accreditation reports in the correct national format',
      'Review the full audit trail of every action taken on the platform',
    ],
    planFeatures: [
      { feature: 'Role-specific dashboards',           starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'Custom report builder',              starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Scheduled report delivery',          starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'AI early warning analytics',         starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Accreditation report generation',    starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Full audit logs',                    starter: false, pro: true,  enterprise: true,  university: true },
    ],
    faq: [
      { q: 'Can I build a report that combines finance and academic data?', a: 'Yes. The report builder has access to all data domains — academics, finance, HR, attendance, LMS activity, and more. You can create a single report showing fee collection rate alongside attendance and pass rates by department.' },
      { q: 'Which accreditation formats are supported?', a: 'NUC (Nigeria), NAB (Ghana), and WAEC formats are built in. For other regulators, the custom report builder can be configured to match any required column structure. Export is always available in Excel for manual formatting.' },
      { q: 'How far back does the audit log go?', a: 'The full audit trail is retained for 2 years on Pro and Enterprise plans, and indefinitely on University plans. Every log entry includes the user, action type, affected record, timestamp, and IP address.' },
      { q: 'Can I give a board member read-only access to the analytics dashboard?', a: 'Yes. The RBAC system supports a custom "Board Viewer" role that grants read-only access to the analytics dashboards without any ability to modify data. Create the role and assign it from Admin → Settings → Roles.' },
    ],
    related: [
      { slug: 'ai', title: 'AI & Intelligence', desc: 'Predictive analytics and early warning' },
      { slug: 'finance', title: 'Finance', desc: 'Revenue and collection dashboards' },
      { slug: 'academics', title: 'Academics', desc: 'Grade and progression data' },
    ],
  },

  communication: {
    title: 'Communication & Engagement',
    tagline: 'Every channel. One platform.',
    description: 'In-app chat, class group chats, broadcast announcements, WhatsApp and SMS integration, and push notifications — all controlled from one communication hub.',
    color: 'from-cyan-500 to-blue-500',
    ctaColor: 'from-cyan-600 to-blue-600',
    badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
    plan: 'Starter',
    planColor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    metrics: [
      { value: '5 channels', label: 'Push, SMS, WhatsApp, email, in-app' },
      { value: 'Auto', label: 'Class group chat creation on enrollment' },
      { value: 'E2E', label: 'Encrypted private messages' },
    ],
    capabilityGroups: [
      {
        heading: 'Messaging',
        items: [
          'In-app direct messaging between any two users',
          'Class group chats — auto-created when a student registers for a course',
          'File and image sharing in all chat types',
          'Message read receipts and delivery status',
          'Searchable chat history across all conversations',
          'End-to-end encrypted private messages',
        ],
      },
      {
        heading: 'Broadcasts & Announcements',
        items: [
          'Department announcement channels — broadcast read-only messages to a department',
          'Admin and school-wide broadcast messages',
          'School social feed with moderated comments',
          'New announcement badges with unread count indicators',
          'Video announcements from Dean or Principal (auto-play on login)',
          'Email newsletter builder with segmented sends by role, department, or class',
        ],
      },
      {
        heading: 'Notifications & Alerts',
        items: [
          'Push notifications for mobile and browser',
          'WhatsApp Business API for SMS and notification delivery',
          "Africa's Talking SMS integration for bulk messaging across Africa",
          'Automated reminders — deadlines, fees, events, and results',
          'Fee due date alerts at 7-day, 3-day, and 1-day intervals',
          'Missed class and result publication alerts',
          'Customisable per-user notification preferences',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Channels created automatically', desc: 'When a student registers for a course, they are added to that course\'s group chat instantly. When a new department is created, its announcement channel is created with it.' },
      { step: '02', title: 'Staff communicate from the portal', desc: 'Teachers send announcements to their class group, message students directly, or broadcast to the whole department — all from one compose screen.' },
      { step: '03', title: 'Notifications reach every channel', desc: 'Admin broadcasts go out simultaneously via in-app notification, email, SMS, and WhatsApp. Each user gets it on whichever channel they prefer — based on their notification settings.' },
      { step: '04', title: 'Automated reminders run in background', desc: 'The reminders engine sends fee deadline alerts, assignment due reminders, and result publication alerts automatically — no manual scheduling by staff.' },
    ],
    forStudent: [
      'Message your lecturer directly from your course page',
      'Join the class group chat automatically when you register for a course',
      'Set your own notification preferences — choose which alerts reach you and how',
      'Never miss a deadline — receive reminder alerts at 7, 3, and 1 day intervals',
    ],
    forTeacher: [
      'Send an announcement to your entire class in one message',
      'Reply to student questions in the course group chat',
      'Set office hours reminders and send to all your students at once',
    ],
    forAdmin: [
      'Broadcast institution-wide alerts via push, SMS, WhatsApp, and email simultaneously',
      'Build and send an email newsletter with the drag-and-drop builder',
      'Monitor message volumes and notification delivery rates from the comms dashboard',
    ],
    planFeatures: [
      { feature: 'In-app chat & group chats',          starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'Push notifications',                  starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'SMS (Africa\'s Talking)',             starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'WhatsApp Business API',               starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Email newsletter builder',            starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Broadcast to 10,000+ recipients',    starter: false, pro: false, enterprise: true,  university: true },
    ],
    faq: [
      { q: 'How does the WhatsApp integration work?', a: 'Tera SM connects to your WhatsApp Business account via the Meta Business API (or via Twilio). Once connected, outbound notifications (fee reminders, result alerts, announcements) are sent as WhatsApp messages. Students do not need to install anything — they receive messages in their existing WhatsApp.' },
      { q: 'Do SMS credits have to be purchased separately?', a: 'SMS is delivered via Africa\'s Talking (for African networks) or Twilio (global). Credits are purchased as an add-on from the billing page — 1,000 / 5,000 / 10,000 SMS packs. Remaining credits are shown in Admin → Settings → Communication.' },
      { q: 'Can students opt out of specific notification types?', a: 'Yes. Each user has a Notification Preferences panel where they can independently toggle each notification type (fee reminders, assignment alerts, result releases, announcements) and choose which channels reach them (push, email, SMS, WhatsApp).' },
      { q: 'Are private messages encrypted?', a: 'Yes. Direct messages between two users are end-to-end encrypted. Group chat messages and announcement channels are encrypted in transit (TLS 1.3) and at rest (AES-256) but are visible to platform admins for moderation purposes.' },
    ],
    related: [
      { slug: 'student-portal', title: 'Student Portal', desc: 'Student-facing chat and notification centre' },
      { slug: 'parent-portal', title: 'Parent Portal', desc: 'Parent-teacher messaging and alerts' },
      { slug: 'live-classes', title: 'Live Classes', desc: 'Class group chats auto-created with live sessions' },
    ],
  },

  'student-portal': {
    title: 'Student Portal',
    tagline: 'Everything a student needs. One login.',
    description: 'A personalised digital home for every student — courses, grades, fees, timetable, messages, and AI support. Available on web and mobile, with offline support for low-connectivity areas.',
    color: 'from-sky-500 to-blue-600',
    ctaColor: 'from-sky-600 to-blue-700',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    plan: 'Starter',
    planColor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    metrics: [
      { value: 'Web + Mobile', label: 'iOS, Android, and PWA' },
      { value: 'Offline', label: 'Works on low bandwidth' },
      { value: '1 login', label: 'For academics, fees, and life' },
    ],
    capabilityGroups: [
      {
        heading: 'Authentication & Profile',
        items: [
          'Gmail SSO and email/password login — both options supported',
          'Two-factor authentication (2FA) for added security',
          'Multi-step onboarding wizard with progress checklist',
          'Digital student ID card with QR code — available after onboarding',
          'Personalised dashboard with quick-access widgets for all key areas',
        ],
      },
      {
        heading: 'Academics & Fees',
        items: [
          'Course registration with catalogue browsing, seat display, and clash detection',
          'Add/drop within the deadline window with waitlist enrollment',
          'Semester and cumulative GPA with grade history timeline',
          'Grade appeal submission and status tracking',
          'Official and unofficial transcript download',
          'Email transcript directly to an institution with delivery tracking',
          'Fee payment via card, bank transfer, MoMo, or Orange Money',
          'Full payment history, receipts, and installment schedule',
        ],
      },
      {
        heading: 'Schedule & Communication',
        items: [
          'Weekly timetable and exam schedule with room and venue links',
          'One-click Google or Apple Calendar sync',
          'Personalised deadline tracker — all deadlines in one view',
          'Direct messaging with lecturers and tutors',
          'Class group chats per course',
          'Notification preferences — choose channels and alert types',
        ],
      },
      {
        heading: 'Student Life',
        items: [
          'Clubs and societies discovery and membership',
          'Campus event RSVP and calendar',
          'Counseling and mental health appointment booking (with anonymity option)',
          'Maintenance request submission and status tracking',
          'Gamification — XP points, badges, leaderboards, and attendance streaks',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Student receives an invitation', desc: 'The admin sends an invitation from the student management portal. The student receives an email with a setup link, completes the onboarding wizard, and arrives at their personalised dashboard.' },
      { step: '02', title: 'Register for courses', desc: 'Students browse the course catalogue, see seat availability, check for clashes, and confirm their registration — all with prerequisite validation built in.' },
      { step: '03', title: 'Pay fees, access materials, attend classes', desc: 'Everything is in one portal: pay fees via MoMo, access LMS content, join live classes, and check grades — on web or the mobile app, online or offline.' },
      { step: '04', title: 'Download transcripts and certificates', desc: 'Official transcripts and certificates are generated instantly and available for download or direct email to institutions — watermarked and QR-authenticated.' },
    ],
    forStudent: [
      'Register for courses, pay fees, access LMS content, and check grades — all in one login',
      'Use the mobile app or PWA to access everything offline on low bandwidth',
      'Download your digital student ID with QR code on day one',
      'Track your GPA and simulate future scenarios with the what-if calculator',
    ],
    planFeatures: [
      { feature: 'Student dashboard & portal',          starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'Mobile app (iOS & Android)',          starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Offline PWA mode',                    starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'Gamification & leaderboards',         starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Mental health booking',               starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Digital student ID with QR',          starter: true,  pro: true,  enterprise: true,  university: true },
    ],
    faq: [
      { q: 'Is there a mobile app or only web?', a: 'Both. Tera SM has native iOS and Android apps available on Pro and above. All plans include the Progressive Web App (PWA) which works like a native app when added to the home screen — including offline access and push notifications.' },
      { q: 'How does the student onboarding work?', a: 'Admins import students via CSV or invite them individually. Each student receives an email with a setup link. The onboarding wizard collects profile details, document uploads, and course preferences — with a progress bar showing completion percentage.' },
      { q: 'Can students see their attendance record?', a: 'Yes. The academic dashboard shows attendance per course — number of classes held, attended, and the current attendance percentage. If attendance drops below the minimum threshold, an alert is shown on the dashboard.' },
      { q: 'Is the mental health booking anonymous?', a: 'Yes. Students can optionally book counseling sessions without their name appearing on the counselor\'s schedule. The booking is anonymised and only an ID number is visible to the counselor until the student chooses to reveal their identity.' },
    ],
    related: [
      { slug: 'academics', title: 'Academics', desc: 'Course registration and grade access' },
      { slug: 'finance', title: 'Finance', desc: 'Student-facing fee payment and receipts' },
      { slug: 'lms', title: 'LMS', desc: 'Course content and assignment submission' },
    ],
  },

  'parent-portal': {
    title: 'Parent Portal',
    tagline: "Stay connected to your child's academic journey.",
    description: "Real-time visibility into grades, attendance, fees, and messages with teachers — all from a dedicated parent portal accessible on any device.",
    color: 'from-pink-500 to-rose-500',
    ctaColor: 'from-pink-600 to-rose-600',
    badge: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
    plan: 'Pro',
    planColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    metrics: [
      { value: 'Real-time', label: 'Grade and attendance updates' },
      { value: 'Direct', label: 'Messaging with teachers' },
      { value: 'Multi-child', label: 'All children in one login' },
    ],
    capabilityGroups: [
      {
        heading: 'Academic Visibility',
        items: [
          'Real-time child academic progress — grades, attendance, and results',
          'Grade history and GPA timeline per semester',
          'Attendance summary with percentage and missed class list',
          'Report card and transcript downloads',
          'Exam timetable with room and venue details',
        ],
      },
      {
        heading: 'Communication',
        items: [
          'Direct messaging with teachers and tutors',
          'Parent-teacher appointment booking with calendar integration',
          'Read-only access to school-wide announcements',
          'Push, SMS, and email alerts for results, fees, and absences',
        ],
      },
      {
        heading: 'Payments & Multi-child',
        items: [
          'Fee payment on behalf of child via all supported gateways',
          'Full payment history and receipt downloads',
          'Multiple child support — manage all children from one account',
          'Fee deadline alerts so parents never miss a payment date',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Parent receives an invitation', desc: 'The school sends parent invitations linked to their child\'s account. Parents set up their login — Gmail SSO or email/password — and are immediately linked to their child\'s data.' },
      { step: '02', title: 'Visibility into all academic activity', desc: 'Grades, attendance, LMS progress, and exam results update in real time as staff enter them. Parents see the same data as the student, in a read-only parent view.' },
      { step: '03', title: 'Pay fees directly', desc: 'Parents pay school fees for their children from the parent portal — via card, bank transfer, or MoMo. Receipts are generated and available for download immediately.' },
      { step: '04', title: 'Message teachers directly', desc: 'Parents can send direct messages to their child\'s lecturers and book parent-teacher appointments from the portal without calling the school.' },
    ],
    planFeatures: [
      { feature: 'Parent portal access',               starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Real-time grade & attendance view',  starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Fee payment from parent portal',     starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Direct messaging with teachers',     starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'Multiple children per account',      starter: false, pro: true,  enterprise: true,  university: true },
    ],
    faq: [
      { q: 'Can parents see everything the student sees?', a: 'Parents see grades, attendance, fees, exam timetables, and results — the same academic data as the student. They do not see the student\'s private messages, counseling bookings, or social feed activity.' },
      { q: 'How do parents get linked to their child\'s account?', a: 'The admin sends parent invitations from the student management panel, specifying the student and parent email. The parent receives a setup link and their account is automatically linked to the correct student.' },
      { q: 'Can one parent manage multiple children at different schools on Tera SM?', a: 'Yes, if both schools are on Tera SM. The parent\'s account can be linked to children at different Tera SM institutions. Each school\'s data is isolated — the parent sees both from one login via a school selector.' },
      { q: 'What alerts do parents receive automatically?', a: 'Results published, fee due (7-day, 3-day, 1-day), class absence, and school-wide announcements. Parents can adjust which alerts they receive and via which channel (push, SMS, email, WhatsApp) from their notification settings.' },
    ],
    related: [
      { slug: 'communication', title: 'Communication', desc: 'Parent-teacher messaging and broadcasts' },
      { slug: 'student-portal', title: 'Student Portal', desc: 'Student-facing companion portal' },
      { slug: 'finance', title: 'Finance', desc: 'Fee payments and receipts' },
    ],
  },

  security: {
    title: 'Security & Compliance',
    tagline: 'Enterprise-grade security built from day one.',
    description: 'RBAC, full audit trails, GDPR compliance tools, IP whitelisting, and automated daily backups. Security is not an add-on — it is built into every layer of the platform.',
    color: 'from-slate-600 to-gray-800',
    ctaColor: 'from-slate-700 to-gray-900',
    badge: 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400',
    plan: 'All plans',
    planColor: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    metrics: [
      { value: '99.9%', label: 'Uptime SLA' },
      { value: 'Daily', label: 'Automated backups with PITR' },
      { value: 'AES-256', label: 'Encryption at rest + TLS 1.3 in transit' },
    ],
    capabilityGroups: [
      {
        heading: 'Access Control',
        items: [
          'Role-based access control (RBAC) with granular permission assignment',
          'Row-level security — every record scoped to a tenant',
          'IP whitelisting for admin portal access (Enterprise+)',
          'Two-factor authentication (2FA) for all staff and admin accounts',
          'Session timeout and single-session enforcement',
          'Forced logout across all devices from admin panel',
        ],
      },
      {
        heading: 'Data Protection',
        items: [
          'All data encrypted at rest using AES-256',
          'All data in transit encrypted via TLS 1.3',
          'Database-level encryption on PostgreSQL (Neon)',
          'File storage encrypted on Cloudflare R2',
          'Isolated tenant data — no cross-tenant access possible',
        ],
      },
      {
        heading: 'Monitoring & Audit',
        items: [
          'Full audit trail — every action logged with user, timestamp, and IP',
          'Real-time error monitoring via Sentry',
          'Log aggregation and search via Axiom',
          'Uptime monitoring and incident management via BetterUptime',
          'Automated alerts on anomalous access patterns',
        ],
      },
      {
        heading: 'Compliance & Recovery',
        items: [
          'GDPR compliant — consent management, data export, right to erasure',
          'FERPA compliant for US and diaspora institutions',
          'Data Processing Agreement (DPA) available on request',
          'Automated daily backups with 30-day retention',
          'Point-in-time recovery (PITR) — restore to any moment',
          'Disaster recovery plan with RTO < 4 hours',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Roles and permissions configured at setup', desc: 'Admin, Registrar, Finance Admin, HR Admin, Teacher, Student, Parent — each role has a predefined permission set. Admins can fine-tune individual permissions per user.' },
      { step: '02', title: 'Every action is logged automatically', desc: 'The audit trail captures every write action on the platform — who created, modified, or deleted a record, from which IP, at what time. No configuration required.' },
      { step: '03', title: 'Backups run every night automatically', desc: 'Daily database backups with 30-day retention. Point-in-time recovery lets you restore to any specific moment — useful for accidental bulk deletions or data corruption.' },
      { step: '04', title: 'GDPR tools for compliance requests', desc: 'When a data subject requests an export or erasure, admins use the GDPR tools panel to generate a full data export or irreversibly erase a user record — with an audit log of the action.' },
    ],
    planFeatures: [
      { feature: 'RBAC & 2FA',                         starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'Full audit trail',                    starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'IP whitelisting (admin portal)',      starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'GDPR export & erasure tools',        starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'Point-in-time recovery',             starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Dedicated infrastructure',           starter: false, pro: false, enterprise: false, university: true },
    ],
    faq: [
      { q: 'Is Tera SM GDPR compliant?', a: 'Yes. Tera SM includes consent management, data subject export, and right-to-erasure tools. A Data Processing Agreement (DPA) is available on request for institutions in the EU or handling EU citizen data. Cookie consent banners are included on all public pages.' },
      { q: 'Where is our data stored?', a: 'By default, data is stored on Neon (PostgreSQL) in the US East region. Enterprise and University plans can choose their preferred data residency region — EU, US, or Africa (where available). Data never leaves the selected region.' },
      { q: 'What happens if we cancel our subscription?', a: 'On cancellation, your data remains accessible for 30 days during which you can export everything. After 30 days, your data is permanently deleted and a deletion certificate is issued. We do not sell or transfer your data.' },
      { q: 'Can we run a penetration test on our Tera SM instance?', a: 'Yes. Contact security@terasms.com to schedule a coordinated penetration test. We share our network architecture and WAF rules with authorised testers. Results are kept confidential under NDA.' },
    ],
    related: [
      { slug: 'infrastructure', title: 'Infrastructure', desc: 'Multi-tenant architecture and hosting' },
      { slug: 'analytics', title: 'Analytics', desc: 'Audit logs and compliance reporting' },
    ],
  },

  infrastructure: {
    title: 'SaaS Infrastructure',
    tagline: 'Multi-tenant. Custom-branded. Always on.',
    description: 'True multi-tenant architecture with fully isolated data per school, custom branding per institution, REST API access, and a 99.9% uptime SLA — all managed from a single platform.',
    color: 'from-gray-600 to-gray-800',
    ctaColor: 'from-gray-700 to-gray-900',
    badge: 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-400',
    plan: 'All plans',
    planColor: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    metrics: [
      { value: '99.9%', label: 'Uptime SLA (99.95% on University)' },
      { value: '6+', label: 'Languages supported' },
      { value: 'Custom', label: 'Domain and branding per school' },
    ],
    capabilityGroups: [
      {
        heading: 'Multi-Tenancy & Branding',
        items: [
          'Fully isolated data per school — no cross-tenant access possible',
          'Custom branding — logo, primary color, and custom domain per institution',
          'School-specific subdomain (yourschool.terasms.com) on all plans',
          'Custom domain (app.yourschool.edu) on Pro and above',
          'White-label option — remove Tera SM branding entirely (Enterprise+)',
          'Feature flags per tenant — enable or disable modules per subscription',
        ],
      },
      {
        heading: 'API & Integrations',
        items: [
          'REST API with full OpenAPI documentation and sandbox environment',
          'Read-only API access on Pro; full read/write API on Enterprise+',
          'Webhook support — trigger external systems on platform events',
          'Webhook events: student enrolled, payment received, grade published, and more',
          'Google SSO, Microsoft SSO, and institutional email SSO (Enterprise+)',
          'Integration with government education databases (University)',
        ],
      },
      {
        heading: 'Languages & Mobile',
        items: [
          'English and French — built in on all plans',
          'Arabic, Swahili, Portuguese, and Hausa available as add-ons',
          'Progressive Web App (PWA) with offline-first mode',
          'Native iOS and Android apps (Pro and above)',
          'School-branded mobile app build available as an add-on',
        ],
      },
      {
        heading: 'Hosting & SLA',
        items: [
          'Frontend on Vercel — global CDN with edge rendering',
          'Backend on Railway — auto-scaling Node.js infrastructure',
          'PostgreSQL on Neon — serverless, auto-scaling, geo-distributed',
          'Redis via Upstash for caching and job queues',
          'Cloudflare CDN for static assets and DDoS protection',
          '99.9% uptime SLA with status page and alert subscriptions',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Your school is provisioned in minutes', desc: 'Once you complete registration and subscription setup, your Tera SM tenant is provisioned automatically. You get your subdomain, branding settings, and admin account within 2 minutes.' },
      { step: '02', title: 'Configure branding and modules', desc: 'Upload your logo, set your primary color, configure your custom domain, and enable the modules included in your plan. Feature flags let you control exactly what each role sees.' },
      { step: '03', title: 'Connect via API or webhooks', desc: 'Generate an API key from Admin → Settings → API Keys. Use the REST API to read or write data, or configure webhooks to push events to your own systems in real time.' },
      { step: '04', title: 'Scale without infrastructure concerns', desc: 'Tera SM handles load spikes automatically — semester registration days, results day, exam periods. No configuration, no manual scaling. Your 99.9% SLA is monitored and published on the status page.' },
    ],
    planFeatures: [
      { feature: 'Custom subdomain',                   starter: true,  pro: true,  enterprise: true,  university: true },
      { feature: 'Custom domain (your own)',           starter: false, pro: true,  enterprise: true,  university: true },
      { feature: 'REST API access',                    starter: false, pro: 'Read-only', enterprise: 'Full', university: 'Full' },
      { feature: 'Webhooks',                           starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'White-label (no Tera SM branding)', starter: false, pro: false, enterprise: true,  university: true },
      { feature: 'Dedicated infrastructure',          starter: false, pro: false, enterprise: false, university: true },
    ],
    faq: [
      { q: 'Can we use our own domain (e.g. portal.ourschool.edu)?', a: 'Yes. Pro and above plans support custom domains. You point your domain\'s CNAME record to Tera SM, configure the domain in Admin → Settings → Branding, and we provision an SSL certificate automatically within minutes.' },
      { q: 'What events are available as webhooks?', a: 'Student enrolled, student registration confirmed, payment received, grade published, announcement sent, leave approved, and more. The full event list is in the API documentation. Webhooks include retry logic with exponential backoff on failure.' },
      { q: 'Is there an API rate limit?', a: 'Pro: 60 requests/minute. Enterprise: 300 requests/minute. University: 1,000 requests/minute. All responses include X-RateLimit-Remaining and X-RateLimit-Reset headers. Bulk data endpoints have separate higher limits documented in the API reference.' },
      { q: 'Can we self-host Tera SM on-premise?', a: 'On-premise deployment is available exclusively on the University plan. It requires a dedicated infrastructure setup engagement with our team. Contact sales for architecture requirements and pricing.' },
    ],
    related: [
      { slug: 'security', title: 'Security', desc: 'RBAC, encryption, and compliance' },
      { slug: 'analytics', title: 'Analytics', desc: 'Data export and audit logs' },
    ],
  },

  // ── Student Life ──────────────────────────────────────────────────────────
  'student-life': {
    title: 'Student Life',
    tagline: 'Beyond the classroom — the full campus experience, digitised.',
    description: 'Clubs & societies, sports teams, hostel allocation, maintenance requests, cafeteria & meal plans, campus events, and mental health booking — all in one platform.',
    color: 'from-rose-500 to-rose-700',
    ctaColor: 'from-rose-600 to-rose-800',
    badge: 'Student Life',
    plan: 'Pro',
    planColor: 'bg-rose-600',
    metrics: [
      { value: '10+', label: 'Student life modules' },
      { value: '1-click', label: 'Event RSVP' },
      { value: 'Anon', label: 'Counseling option' },
    ],
    capabilityGroups: [
      {
        heading: 'Clubs & Sports',
        items: [
          'Clubs and societies discovery and membership management',
          'Create, join, and manage club activities and posts',
          'Sports team management (squads, fixtures, scores)',
          'Club officer roles and permissions',
          'Event creation linked to club membership',
        ],
      },
      {
        heading: 'Campus Services',
        items: [
          'Hostel and dormitory allocation with roommate management',
          'Maintenance request system (report and track issues)',
          'Cafeteria and meal plan management (purchase plans, daily menus)',
          'Campus event management with RSVP and reminders',
          'Visitor management (log, badge, and track campus visitors)',
          'Lost and found board',
        ],
      },
      {
        heading: 'Wellbeing',
        items: [
          'Mental health and counseling appointment booking',
          'Anonymity option for counseling sessions',
          'Health center visit records and sick note access',
          'Gamification (XP points, attendance streaks, badges, leaderboards)',
          'Peer support community forum',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Discover', desc: 'Students browse clubs, events, and campus services from their portal dashboard.' },
      { step: '02', title: 'Join & RSVP', desc: 'One-click club membership and event RSVP with automatic calendar reminders.' },
      { step: '03', title: 'Participate', desc: 'Earn XP points, badges, and streaks for attendance, participation, and achievements.' },
      { step: '04', title: 'Get support', desc: 'Book counseling, report maintenance issues, or check meal plans — all in the same portal.' },
    ],
    forStudent: [
      'Discover and join clubs and societies with one click',
      'RSVP to campus events and get reminders',
      'Book mental health counseling with anonymity option',
      'Earn XP points and badges for campus engagement',
    ],
    forAdmin: [
      'Manage hostel allocation and room assignments',
      'Track and resolve maintenance requests',
      'Create campus events and manage RSVPs',
      'Monitor club activity and membership counts',
    ],
    planFeatures: [
      { feature: 'Clubs & societies',          starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Sports team management',     starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Hostel allocation',          starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Maintenance requests',       starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Cafeteria & meal plans',     starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Campus event management',    starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Counseling booking',         starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Gamification & leaderboard', starter: false,  pro: false,  enterprise: true,   university: true },
    ],
    faq: [
      { q: 'Is the counseling booking truly anonymous?', a: 'Students can book under a pseudonym. Counselors see only the booking slot — name is hidden unless the student chooses to reveal it.' },
      { q: 'Can clubs post announcements?', a: 'Yes — club officers can post activity updates visible to members. Posts can include files, images, and event links.' },
      { q: 'How does hostel allocation work?', a: 'Admins configure rooms and capacity. Students apply for hostel placement; the system assigns rooms and notifies students of their allocation.' },
      { q: 'Are gamification points linked to grades?', a: 'No — XP points are separate from academic records. They reward engagement (attendance, events, clubs) not academic performance.' },
    ],
    related: [
      { slug: 'student-portal', title: 'Student Portal', desc: 'Main student dashboard and portal' },
      { slug: 'communication', title: 'Communication', desc: 'Club chats and campus announcements' },
      { slug: 'analytics', title: 'Analytics', desc: 'Engagement and participation metrics' },
    ],
  },

  // ── Elections ─────────────────────────────────────────────────────────────
  elections: {
    title: 'Elections & Governance',
    tagline: 'Fair, transparent, and tamper-proof student elections — fully digital.',
    description: 'Student government elections, verified one-person-one-vote, live result tallying, polls & surveys, formal petition system, and SRC portal.',
    color: 'from-orange-500 to-orange-700',
    ctaColor: 'from-orange-600 to-orange-800',
    badge: 'Governance',
    plan: 'Pro',
    planColor: 'bg-orange-600',
    metrics: [
      { value: '1-vote', label: 'Per verified student' },
      { value: 'Live', label: 'Real-time result tallying' },
      { value: '100%', label: 'Audit trail on all votes' },
    ],
    capabilityGroups: [
      {
        heading: 'Elections',
        items: [
          'Student government election management',
          'Candidate registration and vetting workflow',
          'Verified one-person-one-vote system (linked to student ID)',
          'Live result tallying and publication dashboard',
          'Voting window with configurable open/close times',
          'Full audit trail of all votes cast (anonymous but verifiable)',
        ],
      },
      {
        heading: 'Polls & Petitions',
        items: [
          'Polls and surveys for any user group (students, staff, parents)',
          'Multiple question types (single choice, multiple choice, rating)',
          'Anonymous poll option',
          'Formal petition system with signature thresholds',
          'Petition status tracking (open, threshold reached, responded)',
          'Admin response and resolution workflow',
        ],
      },
      {
        heading: 'SRC Portal',
        items: [
          'Student senate / SRC operations space',
          'Meeting minutes and resolution publishing',
          'Budget request and approval workflow',
          'SRC announcement channel (broadcast to all students)',
          'Project and initiative tracking board',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Set up election', desc: 'Admin creates election, sets voting window, and opens candidate registration.' },
      { step: '02', title: 'Register candidates', desc: 'Candidates submit profiles for vetting; approved candidates appear on the ballot.' },
      { step: '03', title: 'Students vote', desc: 'Verified students cast their vote — one per person, tracked anonymously with full audit.' },
      { step: '04', title: 'Results go live', desc: 'Results tally in real time and are published automatically when the voting window closes.' },
    ],
    forStudent: [
      'Vote in student elections from your portal with one click',
      'View live results as they are tallied',
      'Sign petitions and track their status',
      'Follow SRC announcements and resolutions',
    ],
    forAdmin: [
      'Create and manage election campaigns and voting windows',
      'Vet and approve candidates before ballots open',
      'Run polls and surveys targeting any user group',
      'Respond to petitions that reach their threshold',
    ],
    planFeatures: [
      { feature: 'Elections & voting',         starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Candidate vetting workflow',  starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Live result tallying',        starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Polls & surveys',             starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Petition system',             starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'SRC portal',                  starter: false,  pro: false,  enterprise: true,   university: true },
      { feature: 'Anonymous voting audit',       starter: false,  pro: true,   enterprise: true,   university: true },
    ],
    faq: [
      { q: 'How is one-person-one-vote enforced?', a: 'Each vote is cryptographically linked to the student\'s verified account. The system rejects duplicate submissions while keeping vote choices anonymous.' },
      { q: 'Can the admin see who voted for whom?', a: 'No — vote choices are anonymous. The audit trail only records that a given student voted, not which candidate they chose.' },
      { q: 'Can polls be sent to specific groups?', a: 'Yes — you can target polls to any subset of users (e.g., final-year students only, a specific department, all parents).' },
      { q: 'What happens when a petition reaches its threshold?', a: 'Admin receives an alert and the petition is flagged as "Threshold reached." A formal response workflow is triggered requiring acknowledgement within a set window.' },
    ],
    related: [
      { slug: 'student-life', title: 'Student Life', desc: 'Clubs, events, and campus engagement' },
      { slug: 'communication', title: 'Communication', desc: 'SRC announcements and broadcasts' },
      { slug: 'analytics', title: 'Analytics', desc: 'Participation and turnout reporting' },
    ],
  },

  // ── Library ───────────────────────────────────────────────────────────────
  library: {
    title: 'Digital Library',
    tagline: 'Every book, journal, and paper your institution needs — accessible from anywhere.',
    description: 'E-library catalog, digital borrowing with due dates, research paper repository, JSTOR and Google Scholar integration, and per-course reading lists.',
    color: 'from-amber-500 to-amber-700',
    ctaColor: 'from-amber-600 to-amber-800',
    badge: 'Digital Library',
    plan: 'Pro',
    planColor: 'bg-amber-600',
    metrics: [
      { value: '24/7', label: 'Digital access' },
      { value: 'Auto', label: 'Due date reminders' },
      { value: 'Instant', label: 'Search across full catalog' },
    ],
    capabilityGroups: [
      {
        heading: 'Catalog & Borrowing',
        items: [
          'E-library with full book and journal catalog',
          'Digital borrowing with configurable loan periods',
          'Due date tracking with automated return reminders',
          'Physical copy reservation with pickup notification',
          'Book availability display (copies available, on loan)',
          'Borrowing history per student',
        ],
      },
      {
        heading: 'Research & Resources',
        items: [
          'Research paper repository (upload, index, search)',
          'External database integration (JSTOR, Google Scholar links)',
          'Per-course reading lists linked by lecturers',
          'Citation generator (APA, MLA, Chicago)',
          'Highlighted annotations saved per user',
          'Full-text search across uploaded documents',
        ],
      },
      {
        heading: 'Administration',
        items: [
          'Librarian dashboard for catalog management',
          'Overdue tracking and fine calculation',
          'Bulk import catalog from ISBN or CSV',
          'Usage analytics (most-borrowed, most-searched)',
          'Digital resource access control per subscription tier',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Search the catalog', desc: 'Students search for books, journals, or papers by title, author, ISBN, or keyword.' },
      { step: '02', title: 'Borrow digitally', desc: 'Click to borrow — digital books open instantly, physical copies are reserved for pickup.' },
      { step: '03', title: 'Read & annotate', desc: 'Read in-browser with personal annotation and highlighting saved to their account.' },
      { step: '04', title: 'Return on time', desc: 'Automated reminders prevent overdue returns. Renewals can be done online without visiting the library.' },
    ],
    forStudent: [
      'Access the full library catalog from your phone or laptop',
      'Borrow digital books instantly — no waiting in line',
      'Find reading lists for each of your courses',
      'Get auto-reminders before your loans are due',
    ],
    forTeacher: [
      'Build required reading lists linked directly to your courses',
      'Upload research papers and resources for students',
      'See which resources students are engaging with most',
    ],
    forAdmin: [
      'Manage the full catalog from a librarian dashboard',
      'Track overdue loans and calculate fines automatically',
      'Import catalog records in bulk via ISBN or CSV',
      'View usage analytics across the library',
    ],
    planFeatures: [
      { feature: 'E-library catalog',            starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Digital borrowing',            starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Due date reminders',           starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Per-course reading lists',     starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Research paper repository',    starter: false,  pro: false,  enterprise: true,   university: true },
      { feature: 'External DB links (JSTOR)',    starter: false,  pro: false,  enterprise: true,   university: true },
      { feature: 'Citation generator',           starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Library analytics',            starter: false,  pro: false,  enterprise: true,   university: true },
    ],
    faq: [
      { q: 'Can students access the library off-campus?', a: 'Yes — the digital library is accessible from any device with internet. Physical reservation status is also visible online.' },
      { q: 'How are overdue fines handled?', a: 'The system auto-calculates fines based on your configured rate per day. Fines can be linked to the student\'s fee account for settlement.' },
      { q: 'Can lecturers add external links to reading lists?', a: 'Yes — reading lists can include uploaded PDFs, external URLs (JSTOR, Google Scholar), and catalog items.' },
      { q: 'Is there a limit on digital borrowing slots?', a: 'You can configure a maximum number of simultaneous loans per student. The default is 5 items.' },
    ],
    related: [
      { slug: 'lms', title: 'LMS', desc: 'Course content and assignments' },
      { slug: 'academics', title: 'Academics', desc: 'Course catalog and semester management' },
      { slug: 'student-portal', title: 'Student Portal', desc: 'Student-facing resource access' },
    ],
  },

  // ── Career ────────────────────────────────────────────────────────────────
  career: {
    title: 'Career & Alumni',
    tagline: 'From student to professional — job board, internships, and alumni network in one platform.',
    description: 'Job board, internship management, CV builder, career counselor booking, employer partner profiles, campus recruitment events, and alumni mentorship network.',
    color: 'from-yellow-500 to-yellow-700',
    ctaColor: 'from-yellow-600 to-yellow-800',
    badge: 'Career Center',
    plan: 'Enterprise',
    planColor: 'bg-yellow-600',
    metrics: [
      { value: 'Live', label: 'Job board updates' },
      { value: '1-page', label: 'CV builder output' },
      { value: 'Alumni', label: 'Mentorship network' },
    ],
    capabilityGroups: [
      {
        heading: 'Jobs & Internships',
        items: [
          'Job board with employer postings and student applications',
          'Internship management (placement tracking, supervisor feedback, completion certificates)',
          'Application tracking per student (applied, shortlisted, offered)',
          'Employer partner profiles and company pages',
          'Campus recruitment event calendar',
          'Automated job match notifications based on student major',
        ],
      },
      {
        heading: 'Career Development',
        items: [
          'CV / resume builder with professional templates',
          'Career counselor appointment booking',
          'Interview preparation resources and mock interview guides',
          'Skills assessment and gap analysis tools',
          'Internship and placement certificate generation',
          'Career goal tracking and milestone logging',
        ],
      },
      {
        heading: 'Alumni Network',
        items: [
          'Graduate profiles and alumni directory',
          'Mentorship matching (alumni mentor → current student)',
          'Alumni giving and donations portal',
          'Networking events and reunion management',
          'Alumni job referral programme',
          'Graduation cohort tracking and outcome reporting',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Build your profile', desc: 'Students create a CV using the builder and complete their career profile with goals and skills.' },
      { step: '02', title: 'Explore opportunities', desc: 'Browse the job board and internship listings filtered by field, location, or employer.' },
      { step: '03', title: 'Apply & track', desc: 'One-click applications with status tracking from applied through to offer received.' },
      { step: '04', title: 'Connect with alumni', desc: 'Match with alumni mentors in your field for guidance, referrals, and networking.' },
    ],
    forStudent: [
      'Build a professional CV with a guided template builder',
      'Apply to jobs and internships directly from your portal',
      'Track application status in real time',
      'Connect with alumni mentors in your career field',
    ],
    forAdmin: [
      'Manage employer partner relationships and company pages',
      'Coordinate campus recruitment events',
      'Track internship placements and completion rates',
      'Generate career outcome reports for accreditation',
    ],
    planFeatures: [
      { feature: 'Job board',                   starter: false,  pro: false,  enterprise: true,   university: true },
      { feature: 'Internship management',        starter: false,  pro: false,  enterprise: true,   university: true },
      { feature: 'CV / resume builder',          starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Career counselor booking',     starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Employer partner profiles',    starter: false,  pro: false,  enterprise: true,   university: true },
      { feature: 'Alumni network',               starter: false,  pro: false,  enterprise: true,   university: true },
      { feature: 'Mentorship matching',          starter: false,  pro: false,  enterprise: true,   university: true },
      { feature: 'Alumni donations portal',      starter: false,  pro: false,  enterprise: false,  university: true },
    ],
    faq: [
      { q: 'Can employers post jobs directly?', a: 'Yes — employer partners get a login to post positions and view applicant profiles. Admins approve employer accounts before access is granted.' },
      { q: 'Is the alumni network private?', a: 'Yes — the alumni directory is only accessible to verified graduates and current students. Profiles are opt-in.' },
      { q: 'Can students track multiple applications?', a: 'Yes — the application tracker shows status for every job and internship applied to from the portal.' },
      { q: 'Are placement certificates generated automatically?', a: 'Yes — once a supervisor marks an internship complete with their feedback, a signed PDF certificate is generated and available for download.' },
    ],
    related: [
      { slug: 'student-portal', title: 'Student Portal', desc: 'Main student experience hub' },
      { slug: 'analytics', title: 'Analytics', desc: 'Placement rates and graduate outcome reports' },
      { slug: 'student-life', title: 'Student Life', desc: 'Campus events and clubs' },
    ],
  },

  // ── Operations ────────────────────────────────────────────────────────────
  operations: {
    title: 'Operations & Facilities',
    tagline: 'Every room, asset, and maintenance request — tracked and managed in one place.',
    description: 'Asset management with depreciation tracking, QR code attendance, maintenance request tracking, and a facility and room booking calendar.',
    color: 'from-green-600 to-green-800',
    ctaColor: 'from-green-700 to-green-900',
    badge: 'Operations',
    plan: 'Pro',
    planColor: 'bg-green-600',
    metrics: [
      { value: 'QR', label: 'Attendance check-in' },
      { value: 'Real-time', label: 'Maintenance tracking' },
      { value: 'Auto', label: 'Depreciation calculation' },
    ],
    capabilityGroups: [
      {
        heading: 'Asset Management',
        items: [
          'Equipment, furniture, and device inventory tracking',
          'Depreciation schedule with automatic calculation',
          'Asset assignment to departments or individuals',
          'QR code labels for physical asset identification',
          'Disposal and write-off workflow',
          'Asset utilization reports',
        ],
      },
      {
        heading: 'Attendance & Check-In',
        items: [
          'QR code attendance check-in for events and classes',
          'Mobile-friendly QR scanner (no special hardware needed)',
          'Manual attendance override by admin or staff',
          'Attendance reports exportable to CSV or PDF',
          'Late arrival and early exit tracking',
          'Integration with academic attendance records',
        ],
      },
      {
        heading: 'Facilities & Maintenance',
        items: [
          'Maintenance request submission with photo upload',
          'Request categorization (electrical, plumbing, IT, cleaning)',
          'Assignment to maintenance staff with status tracking',
          'Email and push notifications on request updates',
          'Room and lab booking calendar (conflict-free)',
          'Facility utilization reporting per room or building',
        ],
      },
    ],
    howItWorks: [
      { step: '01', title: 'Log assets', desc: 'Add equipment and facilities to the inventory with category, value, and depreciation schedule.' },
      { step: '02', title: 'Assign & track', desc: 'Assign assets to departments; QR labels link physical items to their digital record.' },
      { step: '03', title: 'Handle requests', desc: 'Students and staff submit maintenance issues; facilities team gets notified and tracks resolution.' },
      { step: '04', title: 'Book spaces', desc: 'Staff and students book rooms and labs from a shared calendar — clashes prevented automatically.' },
    ],
    forStudent: [
      'Check in to events and classes with a QR code scan',
      'Submit and track maintenance requests for your accommodation',
      'Book study rooms and lab sessions from your portal',
    ],
    forTeacher: [
      'Book labs and classrooms from a shared facility calendar',
      'View asset inventory for your department',
      'Submit maintenance requests with photo evidence',
    ],
    forAdmin: [
      'Manage full asset inventory with depreciation schedules',
      'Track all maintenance requests from submission to resolution',
      'Generate facility utilization reports',
      'Configure room booking rules and availability windows',
    ],
    planFeatures: [
      { feature: 'Asset inventory',             starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Depreciation tracking',        starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'QR attendance check-in',       starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Maintenance requests',         starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Room booking calendar',        starter: false,  pro: true,   enterprise: true,   university: true },
      { feature: 'Facility utilization reports', starter: false,  pro: false,  enterprise: true,   university: true },
      { feature: 'Asset disposal workflow',      starter: false,  pro: false,  enterprise: true,   university: true },
    ],
    faq: [
      { q: 'Does QR check-in require special hardware?', a: 'No — any smartphone camera works. Students and staff scan a displayed QR code using the Tera SM mobile app or browser.' },
      { q: 'Can students submit maintenance requests with photos?', a: 'Yes — the submission form includes a photo upload. This helps maintenance staff diagnose issues faster.' },
      { q: 'How does room booking prevent double-booking?', a: 'The facility calendar checks existing reservations in real time. When a conflicting slot is selected, it is blocked and an alternative is suggested.' },
      { q: 'Are asset depreciation calculations customizable?', a: 'Yes — you can choose straight-line or reducing balance depreciation, set useful life, and configure residual values per asset category.' },
    ],
    related: [
      { slug: 'academics', title: 'Academics', desc: 'Room and lab scheduling' },
      { slug: 'student-life', title: 'Student Life', desc: 'Hostel and maintenance for students' },
      { slug: 'analytics', title: 'Analytics', desc: 'Facility usage and asset reports' },
    ],
  },

}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PlanCell({ value }: { value: boolean | string }) {
  if (value === true)  return <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto" />
  if (value === false) return <Minus className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />
  return <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{value}</span>
}

// ─── Static params & metadata ─────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FeatureDeepDivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mod = MODULES[slug]
  if (!mod) notFound()

  const Icon = ICON_MAP[slug] ?? BookOpen
  const slugIndex = MODULE_ORDER.indexOf(slug)
  const nextSlug = slugIndex >= 0 ? MODULE_ORDER[(slugIndex + 1) % MODULE_ORDER.length] : null
  const nextMod = nextSlug ? MODULES[nextSlug] : null
  const NextIcon = nextSlug ? (ICON_MAP[nextSlug] ?? BookOpen) : null

  const PLAN_KEYS: PlanKey[] = ['starter', 'pro', 'enterprise', 'university']
  const PLAN_LABELS: Record<PlanKey, string> = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise', university: 'University' }

  const audienceCards = [
    mod.forStudent ? { key: 'student', label: 'For Students', items: mod.forStudent, icon: GraduationCap, color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' } : null,
    mod.forTeacher ? { key: 'teacher', label: 'For Teachers', items: mod.forTeacher, icon: Users, color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' } : null,
    mod.forAdmin   ? { key: 'admin',   label: 'For Admins',   items: mod.forAdmin,   icon: Shield, color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'     } : null,
  ].filter(Boolean) as { key: string; label: string; items: string[]; icon: React.ComponentType<{className?:string}>; color: string }[]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className={`bg-gradient-to-br ${mod.color} pt-20 pb-16 px-6`}>
        <div className="max-w-5xl mx-auto">
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All features
          </Link>

          <div className="flex items-start gap-8">
            {/* Module icon — floats */}
            <AnimatedHeroIcon>
              <Icon className="w-10 h-10 text-white" />
            </AnimatedHeroIcon>

            <div className="flex-1">
              {/* Plan badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white border border-white/25">
                  {mod.plan === 'All plans' ? 'Available on all plans' : `Requires ${mod.plan}+`}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">{mod.title}</h1>
              <p className="text-xl text-white/80 mb-6 max-w-2xl leading-relaxed">{mod.tagline}</p>
              <p className="text-white/60 text-sm max-w-xl leading-relaxed mb-8">{mod.description}</p>

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
          </div>
        </div>
      </section>

      {/* ── Metrics bar ──────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
          {mod.metrics.map(m => (
            <div key={m.label} className="text-center px-4">
              <p className="text-2xl font-black text-gray-900 dark:text-white">{m.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sticky nav ───────────────────────────────────────────────────────── */}
      <StickyNav />

      {/* ── Capabilities ─────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20 px-6 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">All capabilities</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl">
              Everything included in the {mod.title} module — grouped by function.
            </p>
          </div>
          <AnimatedCapabilities groups={mod.capabilityGroups} />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50 dark:bg-gray-900 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">How it works</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-12 max-w-xl">
            The end-to-end workflow from setup to daily use.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mod.howItWorks.map((step, idx) => (
              <div key={step.step} className="relative">
                {/* Connector line */}
                {idx < mod.howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-[calc(100%+0.5rem)] right-0 h-px bg-gray-200 dark:bg-gray-700 w-6" />
                )}
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-sm font-black mb-4">
                  {step.step}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ──────────────────────────────────────────────────────── */}
      {mod.testimonial && (
        <section className="py-16 px-6 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-5xl text-blue-200 dark:text-blue-900 font-serif leading-none mb-6">&ldquo;</div>
            <blockquote className="text-xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed mb-8">
              {mod.testimonial.quote}
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {mod.testimonial.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{mod.testimonial.author}</p>
                <p className="text-xs text-gray-400">{mod.testimonial.role} · {mod.testimonial.school}, {mod.testimonial.country}</p>
              </div>
              <div className="hidden sm:block ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">Result</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{mod.testimonial.metric}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Who it's for ─────────────────────────────────────────────────────── */}
      {audienceCards.length > 0 && (
        <section id="who-its-for" className="py-20 px-6 scroll-mt-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Who it&apos;s for</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-12 max-w-xl">
              How each role benefits from the {mod.title} module.
            </p>
            <div className={`grid gap-5 ${audienceCards.length === 3 ? 'md:grid-cols-3' : audienceCards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-lg'}`}>
              {audienceCards.map(card => {
                const CardIcon = card.icon
                return (
                  <div key={card.key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md hover:shadow-blue-50 dark:hover:shadow-blue-950/20 transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">{card.label}</h3>
                    <ul className="space-y-2.5">
                      {card.items.map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Plan comparison ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-gray-50 dark:bg-gray-900 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">What&apos;s on which plan</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Key {mod.title} features by subscription tier.</p>
            </div>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              See full pricing <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 w-1/2">Feature</th>
                  {PLAN_KEYS.map(p => (
                    <th key={p} className="px-4 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400">{PLAN_LABELS[p]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {mod.planFeatures.map(row => (
                  <tr key={row.feature} className="hover:bg-gray-50/60 dark:hover:bg-gray-900/60 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-gray-700 dark:text-gray-300">{row.feature}</td>
                    {PLAN_KEYS.map(p => (
                      <td key={p} className="px-4 py-3.5 text-center">
                        <PlanCell value={row[p]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Common questions</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-12">
            Answers to the most frequent questions about the {mod.title} module.
          </p>
          <div className="space-y-3">
            {mod.faq.map(item => (
              <details
                key={item.q}
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm pr-4">{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-800 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related modules ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Related modules</h2>
            <Link href="/features" className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              View all 19 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {mod.related.map(r => {
              const RelIcon = ICON_MAP[r.slug] ?? BookOpen
              return (
                <Link
                  key={r.slug}
                  href={`/features/${r.slug}`}
                  className="group flex items-start gap-4 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md hover:shadow-blue-50 dark:hover:shadow-blue-950/20 hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 transition-colors">
                    <RelIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{r.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{r.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Next module ──────────────────────────────────────────────────────── */}
      {nextMod && nextSlug && NextIcon && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-4">Next module</p>
            <Link
              href={`/features/${nextSlug}`}
              className="group flex items-center justify-between gap-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md hover:shadow-blue-50 dark:hover:shadow-blue-950/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 transition-colors">
                  <NextIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{nextMod.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{nextMod.tagline}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
            </Link>
          </div>
        </div>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className={`py-20 px-6 bg-gradient-to-br ${mod.ctaColor}`}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-6">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">See {mod.title} in action</h2>
          <p className="text-white/70 mb-8 text-sm max-w-md mx-auto leading-relaxed">
            Book a live demo and we will walk through this module with your institution&apos;s specific setup in mind.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
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

    </div>
  )
}
