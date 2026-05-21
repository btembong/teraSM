import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private async nextInvoiceNo(tenantId: string): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.prisma.invoice.count({ where: { tenantId } })
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`
  }

  async create(tenantId: string, data: {
    studentId: string
    semesterId?: string
    items: Array<{ feeStructureId?: string; description: string; amount: number; quantity?: number }>
    dueDate?: Date
    notes?: string
  }) {
    const invoiceNo = await this.nextInvoiceNo(tenantId)
    const items = data.items.map((i) => ({
      feeStructureId: i.feeStructureId,
      description: i.description,
      amount: i.amount,
      quantity: i.quantity ?? 1,
      subtotal: i.amount * (i.quantity ?? 1),
    }))
    const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0)

    return this.prisma.invoice.create({
      data: {
        tenantId,
        studentId: data.studentId,
        semesterId: data.semesterId,
        invoiceNo,
        totalAmount,
        dueDate: data.dueDate,
        notes: data.notes,
        status: 'DRAFT',
        items: { create: items },
      },
      include: { items: true },
    })
  }

  async sendInvoice(id: string, tenantId: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, tenantId } })
    if (!inv) throw new NotFoundException('Invoice not found')
    if (inv.status !== 'DRAFT') throw new BadRequestException('Only draft invoices can be sent')
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'SENT', issuedAt: new Date() },
    })
  }

  async findAll(tenantId: string, studentId?: string, status?: string) {
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        ...(studentId ? { studentId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true, payments: { where: { status: 'SUCCESS' } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, tenantId: string) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { items: { include: { feeStructure: true } }, payments: true },
    })
    if (!inv) throw new NotFoundException('Invoice not found')
    return inv
  }

  async getStudentBalance(tenantId: string, studentId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, studentId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
    })
    const totalOwed = invoices.reduce((s, i) => s + i.totalAmount - i.paidAmount, 0)
    return { invoices, totalOwed }
  }

  async markOverdue(tenantId: string) {
    const now = new Date()
    return this.prisma.invoice.updateMany({
      where: {
        tenantId,
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    })
  }
}
