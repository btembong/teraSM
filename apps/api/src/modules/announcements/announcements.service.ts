import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  findAll(tenantId: string, audience?: string) {
    return this.prisma.announcement.findMany({
      where: {
        tenantId,
        isPublished: true,
        ...(audience ? { OR: [{ audience: 'ALL' }, { audience: audience as any }] } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    })
  }

  findAllAdmin(tenantId: string) {
    return this.prisma.announcement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
  }

  create(tenantId: string, authorId: string, data: any) {
    return this.prisma.announcement.create({
      data: {
        tenantId,
        authorId,
        title: data.title,
        body: data.body,
        audience: data.audience ?? 'ALL',
        departmentId: data.departmentId,
        isPinned: data.isPinned ?? false,
        isPublished: data.isPublished ?? false,
        publishedAt: data.isPublished ? new Date() : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    })
  }

  update(tenantId: string, id: string, data: any) {
    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        body: data.body,
        audience: data.audience,
        isPinned: data.isPinned,
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    })
  }

  delete(id: string) {
    return this.prisma.announcement.delete({ where: { id } })
  }
}
