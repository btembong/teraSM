import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { generateVerificationCode } from '@/lib/transcript-token'
import { TranscriptDocument, type TranscriptData, type TranscriptGrade } from '@/lib/pdf/transcript'
import { createElement } from 'react'

// ─── Shared data fetch ────────────────────────────────────────────────────────

async function fetchTranscriptData(userId: string, tenantId: string) {
  const [user, tenant, grades] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, address: true, email: true, logoUrl: true },
    }),
    prisma.grade.findMany({
      where: { tenantId, studentId: userId, publishedAt: { not: null } },
      include: {
        courseOffering: {
          include: {
            course:   { include: { department: { select: { name: true } } } },
            semester: { include: { academicYear: { select: { name: true } } } },
          },
        },
      },
      orderBy: { courseOffering: { semester: { academicYear: { startYear: 'asc' } } } },
    }),
  ])

  return { user, tenant, grades }
}

function buildGrades(grades: Awaited<ReturnType<typeof fetchTranscriptData>>['grades']): TranscriptGrade[] {
  return grades.map(g => ({
    courseCode:  g.courseOffering.course.code,
    courseTitle: g.courseOffering.course.title,
    department:  g.courseOffering.course.department.name,
    creditHours: g.courseOffering.course.creditHours,
    totalScore:  g.totalScore,
    letterGrade: g.letterGrade,
    gradePoint:  g.gradePoint,
    semesterName: g.courseOffering.semester.name,
    yearName:     g.courseOffering.semester.academicYear.name,
  }))
}

function computeCGPA(grades: ReturnType<typeof buildGrades>) {
  let pts = 0, creds = 0
  for (const g of grades) {
    if (g.gradePoint == null) continue
    pts   += g.gradePoint * g.creditHours
    creds += g.creditHours
  }
  return { cgpa: creds > 0 ? pts / creds : 0, totalCredits: creds }
}

