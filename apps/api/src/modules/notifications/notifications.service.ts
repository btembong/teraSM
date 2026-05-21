import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  getForUser(tenantId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  getUnreadCount(tenantId: string, userId: string) {
    return this.prisma.notification.count({ where: { tenantId, userId, isRead: false } })
  }

  create(tenantId: string, userId: string, data: { type: any; title: string; body: string; link?: string }) {
    return this.prisma.notification.create({
      data: { tenantId, userId, ...data },
    })
  }

  async createBulk(tenantId: string, userIds: string[], data: { type: any; title: string; body: string; link?: string }) {
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ tenantId, userId, ...data })),
      skipDuplicates: true,
    })
  }

  async markRead(tenantId: string, userId: string, ids?: string[]) {
    await this.prisma.notification.updateMany({
      where: { tenantId, userId, ...(ids?.length ? { id: { in: ids } } : {}) },
      data: { isRead: true, readAt: new Date() },
    })
  }
}
