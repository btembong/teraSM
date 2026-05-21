# Tera SM — SaaS School Management System
## Product Vision
A world-class, multi-tenant SaaS platform that serves as the complete operating system for educational institutions — from admissions to alumni, academics to finance, live classes to career placement.

---

## Portals & Access Points

| Portal | Users | Access |
|---|---|---|
| Student Portal | Students | Web (PWA) + Mobile App |
| Staff & Teacher Portal | Teachers, Lecturers | Web + Mobile App |
| Admin Portal | School Admins, Registrars | Web + Desktop (optional) |
| Parent Portal | Parents / Guardians | Web + Mobile App |
| Super Admin (Tera) | Platform Operators | Web |

---

## Module Breakdown

### 1. Onboarding & Authentication
- Gmail SSO + email/password login (both options supported)
- Two-factor authentication (2FA) for staff and admin
- Single Sign-On (SSO) — Google, Microsoft, institutional email
- New student application form with document upload (ID, photos)
- Multi-step onboarding wizard (profile setup, course selection, fee payment)
- Onboarding checklist with progress bar (shows % completion)
- Welcome screen with video message from Dean/Principal (auto-plays on first login)
- Acceptance letter download after admission
- Personalized dashboard on first login
- Role-based access control (RBAC) with granular permissions

---

### 2. Admissions & Registration
- Online application portal for prospective students
- Application tracking (submitted, under review, accepted, rejected)
- Admission letter generation (PDF)
- Document verification workflow
- Course registration gated by fee payment clearance
- Browse course catalog with filters (department, level, semester, credit hours, time slot)
- Seat availability display per course section
- Section and time slot selection during registration
- Prerequisite validation (blocks registration if requirements unmet)
- Clash detection and warnings (flags timetable conflicts before confirming)
- Add/drop period management with deadline enforcement
- Waitlist enrollment when course is full (auto-notify on slot opening)
- Credit transfer management (from other institutions)
- Registration confirmation PDF download

---

### 3. Academics
- Academic calendar management (terms, semesters, holidays, deadlines)
- Timetable / schedule generator (AI-assisted, conflict-free)
- Timetable viewer per student, per teacher, per class
- Exam timetable with room and venue information
- Add timetable to Google Calendar or Apple Calendar (one-click sync)
- Class cancellation notifications (instant push alert)
- Room and venue map links (campus map integration)
- Personalized deadline tracker (assignments, exams, fee dates in one view)
- Room and lab booking system
- Attendance tracking (manual, QR code, auto-mark via live class join)
- Grade entry and management
- Per-course grade breakdown (continuous assessment + exam score)
- Grade history across all semesters (timeline view)
- Results publication with controlled release
- Supplementary and resit exam results
- GPA / CGPA calculator with what-if scenario tool
- Progress toward degree completion (% of total credits earned)
- Report card and result slip generation (PDF)
- Transcript generation — official (watermarked/sealed) and unofficial (instant)
- Email transcript directly to an institution (with delivery tracking)
- Document authentication QR code (on transcripts and certificates, scannable to verify)
- Honor roll and academic distinction tracking
- Academic appeals workflow (grade dispute submission and resolution)
- Exam scheduling and clash management
- Online proctored exams (webcam monitoring, browser lockdown)
- Question bank (reusable pool, auto-generate exam papers)
- Thesis / dissertation submission and supervisor review portal
- Certificate generator (enrollment, completion, awards, degree)
- Academic advising system (advisor assignment, meeting notes)

---

### 4. Learning Management System (LMS)
- Course content management (upload slides, PDFs, videos, links)
- Adaptive learning paths (content adjusts to student performance)
- SCORM / xAPI support for third-party eLearning content
- Interactive content (H5P — quizzes, drag-and-drop, flashcards)
- Video lesson creator (record, upload, annotate in-platform)
- Discussion forums per course (threaded conversations per topic)
- Assignments with file submission, deadlines, and late penalties
- Peer review assignments (students review each other with rubrics)
- AI grading assistant (auto-score objectives; AI feedback on essays)
- Plagiarism detection (document similarity checker)
- Progress tracker (visual completion bars per student per course)
- Offline content download for low-connectivity areas (PWA)
- Course prerequisites enforcement
- Micro-credentials and digital badge issuance

