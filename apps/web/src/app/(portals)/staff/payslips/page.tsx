import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText, Download, DollarSign } from 'lucide-react'
import Link from 'next/link'

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function StaffPayslipsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const employee = await prisma.employee.findUnique({
    where: { userId },
    select: { id: true, employeeNo: true, position: true, basicSalary: true },
  })

  if (!employee) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No employee record found.</p>
        <p className="text-sm text-gray-400 mt-1">Contact HR to link your account to an employee profile.</p>
      </div>
    )
  }

  const payslips = await prisma.payslip.findMany({
    where: { employeeId: employee.id },
    include: { payrollPeriod: true },
    orderBy: [{ payrollPeriod: { year: 'desc' } }, { payrollPeriod: { month: 'desc' } }],
  })

  // Annual tax summary (group by year)
  const byYear: Record<number, { gross: number; deductions: number; net: number; count: number }> = {}
  payslips.forEach(p => {
    const year = p.payrollPeriod.year
    if (!byYear[year]) byYear[year] = { gross: 0, deductions: 0, net: 0, count: 0 }
    byYear[year].gross += p.basicSalary + p.allowances
    byYear[year].deductions += p.deductions
    byYear[year].net += p.netPay
    byYear[year].count++
  })

  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payslips & Tax</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {employee.employeeNo} · {employee.position}
        </p>
      </div>

      {/* Annual tax summary */}
      {Object.keys(byYear).length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">Annual Tax Summary</h2>
          {Object.entries(byYear).sort(([a], [b]) => Number(b) - Number(a)).map(([year, data]) => (
            <div key={year} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{year} Tax Year</h3>
                <Link
                  href={`/api/staff/tax-certificate?year=${year}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Tax Certificate
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">${fmt(data.gross)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Gross Earnings</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-red-600">${fmt(data.deductions)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total Deductions</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-green-600">${fmt(data.net)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Net Pay</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payslip list */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Monthly Payslips</h2>
        {payslips.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-400">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No payslips found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payslips.map(p => {
              const period = p.payrollPeriod
              const label = period.name
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Gross: ${fmt(p.basicSalary + p.allowances)} · Deductions: ${fmt(p.deductions)} · Net: ${fmt(p.netPay)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status}
                  </span>
                  <Link
                    href={`/api/staff/payslip-pdf?payslipId=${p.id}`}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
