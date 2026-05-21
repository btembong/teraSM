import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    name: string
    description?: string
    amount: number
    semesterId?: string
    level?: number
    programId?: string
    isRecurring?: boolean
    dueDate?: Date
    lateFee?: number
    lateFeeGraceDays?: number
  }) {
    return this.prisma.feeStructure.create({ data: { tenantId, ...data } })
  }

  async findAll(tenantId: string, semesterId?: string) {
    return this.prisma.feeStructure.findMany({
      where: { tenantId, isActive: true, ...(semesterId ? { semesterId } : {}) },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string, tenantId: string) {
    const fee = await this.prisma.feeStructure.findFirst({ where: { id, tenantId } })
    if (!fee) throw new NotFoundException('Fee structure not found')
    return fee
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findOne(id, tenantId)
    return this.prisma.feeStructure.update({ where: { id }, data })
  }

  async deactivate(id: string, tenantId: string) {
    await this.findOne(id, tenantId)
    return this.prisma.feeStructure.update({ where: { id }, data: { isActive: false } })
  }
}
