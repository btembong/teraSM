import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  getPeriods(tenantId: string) {
    return this.prisma.payrollPeriod.findMany({
      where: { tenantId },
      include: { _count: { select: { payslips: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
  }

  getPeriod(tenantId: string, id: string) {
    return this.prisma.payrollPeriod.findFirst({
      where: { id, tenantId },
      include: {
        payslips: {
          include: { employee: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  async createPeriod(tenantId: string, data: any) {
    const month = data.month ?? new Date().getMonth() + 1
    const year = data.year ?? new Date().getFullYear()
    const name = data.name ?? `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`

    const period = await this.prisma.payrollPeriod.create({
      data: { tenantId, name, month, year },
    })

    // Auto-generate payslips for all active employees
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE' },
    })

    if (employees.length > 0) {
      await this.prisma.payslip.createMany({
        data: employees.map((e) => ({
          tenantId,
          employeeId: e.id,
          payrollPeriodId: period.id,
          basicSalary: e.basicSalary,
          allowances: 0,
          deductions: 0,
          netPay: e.basicSalary,
        })),
        skipDuplicates: true,
      })
    }

    return period
  }

  updatePayslip(tenantId: string, id: string, data: any) {
    const netPay = (data.basicSalary ?? 0) + (data.allowances ?? 0) - (data.deductions ?? 0)
    return this.prisma.payslip.update({
      where: { id },
      data: {
        basicSalary: data.basicSalary,
        allowances: data.allowances,
        deductions: data.deductions,
        netPay,
        allowanceDetails: data.allowanceDetails,
        deductionDetails: data.deductionDetails,
      },
    })
  }

  async processPeriod(tenantId: string, id: string) {
    return this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: 'PROCESSING', processedAt: new Date() },
    })
  }

  async markPaid(tenantId: string, id: string) {
    await this.prisma.payslip.updateMany({
      where: { payrollPeriodId: id, tenantId },
      data: { status: 'PAID', paidAt: new Date() },
    })
    return this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    })
  }

  getEmployeePayslips(tenantId: string, employeeId: string) {
    return this.prisma.payslip.findMany({
      where: { tenantId, employeeId },
      include: { payrollPeriod: true },
      orderBy: { createdAt: 'desc' },
    })
  }
}
