import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function html(content: string, title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#111;background:#fff;padding:0}
    .page{width:210mm;min-height:297mm;margin:0 auto;padding:18mm 20mm}
    .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:80pt;font-weight:900;color:rgba(0,0,0,0.04);pointer-events:none;z-index:0;letter-spacing:8px}
    header{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:12px;margin-bottom:20px}
    .logo-block .school{font-size:18pt;font-weight:700;color:#1d4ed8}.logo-block .sub{font-size:9pt;color:#555;margin-top:2px}
    .doc-title{text-align:right}.doc-title h1{font-size:16pt;font-weight:700;color:#111}.doc-title .badge{display:inline-block;background:#1d4ed8;color:#fff;font-size:8pt;padding:2px 8px;border-radius:99px;margin-top:4px}
    .student-info{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px}
    .student-info .row{display:flex;gap:6px}.student-info .label{color:#555;font-size:9pt;min-width:90px}.student-info .val{font-weight:600;font-size:9pt}
    .summary-bar{display:flex;gap:24px;margin-bottom:20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px 16px}
    .summary-bar .stat .lbl{font-size:8pt;color:#3b82f6;text-transform:uppercase;letter-spacing:.5px}.summary-bar .stat .num{font-size:16pt;font-weight:700;color:#1d4ed8}
    h2{font-size:10pt;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.5px;margin:18px 0 8px}
    table{width:100%;border-collapse:collapse;font-size:9.5pt}
    thead tr{background:#1d4ed8;color:#fff}
    thead th{padding:7px 10px;text-align:left;font-weight:600;font-size:8.5pt}
    tbody tr{border-bottom:1px solid #f1f5f9}
    tbody tr:nth-child(even){background:#f8fafc}
    td{padding:6px 10px}
    .grade{font-weight:700;text-align:center}
    .grade-A{color:#16a34a}.grade-B{color:#2563eb}.grade-C{color:#d97706}.grade-D{color:#ea580c}.grade-F{color:#dc2626}
    .year-header{background:#e0f2fe;color:#0369a1;font-weight:700;padding:6px 10px;font-size:9pt}
    footer{margin-top:30px;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;align-items:flex-end}
    .sig-line{width:160px;border-top:1px solid #333;margin-top:40px;padding-top:4px;font-size:8pt;color:#555}
    .qr-placeholder{width:60px;height:60px;border:1px solid #ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:7pt;color:#999;text-align:center}
    .disclaimer{font-size:7.5pt;color:#888;margin-top:10px;text-align:center}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{padding:12mm 14mm}
      .no-print{display:none}
    }
  </style>
</head>
<body>
  <div class="watermark">OFFICIAL</div>
  <div class="page">${content}</div>
  <script>window.addEventListener('load',()=>window.print())</script>
</body>
</html>`
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId   = (session.user as any).id as string
  const tenantId = (session.user as any).tenantId as string

  const [user, tenant, grades] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true, createdAt: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, address: true, email: true, logoUrl: true } }),
    prisma.grade.findMany({
      where: { tenantId, studentId: userId, publishedAt: { not: null } },
      include: { courseOffering: { include: { course: { include: { department: true } }, semester: { include: { academicYear: true } } } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!user || !tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Group by year
  const byYear: Record<string, typeof grades> = {}
  for (const g of grades) {
    const yr = g.courseOffering.semester.academicYear.name
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(g)
  }

  let totalPoints = 0, totalCredits = 0
  for (const g of grades) {
    totalPoints  += (g.gradePoint ?? 0) * g.courseOffering.course.creditHours
    totalCredits += g.courseOffering.course.creditHours
  }
  const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
  const issued = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const rows = Object.entries(byYear).map(([yr, gs]) => {
    const yrPoints  = gs.reduce((s, g) => s + (g.gradePoint ?? 0) * g.courseOffering.course.creditHours, 0)
    const yrCredits = gs.reduce((s, g) => s + g.courseOffering.course.creditHours, 0)
    const semGPA    = yrCredits > 0 ? (yrPoints / yrCredits).toFixed(2) : '-'
    return `
      <tr><td colspan="5" class="year-header">${yr}</td></tr>
      ${gs.map(g => `
        <tr>
          <td>${g.courseOffering.course.code}</td>
          <td>${g.courseOffering.course.title}</td>
          <td>${g.courseOffering.course.department.name}</td>
          <td style="text-align:center">${g.courseOffering.course.creditHours}</td>
          <td class="grade grade-${(g.letterGrade ?? 'F').charAt(0)}">${g.letterGrade ?? '-'} ${g.gradePoint != null ? `(${g.gradePoint.toFixed(1)})` : ''}</td>
        </tr>`).join('')}
      <tr><td colspan="4" style="text-align:right;padding-right:12px;font-size:8.5pt;color:#555">Year GPA</td><td class="grade" style="color:#1d4ed8">${semGPA}</td></tr>`
  }).join('')

  const body = `
    <header>
      <div class="logo-block">
        <div class="school">${tenant.name}</div>
        <div class="sub">${tenant.address ?? ''}</div>
        <div class="sub">${tenant.email}</div>
      </div>
      <div class="doc-title">
        <h1>Official Transcript</h1>
        <div class="badge">Verified Document</div>
      </div>
    </header>

    <div class="student-info">
      <div class="row"><span class="label">Student Name</span><span class="val">${user.firstName} ${user.lastName}</span></div>
      <div class="row"><span class="label">Email</span><span class="val">${user.email}</span></div>
      <div class="row"><span class="label">Date Issued</span><span class="val">${issued}</span></div>
      <div class="row"><span class="label">Document Ref</span><span class="val">TR-${userId.slice(-8).toUpperCase()}</span></div>
    </div>

    <div class="summary-bar">
      <div class="stat"><div class="lbl">Cumulative GPA</div><div class="num">${cgpa}</div></div>
      <div class="stat"><div class="lbl">Credits Earned</div><div class="num">${totalCredits}</div></div>
      <div class="stat"><div class="lbl">Courses</div><div class="num">${grades.length}</div></div>
    </div>

    <h2>Academic Record</h2>
    <table>
      <thead><tr><th>Code</th><th>Course Title</th><th>Department</th><th style="text-align:center">Credits</th><th style="text-align:center">Grade</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#999;padding:20px">No published grades yet</td></tr>'}</tbody>
    </table>

    <footer>
      <div>
        <div class="sig-line">Registrar / Academic Affairs</div>
        <div class="disclaimer" style="margin-top:8px">This transcript is issued by ${tenant.name}. Verify authenticity at your institution's student portal.</div>
      </div>
      <div class="qr-placeholder">QR<br/>Verify</div>
    </footer>`

  return new NextResponse(html(body, `Transcript — ${user.firstName} ${user.lastName}`), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