---

### 5. Live Classes
- Built-in WebRTC video conferencing (no Zoom required)
- Breakout rooms (split class into groups mid-session)
- Auto-recording with storage and replay linked to course
- Virtual collaborative whiteboard
- Live polls and Q&A during class
- Hand raise and emoji reactions
- Screen sharing
- Attendance auto-marked on class join
- Scheduled class reminders (push, email, SMS)

---

### 6. Finance
- Fee structure setup (per program, level, semester, course)
- Student fee invoicing and statements
- Outstanding balance overview (dashboard widget + full breakdown)
- Online payment gateway (Paystack, Flutterwave, Stripe)
- Pay via card, bank transfer, or mobile money
- Installment and payment plan management
- Scholarship and bursary management (apply, approve, auto-deduct)
- Scholarship/bursary status visible to student (amount applied, balance)
- Financial aid application and review workflow
- Payment receipt and invoice download (per transaction, PDF)
- Automated late fee engine (penalties based on due dates)
- Fee deadline reminders and alerts (7-day, 3-day, 1-day warnings)
- Student debt aging reports
- Refund request submission and processing workflow
- Departmental budget management and tracking
- Revenue analytics dashboard (by program, term, payment method)
- Bank reconciliation tools
- Financial reports export (PDF, Excel, CSV)

---

### 7. HR Management
- Employee records (teachers, admin, support staff)
- Recruitment pipeline (job posting, applicant tracking, interview scheduling)
- Contract management (storage, renewal alerts)
- Staff onboarding workflow
- Attendance and leave management (apply, approve, balance tracking)
- Payroll management and payslip generation (PDF)
- Staff performance reviews (annual / 360-degree feedback)
- Professional development tracker (training, workshops, certifications)
- Substitute teacher management (auto-suggest cover when absent)
- Staff directory (searchable by name, department, role)
- Disciplinary case management

---

### 8. Communication & Engagement
- In-app chat (student-teacher, staff-admin)
- Class group chats (per course, auto-created on student registration)
- Department announcements channel (read-only broadcast per department)
- Admin and school-wide broadcast messages
- File and image sharing in chat
- Message read receipts
- Searchable chat history
- End-to-end encrypted private messages
- School social feed (announcements with moderated comments)
- Community discussion board (school-wide forum)
- Email newsletter builder (templates, segmented sends)
- WhatsApp Business API and SMS integration for notifications
- Push notifications (mobile and browser)
- New announcement badges (unread count indicators)
- Video announcements from Dean/Principal (auto-play on login)
- Reminders engine (deadlines, fees, events, results)
- Missed class notifications
- Customizable notification preferences (choose channels and alert types)
- Parent-teacher direct messaging

---

### 9. Student Portal
Personalized dashboard with quick-access widgets (courses, fees, results, notifications, schedule, announcements). Organized into 8 sub-modules:

#### 9a. Authentication & Onboarding
- Gmail SSO + email/password login (both options)
- Two-factor authentication (2FA)
- Welcome screen with video message from Dean/Principal
- Multi-step profile setup wizard
- Document upload (ID, photos) and acceptance letter download
- Onboarding checklist with progress bar
- Digital student ID with QR code (available after onboarding)

#### 9b. Course Registration
- Browse course catalog with filters (department, level, semester, credits, time slot)
- Seat availability display per section
- Section and time slot selection
- Prerequisite validation and clash detection with warnings
- Add/drop within deadline window
- Waitlist enrollment with auto-notification
- Registration confirmation PDF
- Fee clearance gate (registration blocked until payment cleared)

#### 9c. Results & Grades
- Semester and cumulative GPA
- Per-course grade breakdown (CA + exam)
- Grade history across all semesters
- Grade appeal submission and status tracking
- Supplementary and resit exam results
- Honors and Dean's list status badge
- Progress toward degree (% of credits completed)
- What-if GPA calculator

