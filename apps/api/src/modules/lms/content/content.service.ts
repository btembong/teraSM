import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, courseOfferingId: string) {
    return this.prisma.courseContent.findMany({
      where: { tenantId, courseOfferingId },
      orderBy: { order: 'asc' },
    })
  }

  async create(tenantId: string, data: {
    courseOfferingId: string
    title: string
    description?: string
    type: string
    url: string
    fileSize?: number
    order?: number
  }) {
    return this.prisma.courseContent.create({
      data: {
        tenantId,
        courseOfferingId: data.courseOfferingId,
        title: data.title,
        description: data.description,
        type: data.type as any,
        url: data.url,
        fileSize: data.fileSize,
        order: data.order ?? 0,
      },
    })
  }

  async publish(tenantId: string, id: string) {
    return this.prisma.courseContent.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    })
  }

  async update(tenantId: string, id: string, data: Partial<{
    title: string
    description: string
    url: string
    order: number
    isPublished: boolean
  }>) {
    return this.prisma.courseContent.update({ where: { id }, data })
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.courseContent.delete({ where: { id } })
  }
}
