import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string, search?: string) {
    return this.prisma.employee.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { position: { contains: search, mode: 'insensitive' } },
                { employeeNo: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        leaveBalances: { include: { leaveType: true } },
        _count: { select: { leaveRequests: true, payslips: true } },
      },
      orderBy: { hireDate: 'desc' },
    })
  }

  findOne(tenantId: string, id: string) {
    return this.prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        leaveBalances: { include: { leaveType: true } },
        payslips: { orderBy: { createdAt: 'desc' }, take: 6, include: { payrollPeriod: true } },
        reviews: { orderBy: { year: 'desc' }, take: 5 },
      },
    })
  }

  create(tenantId: string, data: any) {
    const employeeNo = `EMP/${new Date().getFullYear()}/${Date.now().toString(36).toUpperCase()}`
    return this.prisma.employee.create({
      data: {
        tenantId,
        employeeNo,
        userId: data.userId,
        departmentId: data.departmentId,
        position: data.position,
        employmentType: data.employmentType ?? 'FULL_TIME',
        hireDate: new Date(data.hireDate),
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
        basicSalary: data.basicSalary ?? 0,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        nationalId: data.nationalId,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        address: data.address,
      },
    })
  }

  update(tenantId: string, id: string, data: any) {
    return this.prisma.employee.update({
      where: { id },
      data: {
        departmentId: data.departmentId,
        position: data.position,
        employmentType: data.employmentType,
        status: data.status,
        basicSalary: data.basicSalary,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        nationalId: data.nationalId,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        address: data.address,
      },
    })
  }

  getStats(tenantId: string) {
    return this.prisma.employee.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    })
  }
}