#### 9d. Transcripts & Certificates
- Official transcript PDF (watermarked, sealed)
- Unofficial quick transcript (instant download)
- Email transcript to institution with delivery tracking
- Certificate of enrollment PDF
- Degree and completion certificate download
- Document authentication QR code (scannable for verification)
- Request history and status tracker

#### 9e. Fees & Payments
- Outstanding balance overview (dashboard widget + itemized breakdown)
- Pay via card, bank transfer, or mobile money
- Payment plan enrollment and installment schedule
- Receipt and invoice download per transaction
- Scholarship and bursary status (amount approved, balance applied)
- Full payment history ledger
- Fee deadline reminders and alerts
- Refund request submission and tracking

#### 9f. Schedule & Timetable
- Weekly class schedule view (by day and time)
- Exam timetable with room and venue info
- Add to Google Calendar or Apple Calendar (one-click)
- Class cancellation notifications (instant push)
- Room and venue map links
- Academic calendar milestones
- Personalized deadline tracker (all deadlines in one place)

#### 9g. Notifications & Reminders
- Push, email, and SMS alerts
- Customizable reminder preferences per notification type
- Fee due date alerts (7-day, 3-day, 1-day)
- Assignment and exam deadline reminders
- New announcement badges (unread count on nav)
- Missed class notifications
- Result publication and registration open/close alerts

#### 9h. Chat & Messaging
- Direct message to lecturers and tutors
- Class group chats (auto-created per course)
- Department announcements channel (read-only)
- Admin broadcast messages
- File and image sharing
- Message read receipts
- Searchable chat history
- End-to-end encrypted private messages

#### Additional Student Portal Features
- Counseling and mental health appointment booking (anonymity option)
- Health center visit records and sick note access
- Lost and found board
- Event RSVP and campus event calendar
- Clubs and societies discovery and membership
- Gamification (XP points, attendance streaks, badges, leaderboards)

---

### 10. Parent Portal
- Real-time child academic progress (grades, attendance, results)
- Fee payment on behalf of child
- Download report cards and transcripts
- Direct messaging with teachers
- Parent-teacher appointment booking
- Receive alerts and notifications (results, fees due, absence)

---

### 11. Student Life
- Clubs and societies management (create, join, manage membership, post activities)
- Sports team management (squads, fixtures, scores)
- Hostel / dormitory allocation and roommate management
- Maintenance request system (report and track issues)
- Cafeteria and meal plan management (purchase plans, view daily menus)
- Campus event management (create, RSVP, reminders)
- Mental health and counseling booking (with anonymity option)
- Visitor management (log, badge, and track campus visitors)
- Transportation and bus route management with live GPS (optional)

---

### 12. Elections & Governance
- Student government election management
- Candidate registration and vetting workflow
- Verified one-person-one-vote system
- Live result tallying and publication
- Polls and surveys (collect feedback from any user group)
- Formal petition system with signature thresholds
- Student senate / SRC portal and operations space

---

### 13. Digital Library
- E-library with book and journal catalog
- Digital borrowing with due dates and return reminders
- Research paper repository
- External database integration (JSTOR, Google Scholar links)
- Reading lists per course (linked by lecturers)

---

### 14. Career & Alumni
- Job board (employer postings, student applications)
- Internship management (placement tracking, supervisor feedback, completion certificates)
- CV / resume builder
- Career counselor booking
- Interview preparation resources
- Employer partner profiles and campus recruitment events
- Alumni network (graduate profiles, mentorship matching)
- Alumni giving / donations portal

---

### 15. Analytics & Reporting
- Role-specific dashboards (student, teacher, admin, finance, HR)
- Custom report builder (drag-and-drop, any data point)
- Enrollment trends and forecasting
- Revenue forecasting and analytics
- Teacher performance analytics
- Student pass/fail rate per course
- AI-powered early warning system (dropout risk flags)
- Accreditation report auto-generation
- Government / ministry compliance report formatting
- Data export (PDF, Excel, CSV)
- Audit logs (full trail — who did what, when)

---