// ─── GET /api/student/transcript/pdf?type=official|unofficial ────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId   = (session.user as any).id   as string
  const tenantId = (session.user as any).tenantId as string

  const type = (req.nextUrl.searchParams.get('type') ?? 'unofficial') as 'official' | 'unofficial'

  const { user, tenant, grades } = await fetchTranscriptData(userId, tenantId)
  if (!user || !tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const gradeList   = buildGrades(grades)
  const { cgpa, totalCredits } = computeCGPA(gradeList)
  const isOfficial  = type === 'official'
  const issued      = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Official: create TranscriptRequest + generate QR ──────────────────────
  let verificationCode = ''
  let qrDataUrl: string | undefined
  let verifyUrl: string | undefined
  let docRef = `TR-UNOFF-${userId.slice(-8).toUpperCase()}`

  if (isOfficial) {
    // Create request record
    const tempId = `tmp-${userId}-${Date.now()}`
    verificationCode = generateVerificationCode(tempId, userId)

    const request = await (prisma as any).transcriptRequest.create({
      data: {
        tenantId,
        studentId:     userId,
        requestedById: userId,
        type:          'OFFICIAL',
        status:        'READY',
        verificationCode,
        generatedAt:   new Date(),
      },
    })
    // Re-sign with real DB id
    verificationCode = generateVerificationCode(request.id, userId)
    await (prisma as any).transcriptRequest.update({
      where: { id: request.id },
      data:  { verificationCode },
    })

    docRef     = `TR-${request.id.slice(-10).toUpperCase()}`
    verifyUrl  = `${process.env.NEXTAUTH_URL ?? 'https://terasms.com'}/verify/${verificationCode}`

    // Generate QR as PNG data URL
    qrDataUrl  = await QRCode.toDataURL(verifyUrl, {
      width: 160, margin: 1,
      color: { dark: '#1e3a8a', light: '#ffffff' },
    })
  }

  // ── Unofficial: fast HTML path ─────────────────────────────────────────────
  if (!isOfficial) {
    await (prisma as any).transcriptRequest.create({
      data: {
        tenantId, studentId: userId, requestedById: userId,
        type:     'UNOFFICIAL',
        status:   'READY',
        verificationCode: `UNOFF-${userId.slice(-8)}-${Date.now()}`,
        generatedAt: new Date(),
      },
    })

    const html = unofficialHtml({ user, tenant, gradeList, cgpa, totalCredits, issued, docRef })
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // ── Official: React-PDF ────────────────────────────────────────────────────
  const pdfData: TranscriptData = {
    schoolName:     tenant.name,
    schoolAddress:  tenant.address ?? '',
    schoolEmail:    tenant.email,
    logoUrl:        tenant.logoUrl ?? undefined,
    signatoryName:  'Registrar',
    signatoryTitle: 'Academic Affairs Office',
    firstName:      user.firstName,
    lastName:       user.lastName,
    email:          user.email,
    type:           'OFFICIAL',
    docRef,
    issuedAt:       issued,
    verificationCode,
    verifyUrl,
    grades:         gradeList,
    cgpa,
    totalCredits,
    qrDataUrl,
  }

  const buffer = await renderToBuffer(createElement(TranscriptDocument, { data: pdfData }))

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="transcript-${user.lastName.toLowerCase()}-official.pdf"`,
    },
  })
}

// ─── Unofficial HTML (fast, browser-print) ────────────────────────────────────

function unofficialHtml({ user, tenant, gradeList, cgpa, totalCredits, issued, docRef }: {
  user: { firstName: string; lastName: string; email: string }
  tenant: { name: string; address: string | null; email: string }
  gradeList: TranscriptGrade[]
  cgpa: number
  totalCredits: number
  issued: string
  docRef: string
}) {
  const byYear: Record<string, TranscriptGrade[]> = {}
  for (const g of gradeList) {
    if (!byYear[g.yearName]) byYear[g.yearName] = []
    byYear[g.yearName].push(g)
  }

  const rows = Object.entries(byYear).map(([yr, gs]) => {
    const yPts   = gs.reduce((s, g) => s + (g.gradePoint ?? 0) * g.creditHours, 0)
    const yCreds = gs.reduce((s, g) => s + g.creditHours, 0)
    const yGPA   = yCreds > 0 ? (yPts / yCreds).toFixed(2) : '—'
    return `
      <tr><td colspan="6" class="year-header">${yr}</td></tr>
      ${gs.map(g => `<tr>
        <td>${g.courseCode}</td><td>${g.courseTitle}</td><td>${g.department}</td>
        <td style="text-align:center">${g.creditHours}</td>
        <td style="text-align:center">${g.totalScore ?? '—'}</td>
        <td class="grade">${g.letterGrade ?? '—'}${g.gradePoint != null ? ` (${g.gradePoint.toFixed(1)})` : ''}</td>
      </tr>`).join('')}
      <tr><td colspan="5" style="text-align:right;font-size:8pt;color:#555;padding-right:10px">Year GPA</td><td class="grade" style="color:#2563eb">${yGPA}</td></tr>`
  }).join('')

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Unofficial Transcript — ${user.firstName} ${user.lastName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#111;padding:0}
.page{width:210mm;min-height:297mm;margin:0 auto;padding:16mm 20mm;position:relative}
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:72pt;font-weight:900;color:rgba(0,0,0,0.05);pointer-events:none;z-index:0;letter-spacing:6px}
.unofficial-banner{background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px 14px;margin-bottom:16px;font-size:9pt;color:#b91c1c;font-weight:600}
header{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:12px;margin-bottom:18px}
.school-name{font-size:17pt;font-weight:700;color:#1e3a8a}.school-meta{font-size:9pt;color:#555;margin-top:2px}
.doc-title h1{font-size:15pt;font-weight:700;color:#111;text-align:right}
.badge{display:inline-block;background:#dc2626;color:#fff;font-size:8pt;padding:2px 8px;border-radius:99px;margin-top:4px;float:right}
.info{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px}
.info .row{display:flex;gap:6px}.info .lbl{color:#94a3b8;font-size:8pt;min-width:90px;text-transform:uppercase;letter-spacing:.5px}.info .val{font-weight:600;font-size:9pt}
.summary{display:flex;gap:24px;margin-bottom:18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 16px}
.summary .s-lbl{font-size:8pt;color:#3b82f6;text-transform:uppercase;letter-spacing:.5px}.summary .s-num{font-size:15pt;font-weight:700;color:#1e3a8a}
h2{font-size:10pt;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px}
table{width:100%;border-collapse:collapse;font-size:9.5pt}
thead tr{background:#1e3a8a;color:#fff}
thead th{padding:7px 10px;text-align:left;font-weight:600;font-size:8.5pt}
tbody tr{border-bottom:1px solid #f1f5f9}
tbody tr:nth-child(even){background:#f8fafc}
td{padding:6px 10px}
.grade{font-weight:700;text-align:center}
.year-header{background:#e0f2fe;color:#0369a1;font-weight:700;padding:6px 10px;font-size:9pt}
footer{margin-top:28px;border-top:1px solid #e2e8f0;padding-top:10px;font-size:8pt;color:#94a3b8}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:10mm 14mm}}
</style></head><body>
<div class="watermark">UNOFFICIAL</div>
<div class="page">
<div class="unofficial-banner">⚠ UNOFFICIAL TRANSCRIPT — For reference only. Not valid for official submission.</div>
<header>
<div><div class="school-name">${tenant.name}</div><div class="school-meta">${tenant.address ?? ''}</div><div class="school-meta">${tenant.email}</div></div>
<div class="doc-title"><h1>Academic Transcript</h1><span class="badge">UNOFFICIAL</span></div>
</header>
<div class="info">
<div class="row"><span class="lbl">Student Name</span><span class="val">${user.firstName} ${user.lastName}</span></div>
<div class="row"><span class="lbl">Email</span><span class="val">${user.email}</span></div>
<div class="row"><span class="lbl">Document Ref</span><span class="val">${docRef}</span></div>
<div class="row"><span class="lbl">Date Issued</span><span class="val">${issued}</span></div>
</div>
<div class="summary">
<div class="stat"><div class="s-lbl">Cumulative GPA</div><div class="s-num">${cgpa.toFixed(2)}</div></div>
<div class="stat"><div class="s-lbl">Credits Earned</div><div class="s-num">${totalCredits}</div></div>
<div class="stat"><div class="s-lbl">Courses</div><div class="s-num">${gradeList.length}</div></div>
</div>
<h2>Academic Record</h2>
<table><thead><tr><th>Code</th><th>Course Title</th><th>Department</th><th style="text-align:center">Credits</th><th style="text-align:center">Score</th><th style="text-align:center">Grade</th></tr></thead>
<tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:20px">No published grades yet</td></tr>'}</tbody></table>
<footer>This is an unofficial transcript issued on ${issued}. ${tenant.name} accepts no responsibility for use of this document in official contexts.</footer>
</div>
<script>window.addEventListener('load',()=>window.print())</script>
</body></html>`
}
