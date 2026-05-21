import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async initiate(tenantId: string, data: {
    studentId: string
    invoiceId: string
    amount: number
    method: string
    reference: string
  }) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId },
    })
    if (!invoice) throw new NotFoundException('Invoice not found')
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice is already fully paid')

    return this.prisma.payment.create({
      data: {
        tenantId,
        studentId: data.studentId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method as any,
        status: 'PENDING',
        reference: data.reference,
      },
    })
  }

  async confirm(reference: string, tenantId: string, gatewayResponse?: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { reference, tenantId },
      include: { invoice: true },
    })
    if (!payment) throw new NotFoundException('Payment not found')
    if (payment.status === 'SUCCESS') throw new BadRequestException('Payment already confirmed')

    // Mark payment as successful
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', paidAt: new Date(), gatewayResponse },
    })

    // Update invoice paid amount
    const newPaidAmount = payment.invoice.paidAmount + payment.amount
    const newStatus = newPaidAmount >= payment.invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID'

    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { paidAmount: newPaidAmount, status: newStatus as any },
    })

    return { success: true, newPaidAmount, invoiceStatus: newStatus }
  }

  async getStudentPayments(tenantId: string, studentId: string) {
    return this.prisma.payment.findMany({
      where: { tenantId, studentId, status: 'SUCCESS' },
      include: { invoice: true },
      orderBy: { paidAt: 'desc' },
    })
  }

  async getRevenueStats(tenantId: string, fromDate?: Date, toDate?: Date) {
    const where: any = { tenantId, status: 'SUCCESS' }
    if (fromDate || toDate) {
      where.paidAt = {}
      if (fromDate) where.paidAt.gte = fromDate
      if (toDate) where.paidAt.lte = toDate
    }

    const payments = await this.prisma.payment.findMany({ where })
    const total = payments.reduce((s, p) => s + p.amount, 0)

    // Group by payment method
    const byMethod: Record<string, number> = {}
    for (const p of payments) {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount
    }

    // Outstanding (sent + partially_paid + overdue invoices)
    const outstanding = await this.prisma.invoice.aggregate({
      where: { tenantId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
      _sum: { totalAmount: true, paidAmount: true },
    })
    const outstandingAmount =
      (outstanding._sum.totalAmount ?? 0) - (outstanding._sum.paidAmount ?? 0)

    return { total, byMethod, outstandingAmount, count: payments.length }
  }
}