### 16. AI & Intelligence
- AI academic advisor (course recommendations based on GPA and goals)
- AI chatbot (24/7 student and staff FAQ support)
- Smart timetable generator (conflict-free scheduling)
- Predictive analytics (enrollment, revenue, pass rates)
- Natural language search across the entire platform
- AI essay feedback before teacher review
- Attendance pattern anomaly detection

---

### 17. Operations & Facilities
- Asset management (equipment, furniture, devices with depreciation tracking)
- QR code attendance check-in for events and classes
- Maintenance and repair request tracking
- Facility and room booking calendar

---

### 18. Security & Compliance
- Role-based access control (RBAC) with granular permissions
- IP whitelisting for admin portal
- Full audit trail of all platform actions
- GDPR / data privacy compliance tools (consent, data export, right to erasure)
- Automated daily backups with point-in-time recovery
- Data encryption at rest and in transit

---

### 19. SaaS Infrastructure & Multi-Tenancy
- Multi-school (multi-tenant) architecture with fully isolated data per school
- Custom branding per school (logo, colors, custom domain: school.terasms.com)
- Subscription plans (Starter / Pro / Enterprise / University tiers)
- Super admin dashboard for Tera operators (tenant management, billing, usage)
- Open REST API with full documentation and sandbox environment
- Webhook support (trigger external systems on platform events)
- Multi-language support (English, French, Arabic, Swahili, Portuguese, etc.)
- Offline-first PWA mode for low-connectivity environments
- Mobile apps (iOS + Android) for students, staff, and parents
- Feature flags per tenant (enable/disable modules per subscription)
- Tenant-level usage limits (student cap, storage cap, admin seats)
- 99.9% uptime SLA with status page
- Automated daily backups with point-in-time recovery
- Data residency options (choose hosting region per tenant)

---

## SaaS Subscription Tiers & Pricing

### Tier 1 — Starter
**Target:** Small schools, primary/secondary schools, up to 500 students
**Billing:** Monthly or Annual (15% discount on annual)

Included:
- Up to 500 active students
- 5 admin seats
- Core academics (timetable, attendance, results, transcripts)
- Basic finance (fees, payments, receipts)
- Student portal + Gmail login
- Email notifications
- 10 GB storage
- Community support (help center + forum)
- Tera SM subdomain (school.terasms.com)
- Standard report exports (PDF, Excel)

Not included:
- LMS and live classes
- HR and payroll
- Parent portal
- AI features
- Custom domain
- API access
- Priority support

---

### Tier 2 — Pro
**Target:** Growing institutions, colleges, up to 3,000 students
**Billing:** Monthly or Annual (15% discount on annual)

Everything in Starter, plus:
- Up to 3,000 active students
- 20 admin seats
- Full LMS (content, assignments, grading, plagiarism detection, peer review)
- Live classes (built-in video conferencing, recording, whiteboard)
- HR management (employee records, leave, payroll, payslips)
- Parent portal
- Student life (clubs, events, hostel, cafeteria)
- WhatsApp and SMS notifications
- Push notifications (mobile + browser)
- Digital e-library
- Elections and voting module
- Custom branding (logo, colors, custom domain)
- 100 GB storage
- Basic analytics dashboard
- REST API access (read-only)
- Email + chat support (48h response)

---

### Tier 3 — Enterprise
**Target:** Large schools, multi-campus institutions, up to 10,000 students
**Billing:** Annual only (volume discount negotiable)

Everything in Pro, plus:
- Up to 10,000 active students
- Unlimited admin seats
- AI features (advisor, chatbot, early warning, predictive analytics, NLP search)
- Advanced analytics and custom report builder
- Accreditation and government compliance report generator
- Career center and alumni network
- Online proctored exams
- Multi-language support (choose up to 5 languages)
- Full REST API access (read + write) with webhooks
- White-label option (remove Tera SM branding)
- SSO (Google, Microsoft, institutional email)
- Dedicated onboarding specialist (first 30 days)
- 500 GB storage
- Priority support (8h response, dedicated Slack channel)
- 99.9% uptime SLA
- Data residency choice (region selection)
- Custom integrations (on request)

---

