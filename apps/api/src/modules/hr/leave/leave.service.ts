import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  // Leave types
  getLeaveTypes(tenantId: string) {
    return this.prisma.leaveType.findMany({ where: { tenantId, isActive: true } })
  }

  createLeaveType(tenantId: string, data: any) {
    return this.prisma.leaveType.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        daysPerYear: data.daysPerYear ?? 21,
        isPaid: data.isPaid ?? true,
        requiresProof: data.requiresProof ?? false,
      },
    })
  }

  // Leave requests
  getRequests(tenantId: string, employeeId?: string, status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        employee: { include: { leaveBalances: true } },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  createRequest(tenantId: string, employeeId: string, data: any) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: start,
        endDate: end,
        days,
        reason: data.reason,
      },
    })
  }

  async approveRequest(tenantId: string, id: string, approverId: string) {
    const request = await this.prisma.leaveRequest.findFirst({ where: { id, tenantId } })
    if (!request) throw new Error('Request not found')

    await this.prisma.leaveBalance.updateMany({
      where: {
        tenantId,
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year: new Date().getFullYear(),
      },
      data: {
        used: { increment: request.days },
        pending: { decrement: request.days },
        remaining: { decrement: request.days },
      },
    })

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
    })
  }

  rejectRequest(tenantId: string, id: string, approverId: string, note?: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedById: approverId, approvedAt: new Date(), rejectedNote: note },
    })
  }

  // Leave balances
  getBalances(tenantId: string, employeeId: string) {
    return this.prisma.leaveBalance.findMany({
      where: { tenantId, employeeId, year: new Date().getFullYear() },
      include: { leaveType: true },
    })
  }
}
