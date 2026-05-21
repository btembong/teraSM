import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { name: string; code: string; description?: string; hodId?: string }) {
    const exists = await this.prisma.department.findUnique({ where: { tenantId_code: { tenantId, code: data.code } } })
    if (exists) throw new ConflictException(`Department code "${data.code}" already exists`)
    return this.prisma.department.create({ data: { tenantId, ...data } })
  }

  async findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { courses: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string, tenantId: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, tenantId }, include: { courses: true } })
    if (!dept) throw new NotFoundException('Department not found')
    return dept
  }

  async update(id: string, tenantId: string, data: Partial<{ name: string; description: string; hodId: string }>) {
    await this.findOne(id, tenantId)
    return this.prisma.department.update({ where: { id }, data })
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId)
    return this.prisma.department.delete({ where: { id } })
  }
}
