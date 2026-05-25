import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

function wrapHtml(body: string, title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><title>${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#111;background:#fff}
    .page{width:210mm;min-height:148mm;margin:0 auto;padding:14mm 16mm}
    header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d4ed8;padding-bottom:10px;margin-bottom:16px}
    .school{font-size:15pt;font-weight:700;color:#1d4ed8}.sub{font-size:9pt;color:#555;margin-top:2px}
    .doc-title h1{font-size:15pt;font-weight:700;text-align:right}.doc-title .period{font-size:9pt;color:#555;text-align:right;margin-top:3px}
    .employee-info{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;margin-bottom:16px}
    .row{display:flex;gap:6px}.label{color:#555;font-size:9pt;min-width:100px}.val{font-weight:600;font-size:9pt}
    .pay-table{width:100%;border-collapse:collapse;font-size:10pt}
    .pay-table th{background:#1d4ed8;color:#fff;padding:7px 12px;text-align:left;font-size:9pt}
    .pay-table td{padding:6px 12px;border-bottom:1px solid #f1f5f9}
    .pay-table tr:last-child td{border-bottom:none}
    .section-header td{background:#eff6ff;font-weight:700;color:#1e40af;font-size:9pt}
    .total-row td{font-weight:700;font-size:11pt;border-top:2px solid #1d4ed8;padding-top:8px}
    .netpay-box{background:#1d4ed8;color:#fff;text-align:right;padding:12px 16px;border-radius:6px;margin-top:14px}
    .netpay-box .lbl{font-size:9pt;opacity:.85}.netpay-box .amount{font-size:20pt;font-weight:700}
    footer{margin-top:16px;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;font-size:8pt;color:#888}
    .sig-line{width:140px;border-top:1px solid #333;margin-top:30px;padding-top:3px;font-size:8pt;color:#555}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:10mm 12mm}}
  </style>
</head>
<body>
  <div class="page">${body}</div>
  <script>window.addEventListener('load',()=>window.print())</script>
</body>
</html>`
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenantId = (session.user as any).tenantId as string
  const { id } = await params

  const payslip = await prisma.payslip.findFirst({
    where: { id, tenantId },
    include: {
      employee: true,
      payrollPeriod: true,
    },
  })
  if (!payslip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, address: true, email: true } })

  const emp  = payslip.employee
  const user = await prisma.user.findUnique({ where: { id: emp.userId }, select: { firstName: true, lastName: true, email: true } })
  const period = payslip.payrollPeriod

  const allowances = (payslip.allowanceDetails as any[] | null) ?? []
  const deductions = (payslip.deductionDetails as any[] | null) ?? []

  const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const allowanceRows = allowances.length > 0
    ? allowances.map((a: any) => `<tr><td>${a.label}</td><td style="text-align:right">${fmt(a.amount)}</td></tr>`).join('')
    : `<tr><td>Total Allowances</td><td style="text-align:right">${fmt(payslip.allowances)}</td></tr>`

  const deductionRows = deductions.length > 0
    ? deductions.map((d: any) => `<tr><td>${d.label}</td><td style="text-align:right">(${fmt(d.amount)})</td></tr>`).join('')
    : `<tr><td>Total Deductions</td><td style="text-align:right">(${fmt(payslip.deductions)})</td></tr>`

  const body = `
    <header>
      <div><div class="school">${tenant?.name}</div><div class="sub">${tenant?.address ?? ''}</div><div class="sub">${tenant?.email ?? ''}</div></div>
      <div class="doc-title"><h1>Pay Slip</h1><div class="period">${period.name}</div></div>
    </header>

    <div class="employee-info">
      <div class="row"><span class="label">Employee</span><span class="val">${user?.firstName} ${user?.lastName}</span></div>
      <div class="row"><span class="label">Employee No.</span><span class="val">${emp.employeeNo ?? '-'}</span></div>
      <div class="row"><span class="label">Department</span><span class="val">${emp.departmentId ?? '-'}</span></div>
      <div class="row"><span class="label">Position</span><span class="val">${emp.position ?? '-'}</span></div>
      <div class="row"><span class="label">Pay Period</span><span class="val">${period.name}</span></div>
      <div class="row"><span class="label">Pay Date</span><span class="val">${payslip.paidAt ? new Date(payslip.paidAt).toLocaleDateString('en-GB') : '-'}</span></div>
    </div>

    <table class="pay-table">
      <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr class="section-header"><td colspan="2">Earnings</td></tr>
        <tr><td>Basic Salary</td><td style="text-align:right">${fmt(payslip.basicSalary)}</td></tr>
        ${allowanceRows}
        <tr class="section-header"><td colspan="2">Deductions</td></tr>
        ${deductionRows}
      </tbody>
    </table>

    <div class="netpay-box">
      <div class="lbl">NET PAY — ${period.name}</div>
      <div class="amount">${fmt(payslip.netPay)}</div>
    </div>

    <footer>
      <div>
        <div class="sig-line">Authorised Signature</div>
      </div>
      <div style="text-align:right">
        <div>Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div style="margin-top:2px">Ref: PS-${id.slice(-8).toUpperCase()}</div>
      </div>
    </footer>`

  return new NextResponse(wrapHtml(body, `Payslip — ${user?.firstName} ${user?.lastName} — ${period.name}`), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
