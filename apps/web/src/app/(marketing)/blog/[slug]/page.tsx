'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react'
import { ShareButton } from './share-button'

// ─── helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function wordCount(content: string[]) {
  return content.join(' ').split(/\s+/).filter(Boolean).length
}

function calcReadTime(words: number) {
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

// ─── Post data ────────────────────────────────────────────────────────────────

const POSTS: Record<string, {
  slug: string
  category: string
  title: string
  excerpt: string
  author: string
  authorRole: string
  authorInitials: string
  date: string
  content: string[]
}> = {
  'how-greenfield-increased-fee-collection-by-40-percent': {
    slug: 'how-greenfield-increased-fee-collection-by-40-percent',
    category: 'Case Studies',
    title: 'How Greenfield Academy increased fee collection by 40% in one term',
    excerpt: "After switching from manual invoicing to Tera SM's automated fee engine with MoMo integration, Greenfield Academy in Cameroon collected 94% of fees by week 6.",
    author: 'Dr. Funmilayo Adeyemi',
    authorRole: 'Head of Education, Tera SM',
    authorInitials: 'FA',
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
  'qr-attendance-vs-manual': {
    slug: 'qr-attendance-vs-manual',
    category: 'Guides',
    title: 'QR code attendance vs manual registers: what actually works in African schools',
    excerpt: "We analysed attendance data from 50+ institutions to understand where QR check-in outperforms paper registers — and where it doesn't.",
    author: 'Chidera Okafor',
    authorRole: 'CEO & Co-founder, Tera SM',
    authorInitials: 'CO',
    date: 'May 5, 2026',
    content: [
      "Every school in Africa has a version of the same story: a paper register that circulates 20 minutes into class, gets signed by students who arrived 10 minutes late, and ends up filed in a cabinet nobody opens again. By the time absence patterns are visible, the semester is nearly over.",
      "When we started building attendance tools into Tera SM, we debated whether QR code check-in was the right default. It felt obvious — but the data told a more nuanced story. After analysing attendance records from 50+ institutions over 18 months, here is what we actually found.",
      "## Where QR check-in wins decisively",
      "In lecture halls and classrooms with 50+ students, QR check-in is dramatically more accurate than paper. Students can't sign for absent friends — the check-in is time-stamped and tied to their device. In one university, introducing QR attendance correlated with a **22% reduction in proxy signing** within the first month, according to staff reports and re-audits of historical data.",
      "Speed is the other major advantage. A 300-student lecture that previously took 15 minutes to circulate a register now marks attendance in under 2 minutes. Lecturers display a rotating QR code on the projector. Students scan it on entry. The system closes check-in 10 minutes after class start — so latecomers are flagged, not absent, but the window for proxy fraud is narrow.",
      "Real-time alerts are the third win. When a student misses three consecutive sessions, the system flags the advisor and sends the student an automated nudge. Paper registers can't do this — by the time the data is compiled and reviewed, weeks have passed.",
      "## Where paper still has a place",
      "In smaller classes (under 20 students), QR check-in adds friction without adding accuracy. A lecturer who knows every student by name already has perfect attendance visibility — a QR code is overhead, not a solution.",
      "In rural or low-connectivity environments, QR check-in depends on students having a smartphone with a working camera and a data connection or Wi-Fi. Where connectivity is unreliable, we recommend **hybrid mode**: QR check-in where it works, manual override when it doesn't. Tera SM supports both in the same session.",
      "Practical tip: practical labs and field sessions are hard to QR-check because students move around. For these, manual attendance entry by the supervisor — directly into the platform — is faster and more reliable than a QR code that half the class missed while setting up equipment.",
      "## The hybrid approach most schools land on",
      "After working with 50+ institutions, the pattern that works best is QR check-in as the primary method for all scheduled lectures, with a simple manual override for exceptions. The override is logged — so it's still auditable, just not automated.",
      "**The real win isn't the QR code itself**. It's that attendance data flows into the same system as grades, fee records, and academic alerts. When a student at risk of dropout is absent three times, missing two assignments, and two weeks behind on fees, the system sees all three signals together. That's the early warning capability — and paper registers can never provide it.",
    ],
  },
  'transcript-authentication-qr': {
    slug: 'transcript-authentication-qr',
    category: 'Product',
    title: 'Solving transcript fraud with QR-authenticated documents',
    excerpt: "Forged transcripts cost African graduates job opportunities and institutions their credibility. Here's how Tera SM's QR authentication closes the gap.",
    author: 'Chidera Okafor',
    authorRole: 'CEO & Co-founder, Tera SM',
    authorInitials: 'CO',
    date: 'April 12, 2026',
    content: [
      "Transcript fraud is a quiet crisis in African higher education. Employers in Nigeria, Ghana, and Kenya regularly report receiving forged certificates and transcripts — sometimes sophisticated enough to fool HR departments. The problem isn't that institutions are careless. It's that physical documents, even with embossed seals and signatures, are fundamentally unverifiable without calling the institution directly.",
      "Tera SM's approach is to make verification instant, free, and impossible to fake — by embedding a cryptographically signed QR code on every transcript the platform generates.",
      "## How the QR authentication works",
      "When a student requests a transcript through Tera SM, the system generates a PDF with a unique QR code printed in the document footer. That code contains a signed hash of the student's academic record: name, student ID, programme, grades, graduation status, and date of issue.",
      "Anyone — an employer, a university admissions office, a visa officer — can scan the QR code with any smartphone camera. It opens a verification page hosted by Tera SM that shows the authentic record and confirms whether the document matches. No phone call to the registrar. No waiting for a stamp. Verification in under 10 seconds.",
      "The hash is signed with the institution's private key, which never leaves the Tera SM system. A forged document would need to reproduce the hash — which is computationally impossible without the key. Altering even a single grade in the PDF breaks the hash and the verification page shows a red 'Document tampered or not authentic' warning.",
      "## Why this matters more in Africa",
      "Transcript verification is disproportionately difficult in Africa for structural reasons: many institutions don't have a public verification portal, phone lines are unreliable for international checks, and the volume of transcript requests often overwhelms registrar offices. The result is that employers give up on verifying and either trust documents at face value or reject African applicants entirely — a lose-lose outcome.",
      "QR authentication removes the dependency on the institution being reachable. The verification is distributed: the authority is the cryptographic signature, not a phone call.",
      "## Watermarked PDFs and official vs unofficial",
      "Tera SM generates two transcript types. The **official transcript** carries the institution's logo, registrar's name, and the QR authentication code — suitable for submission to universities, government bodies, and employers. The **unofficial transcript** is instant-download, watermarked with 'UNOFFICIAL', useful for personal records or course selections.",
      "Both are generated in seconds. The days of students waiting 3–5 working days for a signed transcript — or paying additional fees for 'express' processing — are over.",
      "## Early results",
      "Institutions using QR transcripts report a significant drop in verification-related calls to the registrar's office — typically 70–80% fewer calls within the first semester of go-live. Employers who have used the verification portal describe it as 'the first time African transcripts have been as easy to verify as European ones.'",
      "The feature is available on Pro, Enterprise, and University plans. Institutions on Starter can generate plain PDF transcripts without the QR authentication layer.",
    ],
  },
  'school-management-nigeria-2026': {
    slug: 'school-management-nigeria-2026',
    category: 'Guides',
    title: 'Best school management software in Nigeria (2026 comparison)',
    excerpt: "A straightforward comparison of the leading school management platforms used by Nigerian institutions — what they do well, where they fall short, and who each is built for.",
    author: 'Jean-Baptiste Ngom',
    authorRole: 'Head of Growth, Tera SM',
    authorInitials: 'JN',
    date: 'April 6, 2026',
    content: [
      "Nigeria has one of the fastest-growing EdTech markets in Africa. There are over 60,000 registered schools and hundreds of thousands of higher education students. But the software options available to Nigerian school administrators still range from spreadsheets to legacy desktop systems that haven't been updated in years.",
      "This guide is for decision-makers — registrars, IT leads, bursars, and school owners — comparing the platforms that come up most often in conversations with Nigerian institutions.",
      "## What Nigerian schools actually need",
      "Before evaluating platforms, it's worth being clear about the Nigerian context. Schools here need mobile money integration (Paystack is dominant), SMS notifications because WhatsApp alone isn't reliable for fee reminders, offline functionality for periods of poor connectivity, and pricing in a realistic range for the local market. Any platform that doesn't support at least Paystack integration is a non-starter for most Nigerian fee collection workflows.",
      "## Tera SM",
      "Built specifically for African schools. Paystack and Flutterwave integration out of the box. Full LMS, live classes via WebRTC (no Zoom dependency), HR payroll, parent portal, and AI-powered academic advising. Multi-tenant SaaS — each school gets an isolated instance. Pricing starts at Starter ($99/month) up to University (custom). 14-day free trial. Strongest in higher education and multi-campus groups. **Best for:** Colleges, polytechnics, universities, and growing secondary schools.",
      "## Legacy desktop systems (e.g. School Manager Pro, Fedena)",
      "Common in secondary schools that made software investments 5–10 years ago. These handle timetabling and basic results management but lack mobile access, payment gateway integration, and real-time analytics. Maintenance is often handled by a local IT contractor. Upgrading is complicated by data migration costs. **Best for:** Schools that have already invested and can't afford migration friction — until they reach a breaking point.",
      "## Free/open-source options (OpenSIS, Gibbon)",
      "These are genuinely capable for basic SIS functionality but require technical staff to deploy, customise, and maintain. In practice, most Nigerian schools lack the in-house capacity to run these effectively without a vendor partner. They look free but the total cost of ownership — hosting, support, customisation — is often comparable to a paid SaaS. **Best for:** Schools with a dedicated in-house developer and limited budget.",
      "## WhatsApp + Excel (the unofficial competitor)",
      "More schools than anyone admits are still running critical operations — fee tracking, results, announcements — entirely via WhatsApp groups and Excel files. It works until it doesn't: data loss, privacy issues, no audit trail, and the inevitable reconciliation nightmare. **Best for:** Schools that haven't yet experienced a crisis.",
      "## Our recommendation",
      "For institutions that are growing, taking fee collection seriously, and want a platform that won't require a migration again in three years: Tera SM. For very small schools (under 100 students) with zero IT budget: Gibbon with a local support partner. For secondary schools already on a legacy system: plan the migration for next academic year, not five years from now.",
      "Tera SM offers a free 30-minute consultation for any Nigerian institution evaluating software — just book a demo and mention this article.",
    ],
  },
  'livekit-live-classes-africa': {
    slug: 'livekit-live-classes-africa',
    category: 'Product',
    title: 'How we built lag-free live classes for low-bandwidth African networks',
    excerpt: "Building WebRTC video conferencing that works on a 3G connection in Cameroon is a different engineering problem than building for a London office. Here's what we learned.",
    author: 'Amina Diallo',
    authorRole: 'CTO & Co-founder, Tera SM',
    authorInitials: 'AD',
    date: 'March 29, 2026',
    content: [
      "When we decided to build live classes into Tera SM, the easy choice was to integrate Zoom or Google Meet. Embed an iframe, done. But that approach has a fundamental problem for our market: it adds cost per user, requires students to install or register for a third-party app, and — most critically — Zoom's video quality degrades badly on the 3G connections that are common in much of the continent.",
      "We chose to build on **LiveKit**, an open-source WebRTC SFU (Selective Forwarding Unit), and host it ourselves. That decision came with real engineering challenges — and some hard-won lessons.",
      "## The bandwidth problem",
      "A standard Zoom call at default quality consumes 1.5–2.5 Mbps. In a lecture with 60 students on video, that's a significant load on any shared campus network or mobile data connection. In Yaounde or Kigali on a busy day, sustained 2 Mbps is not a given.",
      "Our first design decision was to make video adaptive from the start. LiveKit supports simulcast — each publisher sends three quality tiers (high, medium, low) simultaneously, and the SFU selects which tier to forward to each subscriber based on their available bandwidth. A student on a good connection gets full HD. A student on 3G gets a lower resolution stream that doesn't freeze or buffer.",
      "**The results from our beta:** median reconnect time dropped from 8.4 seconds to 1.1 seconds after we tuned the simulcast bitrate caps for African networks. Freeze events (video pausing for 2+ seconds) dropped by 71% compared to our Zoom baseline tests.",
      "## Audio-first design",
      "The second decision was to treat audio as non-negotiable and video as optional. When a student's connection drops below threshold, the system automatically disables their incoming video feeds and switches to audio-only mode — maintaining the class connection without dropping them entirely. The lecturer's video stays on; the class continues.",
      "Students can manually turn off all incoming video at any point with a single button. In practice, most students in bandwidth-constrained environments leave their own video off but want to see the lecturer. The layout adapts: the lecturer's feed is pinned and large; student feeds are thumbnails, hidden by default.",
      "## Self-hosting on Railway",
      "We self-host the LiveKit server on Railway in a region closest to our highest-density user base (currently us-east for coverage of West and Central Africa). This eliminates per-minute costs entirely — our live classes cost us compute, not a per-user fee. For institutions on the Pro plan running 50+ concurrent live sessions, the savings versus Zoom licensing are substantial.",
      "The tradeoff is operational responsibility. We run LiveKit in a high-availability configuration with automatic failover. If the primary node goes down mid-class, students reconnect to the failover node in under 3 seconds — class continues, recordings are preserved.",
      "## What's next",
      "We're currently testing a TURN relay server in Nairobi to reduce latency for East African institutions. We're also working on an offline recording fallback: if a student's connection drops entirely, the session is cached locally on the PWA and synced to the course page when connectivity returns.",
      "The goal isn't just video conferencing. It's a live class experience that works as well in Bukavu as it does in Lagos — and that any school can run without a video licence budget.",
    ],
  },
  'university-accreditation-reports': {
    slug: 'university-accreditation-reports',
    category: 'Education',
    title: 'Automating accreditation reports: what Nigerian and Ghanaian regulators want',
    excerpt: "NUC, NABTEB, NAB, GTEC — each has its own data requirements. Tera SM can generate compliant report formats automatically. Here's what each body looks for.",
    author: 'Dr. Funmilayo Adeyemi',
    authorRole: 'Head of Education, Tera SM',
    authorInitials: 'FA',
    date: 'March 21, 2026',
    content: [
      "Accreditation season is dreaded by every registrar's office in West Africa. In Nigeria, an NUC accreditation visit requires submission of detailed data on student-lecturer ratios, qualification levels, course load distributions, graduation rates, and facilities — often with less than 8 weeks' notice. In Ghana, the Ghana Tertiary Education Commission (GTEC) requires similar structured submissions for institutional licensing renewals.",
      "The problem isn't that institutions lack the data. It's that the data lives in 14 different places — Excel files, departmental records, paper registers, a legacy SIS — and reconciling it into the format regulators want takes weeks of manual work and creates room for error.",
      "## What the NUC looks for",
      "The National Universities Commission in Nigeria focuses on five data categories during programme accreditation visits: **staff-student ratio** per department and programme, **academic staff qualifications** (% with PhDs per department), **physical resources** (library holdings, lab equipment per student), **student performance data** (pass rates, graduation rates, carryovers per programme), and **curriculum compliance** (course offerings vs approved programme structure).",
      "In Tera SM, this data exists natively — it's captured as part of normal operations. Staff records include qualifications. Grades include pass rates. Course offerings include department and programme linkages. We generate NUC-formatted summary reports from this live data in minutes, not weeks.",
      "## What GTEC and NABTEB require",
      "Ghana's GTEC focuses more heavily on institutional governance data alongside academic metrics. They want to see enrolment trends over 3–5 years, financial sustainability indicators, student welfare data (counseling access, accommodation ratios), and evidence of internal quality assurance processes (assessment moderation, external examiner reports).",
      "NABTEB in Nigeria, which accredits technical and vocational institutions, adds practical assessment logs and industry placement records to the standard academic data.",
      "Tera SM's accreditation report builder lets administrators select which regulatory body's template to generate against, then outputs a structured PDF (and underlying data export) matched to that body's requirements.",
      "## The audit trail advantage",
      "One dimension regulators increasingly focus on is institutional data integrity — can the institution prove its reported numbers are accurate? With Tera SM, every grade, attendance record, and staff qualification is logged with a timestamp and user ID. The audit trail is automatic.",
      "During NUC visits, institutions can present this audit trail as evidence of data governance — a differentiator from institutions that compile data manually and can't show how or when it was recorded.",
      "## Practical advice for accreditation preparation",
      "Based on working with institutions through accreditation cycles, the three things that save the most time are: (1) keeping staff qualification records updated continuously, not just before accreditation — this alone eliminates 2–3 weeks of frantic data gathering; (2) configuring Tera SM's programme-course linkages correctly from the start so the student-course ratio reports are accurate without manual adjustment; and (3) generating the accreditation report draft 4 weeks before the deadline, not 4 days — this leaves time to identify gaps and correct them before the visit.",
    ],
  },
  'francophone-africa-expansion': {
    slug: 'francophone-africa-expansion',
    category: 'Product',
    title: 'Tera SM goes Francophone: full French support now live',
    excerpt: "Cameroon, Senegal, Côte d'Ivoire, Rwanda — Francophone Africa is home to some of the continent's fastest-growing education systems. Tera SM now fully supports French.",
    author: 'Jean-Baptiste Ngom',
    authorRole: 'Head of Growth, Tera SM',
    authorInitials: 'JN',
    date: 'March 10, 2026',
    content: [
      "When we started Tera SM, our first beta partners were in Nigeria and Ghana — English-speaking, familiar territory. But from month 3, we were getting inbound from Cameroon, Senegal, and Côte d'Ivoire. The interest was there. The language barrier was the problem.",
      "Today, Tera SM is fully available in French. Every interface — student portal, staff portal, admin panel, parent portal, and all email notifications — is now available in French, with automatic language detection based on the school's configuration.",
      "## What 'fully French' actually means",
      "It's tempting to call a product 'French-supported' after running the UI strings through Google Translate. We didn't do that. Every string in the product was reviewed by native French speakers from Cameroon and Senegal who understand education terminology in context.",
      "**Bilan académique** instead of a literal translation of 'academic summary'. **Relevé de notes** for transcript. **Frais de scolarité** for school fees. These aren't translation choices — they're the terms that administrators, parents, and students in Francophone Africa actually use. Getting them right matters for product trust.",
      "## What's different about Francophone markets",
      "Beyond language, there are structural differences in how schools in Francophone West Africa operate. The semester system often follows a French academic calendar model. Grading conventions differ — many Francophone institutions use a 20-point scale rather than percentages or letter grades.",
      "Tera SM now supports configurable grading scales at the tenant level. Institutions can set their own grade boundaries — whether that's 0–20, letter grades, or percentage thresholds — and all grade displays, report cards, and transcripts render accordingly.",
      "Mobile money integration in Francophone Africa also differs. Orange Money and MTN MoMo dominate in Cameroon, Senegal, and Guinea. Flutterwave supports these rails and is now the recommended payment gateway configuration for Francophone institutions on Tera SM.",
      "## First Francophone partners",
      "Our first Francophone go-live institutions include a bilingual secondary school group in Yaoundé (Cameroon), a management institute in Dakar (Senegal), and a vocational training centre in Abidjan (Côte d'Ivoire). Each had different operational models, and the French rollout stress-tested our localisation thoroughly.",
      "Greenfield Academy in Bafoussam — whose fee collection story we covered in an earlier case study — is one of the bilingual institutions. Their setup runs with French as the default language for parents and students, English for academic staff. Both languages work simultaneously within the same tenant.",
      "## What comes next",
      "Arabic support is in development for North African and Sahelian markets. Portuguese support for Lusophone Africa (Angola, Mozambique, Guinea-Bissau) is planned for late 2026. If you are an institution operating in Arabic or Portuguese and want to join an early access programme, reach out to us at hello@terasms.com.",
    ],
  },
  'ai-early-warning-dropout': {
    slug: 'ai-early-warning-dropout',
    category: 'Product',
    title: 'Introducing AI early warning: catch at-risk students before they drop out',
    excerpt: 'Our new AI model flags students who show patterns correlated with dropout — poor attendance, missed assignments, unpaid fees — so advisors can intervene early.',
    author: 'Amina Diallo',
    authorRole: 'CTO & Co-founder, Tera SM',
    authorInitials: 'AD',
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
      "The feature is now live for all Enterprise and University plan subscribers. Admins can access it at `Admin → AI & Intelligence → Early Warning`.",
    ],
  },
  'mobile-money-school-fees': {
    slug: 'mobile-money-school-fees',
    category: 'Education',
    title: 'Why mobile money is the future of school fee collection in Sub-Saharan Africa',
    excerpt: "With bank account penetration under 45% in many African markets, MoMo wallets are often the only payment rail parents trust.",
    author: 'Jean-Baptiste Ngom',
    authorRole: 'Head of Growth, Tera SM',
    authorInitials: 'JN',
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

// ─── All posts (for related + next) ──────────────────────────────────────────

const ALL_POSTS = [
  { slug: 'how-greenfield-increased-fee-collection-by-40-percent', category: 'Case Studies', title: 'How Greenfield Academy increased fee collection by 40% in one term',       date: 'May 8, 2026',    readTime: '8 min' },
  { slug: 'qr-attendance-vs-manual',                               category: 'Guides',       title: 'QR code attendance vs manual registers: what actually works',              date: 'May 5, 2026',    readTime: '6 min' },
  { slug: 'mobile-money-school-fees',                              category: 'Education',    title: 'Why mobile money is the future of school fee collection',                  date: 'April 28, 2026', readTime: '5 min' },
  { slug: 'ai-early-warning-dropout',                              category: 'Product',      title: 'Introducing AI early warning: catch at-risk students before they drop out', date: 'April 20, 2026', readTime: '4 min' },
  { slug: 'transcript-authentication-qr',                          category: 'Product',      title: 'Solving transcript fraud with QR-authenticated documents',                 date: 'April 12, 2026', readTime: '5 min' },
  { slug: 'school-management-nigeria-2026',                        category: 'Guides',       title: 'Best school management software in Nigeria (2026 comparison)',             date: 'April 6, 2026',  readTime: '10 min'},
  { slug: 'livekit-live-classes-africa',                           category: 'Product',      title: 'How we built lag-free live classes for low-bandwidth African networks',    date: 'March 29, 2026', readTime: '7 min' },
  { slug: 'university-accreditation-reports',                      category: 'Education',    title: 'Automating accreditation reports: what Nigerian and Ghanaian regulators want', date: 'March 21, 2026', readTime: '6 min' },
  { slug: 'francophone-africa-expansion',                          category: 'Product',      title: 'Tera SM goes Francophone: full French support now live',                   date: 'March 10, 2026', readTime: '3 min' },
]

const categoryBadge: Record<string, string> = {
  'Product':      'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400',
  'Education':    'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400',
  'Case Studies': 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400',
  'Guides':       'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
}

const authorColor: Record<string, string> = {
  'FA': 'bg-blue-600',
  'CO': 'bg-indigo-600',
  'JN': 'bg-sky-600',
  'AD': 'bg-violet-600',
}

// ─── Content renderer ─────────────────────────────────────────────────────────

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[13px] font-mono text-blue-700 dark:text-blue-400">{part.slice(1, -1)}</code>
    return part
  })
}