### Tier 4 — University
**Target:** Universities, polytechnics, large multi-campus systems, unlimited students
**Billing:** Annual contract (custom pricing)

Everything in Enterprise, plus:
- Unlimited students and staff
- Unlimited storage
- Thesis and dissertation portal
- Research paper repository
- Academic appeals and disciplinary case management
- Multi-campus management from single admin panel
- Dedicated cloud infrastructure (isolated, not shared)
- Custom SLA (99.95% uptime)
- On-premise deployment option
- Custom feature development (agreed roadmap items)
- Dedicated account manager
- 24/7 phone and Slack support
- Staff training and onboarding (on-site or virtual)
- Quarterly business reviews
- Integration with government education databases
- Custom data retention policies

---

### Add-Ons (Available on All Tiers)
| Add-On | Description |
|---|---|
| Extra Storage | +100 GB per billing cycle |
| SMS Credits Pack | Bulk SMS top-up (1,000 / 5,000 / 10,000 credits) |
| Extra Admin Seats | Add more admin/staff user seats beyond plan limit |
| Additional Language Pack | Add extra UI language beyond plan limit |
| Priority Onboarding | Dedicated setup specialist for 30 days |
| Custom Integration | One-off integration with third-party system |
| Branded Mobile App | School-branded iOS + Android app (custom build) |
| Proctored Exam Credits | Pay-per-exam for online proctoring sessions |
| Extra SMS/WhatsApp Notifications | Additional notification volume beyond plan quota |

---

### Billing Mechanics
- All plans billed in USD (local currency conversion at checkout)
- Annual plans invoiced upfront; monthly plans billed on the 1st of each month
- 14-day free trial on Starter and Pro (no credit card required)
- Pro-rated billing when upgrading mid-cycle
- Automatic downgrade to Starter if payment fails after 7-day grace period
- Student count measured by active (enrolled) students, not total accounts
- Schools receive usage alerts at 80% and 95% of their student cap
- Cancel anytime; data export provided within 30 days of cancellation
- Annual plans: 30-day refund window from first payment

---

## Landing Website

### Purpose
The public-facing marketing site for Tera SM. Converts school decision-makers (principals, registrars, IT heads, bursars) into paying customers. Clear, professional, trustworthy.

---

### Pages & Content

#### Home (/)
- Hero section: headline, sub-headline, primary CTA (Start Free Trial / Book a Demo)
- Animated product screenshots / short demo video loop
- "Trusted by X schools across Y countries" social proof bar
- Feature highlights (6 cards: Academics, Finance, LMS, HR, AI, Live Classes)
- How it works (3-step visual: Sign up → Customize → Go live)
- Testimonials carousel (school principals, admins, students)
- Pricing teaser section with CTA
- FAQ snippet (top 5 questions)
- Footer CTA (Start Free Trial)

#### Features (/features)
- Overview of all 19 modules with icons and short descriptions
- Each module links to its own deep-dive feature page
- Side-by-side comparison with generic competitors
- Feature request form ("Don't see what you need? Tell us.")

#### Feature Deep-Dive Pages (/features/[module])
- One page per major module (Academics, LMS, Finance, HR, Live Classes, AI, etc.)
- Screenshots and UI previews
- Key capabilities list
- Who it's for (student / teacher / admin perspective)
- Short demo video or GIF walkthrough
- Related features links

#### Pricing (/pricing)
- Tier cards side by side (Starter / Pro / Enterprise / University)
- Monthly / Annual toggle (show savings on annual)
- Feature comparison table (full breakdown per tier)
- Add-ons section
- FAQ (billing questions, trial, cancellation, upgrades)
- Enterprise CTA (custom quote form)
- Money-back guarantee badge, no credit card for trial badge

#### Solutions (/solutions)
- By institution type:
  - Primary & Secondary Schools
  - Colleges & Polytechnics
  - Universities
  - Vocational & Training Institutes
  - Multi-Campus Groups
- By role:
  - For School Administrators
  - For Teachers & Lecturers
  - For Students
  - For Parents
  - For Finance Offices
  - For HR Departments

