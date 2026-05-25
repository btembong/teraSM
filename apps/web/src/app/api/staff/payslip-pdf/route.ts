import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const payslipId = searchParams.get('payslipId')
  if (!payslipId) return NextResponse.json({ error: 'Missing payslipId' }, { status: 400 })

  const employee = await prisma.employee.findUnique({ where: { userId }, select: { id: true, employeeNo: true, position: true } })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const payslip = await prisma.payslip.findFirst({
    where: { id: payslipId, employeeId: employee.id },
    include: { payrollPeriod: true },
  })
  if (!payslip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } })
  const tenant = await prisma.tenant.findUnique({ where: { id: (session.user as any).tenantId }, select: { name: true } })

  const period = payslip.payrollPeriod
  const label = period.name
  const gross = payslip.basicSalary + payslip.allowances
  const allowDetails = (payslip.allowanceDetails as Record<string, number> | null) ?? {}
  const dedDetails = (payslip.deductionDetails as Record<string, number> | null) ?? {}

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payslip – ${label}</title>
<style>
body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#111;font-size:14px}
h1{font-size:22px;margin:0}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #4f46e5;padding-bottom:16px}
.badge{background:#4f46e5;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0}
th{background:#f9fafb;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase}
.total{font-weight:700;font-size:15px;background:#f0fdf4;color:#166534}
.deduction{background:#fef2f2;color:#991b1b}
</style></head><body>
<div class="header">
  <div><h1>${tenant?.name ?? 'Tera SM'}</h1><p style="color:#6b7280;margin:4px 0">Payslip for ${label}</p></div>
  <span class="badge">${payslip.status}</span>
</div>
<table><tr><th>Employee</th><td>${user?.firstName} ${user?.lastName}</td><th>Employee No</th><td>${employee.employeeNo}</td></tr>
<tr><th>Position</th><td>${employee.position}</td><th>Email</th><td>${user?.email}</td></tr>
<tr><th>Pay Period</th><td>${period.name}</td>
<th>Paid On</th><td>${payslip.paidAt ? new Date(payslip.paidAt).toLocaleDateString() : '—'}</td></tr></table>
<table><tr><th colspan="2">Earnings</th><th colspan="2">Amount</th></tr>
<tr><td colspan="2">Basic Salary</td><td colspan="2">$${fmt(payslip.basicSalary)}</td></tr>
${Object.entries(allowDetails).map(([k, v]) => `<tr><td colspan="2">${k}</td><td colspan="2">$${fmt(v)}</td></tr>`).join('')}
<tr class="total"><td colspan="2">Gross Pay</td><td colspan="2">$${fmt(gross)}</td></tr></table>
<table><tr><th colspan="2">Deductions</th><th colspan="2">Amount</th></tr>
${Object.entries(dedDetails).map(([k, v]) => `<tr><td colspan="2">${k}</td><td colspan="2">$${fmt(v)}</td></tr>`).join('')}
${Object.keys(dedDetails).length === 0 ? `<tr><td colspan="2">Total Deductions</td><td colspan="2">$${fmt(payslip.deductions)}</td></tr>` : ''}
<tr class="total deduction"><td colspan="2">Total Deductions</td><td colspan="2">$${fmt(payslip.deductions)}</td></tr></table>
<table><tr class="total"><td colspan="2" style="font-size:18px">Net Pay</td><td colspan="2" style="font-size:18px">$${fmt(payslip.netPay)}</td></tr></table>
<p style="color:#9ca3af;font-size:11px;margin-top:32px">This is a computer-generated payslip and does not require a signature.</p>
</body></html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="payslip-${label.replace(' ', '-')}.html"`,
    },
  })
}