function ContentBlock({ block, idx }: { block: string; idx: number }) {
  if (block.startsWith('## ')) {
    const heading = block.replace('## ', '')
    return (
      <h2 id={slugify(heading)} key={idx} className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4 scroll-mt-24 first:mt-0">
        {heading}
      </h2>
    )
  }
  if (block.startsWith('> ')) {
    return (
      <blockquote key={idx} className="border-l-4 border-blue-500 pl-5 py-1 my-6 text-gray-600 dark:text-gray-300 italic leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 rounded-r-xl pr-4">
        {renderInline(block.slice(2))}
      </blockquote>
    )
  }
  return (
    <p key={idx} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
      {renderInline(block)}
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const post = POSTS[slug]

  const [progress, setProgress] = useState(0)
  const [showTitle, setShowTitle] = useState(false)
  const [activeToc, setActiveToc] = useState('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Compute TOC from ## headings
  const toc = useMemo(() => {
    if (!post) return []
    return post.content
      .filter(b => b.startsWith('## '))
      .map(b => {
        const text = b.replace('## ', '')
        return { text, id: slugify(text) }
      })
  }, [post])

  // Computed read time from word count
  const readTime = useMemo(() => {
    if (!post) return ''
    return calcReadTime(wordCount(post.content))
  }, [post])

  // Related posts: same category first, then fill with others
  const related = useMemo(() => {
    if (!post) return []
    const sameCategory = ALL_POSTS.filter(p => p.slug !== slug && p.category === post.category)
    const others = ALL_POSTS.filter(p => p.slug !== slug && p.category !== post.category)
    return [...sameCategory, ...others].slice(0, 3)
  }, [slug, post])

  // Next article
  const nextPost = useMemo(() => {
    const idx = ALL_POSTS.findIndex(p => p.slug === slug)
    return idx >= 0 && idx < ALL_POSTS.length - 1 ? ALL_POSTS[idx + 1] : ALL_POSTS[0]
  }, [slug])

  // Reading progress + title fade
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0)
      setShowTitle(window.scrollY > 280)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // TOC IntersectionObserver
  useEffect(() => {
    if (toc.length === 0) return
    observerRef.current = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) { setActiveToc(e.target.id); break }
        }
      },
      { rootMargin: '-15% 0px -75% 0px' }
    )
    toc.forEach(item => {
      const el = document.getElementById(item.id)
      if (el) observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [toc])

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-6xl font-black text-gray-200 dark:text-gray-800 mb-4">404</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Post not found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This article doesn't exist or has been moved.</p>
          <Link href="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 z-50 h-0.5 bg-blue-600 transition-all duration-75"
        style={{ width: `${progress}%` }}
      />

      {/* Sticky breadcrumb nav */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium flex-shrink-0">
            <ArrowLeft className="w-4 h-4" /> Blog
          </Link>
          {/* Article title fades in on scroll */}
          <p className={`text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1 text-center transition-all duration-300 ${showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
            {post.title}
          </p>
          <div className="flex-shrink-0">
            <ShareButton title={post.title} />
          </div>
        </div>
      </div>

      {/* Article header */}
      <header className="max-w-4xl mx-auto px-6 pt-14 pb-10">
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5 ${categoryBadge[post.category] ?? 'bg-gray-100 text-gray-700'}`}>
          {post.category}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
          {post.title}
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{post.excerpt}</p>

        {/* Author + meta */}
        <div className="flex items-center gap-4 pb-8 border-b border-gray-100 dark:border-gray-800">
          <div className={`w-11 h-11 rounded-full ${authorColor[post.authorInitials] ?? 'bg-blue-600'} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
            {post.authorInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{post.author}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{post.authorRole}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {readTime}</span>
          </div>
        </div>
      </header>

      {/* Article body + TOC */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex gap-14">
          {/* Content */}
          <article className="flex-1 min-w-0 space-y-5">
            {post.content.map((block, i) => (
              <ContentBlock key={i} block={block} idx={i} />
            ))}

            {/* Next article */}
            <div className="mt-14 pt-8 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-4">Next article</p>
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group flex items-center justify-between gap-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md hover:shadow-blue-50 dark:hover:shadow-blue-950/20 dark:hover:bg-gray-900 transition-all"
              >
                <div className="min-w-0">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${categoryBadge[nextPost.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {nextPost.category}
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {nextPost.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{nextPost.date} · {nextPost.readTime} read</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
              </Link>
            </div>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-center text-white">
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

          {/* TOC sidebar */}
          {toc.length > 0 && (
            <aside className="hidden xl:block w-48 flex-shrink-0">
              <div className="sticky top-24">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">On this page</p>
                <nav className="space-y-1">
                  {toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-xs py-1 pl-3 border-l-2 transition-all leading-snug ${
                        activeToc === item.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'border-transparent text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Author bio */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 flex items-start gap-4 border border-gray-100 dark:border-gray-800">
          <div className={`w-12 h-12 rounded-xl ${authorColor[post.authorInitials] ?? 'bg-blue-600'} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
            {post.authorInitials}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{post.author}</p>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                {post.authorRole}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Writing about education technology, African EdTech markets, and how schools can use better tools to serve students.
            </p>
          </div>
        </div>
      </div>

      {/* Related posts */}
      <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">More from the blog</h2>
            <Link href="/blog" className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {related.map(r => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md hover:shadow-blue-50 dark:hover:shadow-blue-950/20 hover:-translate-y-0.5 transition-all"
              >
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${categoryBadge[r.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {r.category}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 leading-snug text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">
                  {r.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-auto">
                  <Clock className="w-3 h-3" />
                  <span>{r.readTime} read</span>
                  <span>·</span>
                  <span>{r.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