#### Documentation (/docs)
- Getting started guide (onboarding walkthrough)
- Module-by-module documentation
- API reference (REST API endpoints, authentication, rate limits, sandbox)
- Webhook guide (events, payload formats, retry logic)
- Integration guides (Google, Microsoft, payment gateways, WhatsApp)
- Video tutorials library
- Changelog (what's new per version)
- Glossary
- Search across all docs (Algolia or built-in)

#### Blog (/blog)
- Articles on school management best practices
- Product updates and feature announcements
- Case studies (how School X improved with Tera SM)
- EdTech industry insights
- SEO-targeted content (e.g. "best school management software in Nigeria")
- Category filters (Product, Education, Case Studies, Guides)

#### Case Studies (/case-studies)
- Individual case study pages per school
- Problem → Solution → Results format
- Metrics (time saved, payment collection rate, attendance accuracy)
- Quote from school administrator
- CTA to book a demo

#### About (/about)
- Company mission and vision
- Team section (founders, key people)
- Company values
- Timeline / story of Tera SM
- Press and media mentions
- Contact information

#### Integrations (/integrations)
- All supported third-party integrations (Google, Microsoft, Paystack, Flutterwave, Stripe, Zoom, Jitsi, WhatsApp, Twilio, etc.)
- Each integration with logo, description, setup guide link
- API badge (for developers to build their own)

#### Security (/security)
- Data encryption details (at rest, in transit)
- Compliance (GDPR, FERPA, local data laws)
- Uptime and SLA information
- Backup and disaster recovery
- Penetration testing and audit information
- Privacy policy link
- Security contact / vulnerability disclosure

#### Status Page (/status)
- Real-time platform uptime indicators (per service/module)
- Incident history
- Subscribe to status alerts (email / SMS)

#### Contact & Support (/contact)
- Book a demo form (name, school, role, country, student count)
- General inquiry form
- Sales contact (email + WhatsApp)
- Support contact (existing customers)
- Office address / headquarters info

#### Careers (/careers)
- Open positions list (filterable by department)
- Company culture section
- Benefits and perks
- Application form per role

#### Legal
- Privacy Policy (/privacy)
- Terms of Service (/terms)
- Cookie Policy (/cookies)
- Data Processing Agreement (/dpa) — for GDPR compliance
- Acceptable Use Policy (/aup)

---

### Landing Website Tech Considerations
- Built with Next.js (fast, SEO-optimized, server-side rendering)
- CMS for blog and docs (Contentful, Sanity, or Notion-based)
- Analytics (Google Analytics + Hotjar heatmaps)
- Live chat widget (Intercom or Crisp) for sales and support
- Cookie consent banner (GDPR compliant)
- Newsletter signup (Mailchimp / ConvertKit integration)
- Open Graph and Twitter Card meta tags for social sharing
- Sitemap.xml and robots.txt for SEO
- Structured data (JSON-LD) for rich search results
- A/B testing on hero CTAs and pricing page

---

## Architecture & Tech Stack (Decided)

### Monorepo Structure
```
tera-sm/
├── apps/
│   ├── web/          → Next.js 15 (all portals + landing site)
│   ├── mobile/       → Expo React Native (iOS + Android)
│   └── api/          → NestJS backend
├── packages/
│   ├── ui/           → Shared shadcn/ui components
│   ├── types/        → Shared TypeScript types & Zod schemas
│   ├── config/       → Shared ESLint, Tailwind, TS configs
│   └── utils/        → Shared utility functions
├── prisma/           → Schema, migrations, seed
└── turbo.json        → Turborepo build orchestration
```
Monorepo tool: **Turborepo** (parallel builds, shared packages, caching)

---

### Frontend — Web
| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query |
| Client state | Zustand |
| Forms | React Hook Form + Zod |
| Real-time | Socket.IO client |
| Auth | NextAuth v5 (Auth.js) — Google OAuth + credentials |
| Animations | Framer Motion (landing site) |

### Mobile App
| Concern | Choice |
|---|---|
| Framework | React Native (Expo) |
| Navigation | Expo Router |
| Styling | NativeWind (Tailwind for RN) |
| Push notifications | Expo Notifications + Firebase FCM |

### Backend
| Concern | Choice |
|---|---|
| Runtime | Node.js |
| Framework | NestJS (modular, TypeScript-first, enterprise-grade) |
| API | REST + OpenAPI / Swagger docs |
| Real-time | Socket.IO server |
| ORM | Prisma |
| Background jobs | BullMQ (Redis-backed) — PDF gen, email, SMS, reports |

### Database Layer
| Concern | Choice |
|---|---|
| Primary DB | PostgreSQL |
| Hosting | Neon (serverless Postgres, auto-scaling, branching) |
| Multi-tenancy | Row-level with tenant_id + PostgreSQL Row Level Security (RLS) |
| Cache + queues | Redis via Upstash |
| Search + AI vectors | pgvector (built into PostgreSQL, no extra service) |

### File & Media
| Concern | Choice |
|---|---|
| Storage | Cloudflare R2 (S3-compatible, zero egress fees) |
| CDN | Cloudflare |
| PDF generation | @react-pdf/renderer (transcripts, payslips, receipts) |
| Video streaming | Cloudflare R2 + Stream (class recordings) |

### Live Classes
| Concern | Choice |
|---|---|
| Engine | LiveKit (open-source WebRTC SFU) |
| Features | Rooms, recording, screen share, breakout rooms — no per-minute fees |
| Hosting | Self-hosted on Railway or DigitalOcean VPS |

### Communications
| Concern | Choice |
|---|---|
| Email | Resend + React Email templates |
| SMS (Africa) | Africa's Talking |
| SMS (Global) | Twilio |
| WhatsApp | WhatsApp Business API (via Twilio or Meta direct) |
| Push (web + mobile) | Expo Notifications + Firebase FCM |

### Payments
| Gateway | Region |
|---|---|
| Paystack | Nigeria, Ghana, Kenya, South Africa |
| Flutterwave | Broader Africa + diaspora |
| Stripe | International / global schools |

All three run in parallel — each school selects gateway at setup.

### AI
| Concern | Choice |
|---|---|
| Primary LLM | Claude API (Anthropic) |
| Embeddings + RAG | pgvector in PostgreSQL |
| Agent orchestration | LangChain.js (Phase 9+) |

### Infrastructure & Hosting
| Service | Hosting |
|---|---|
| Next.js frontend | Vercel |
| NestJS backend | Railway |
| PostgreSQL | Neon |
| Redis | Upstash |
| File storage | Cloudflare R2 |
| LiveKit server | Railway / DigitalOcean VPS |
| CI/CD | GitHub Actions |
| Error monitoring | Sentry |
| Logging | Axiom |
| Uptime + status | BetterUptime |

---

## Build Phases (Proposed)

| Phase | Modules |
|---|---|
| Phase 1 | Auth, Admin Panel, RBAC, Student & Staff portals (skeleton), Onboarding |
| Phase 2 | Admissions, Academics, Timetable, Attendance, Results, Transcripts |
| Phase 3 | Finance — Fees, Payments, Scholarships, Payslips |
| Phase 4 | LMS — Content, Assignments, Grading, Plagiarism, Peer Review |
| Phase 5 | Live Classes, Class Recordings, Virtual Whiteboard |
| Phase 6 | HR — Recruitment, Payroll, Leave, Performance Reviews |
| Phase 7 | Communication — Chat (group + DM), Feed, WhatsApp/SMS, Push Notifications |
| Phase 8 | Parent Portal, Student Life, Clubs, Hostel, Cafeteria |
| Phase 9 | AI Features, Analytics, Early Warning, Custom Reports |
| Phase 10 | Elections, Alumni, Career Center, Digital Library |
| Phase 11 | Multi-Tenancy, Custom Branding, API, Webhooks, Mobile Apps |

---

## Open Decisions (To Confirm)

- [ ] Multi-language priority (which languages launch first?)
- [ ] Admin desktop app (Electron — which phase?)
- [ ] On-premise deployment for University tier (which phase?)
- [ ] Which payment gateway to integrate first (Paystack assumed for MVP)
- [ ] Brand name, domain, and colour scheme confirmed?
