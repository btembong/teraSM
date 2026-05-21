import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class DiscussionsService {
  constructor(private prisma: PrismaService) {}

  async listThreads(tenantId: string, courseOfferingId: string) {
    return this.prisma.discussionThread.findMany({
      where: { tenantId, courseOfferingId },
      include: { _count: { select: { posts: true } } },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    })
  }

  async getThread(id: string) {
    return this.prisma.discussionThread.findUnique({
      where: { id },
      include: { posts: { orderBy: { createdAt: 'asc' } } },
    })
  }

  async createThread(tenantId: string, data: {
    courseOfferingId: string
    authorId: string
    title: string
  }) {
    return this.prisma.discussionThread.create({
      data: { tenantId, ...data },
    })
  }

  async createPost(tenantId: string, data: {
    threadId: string
    authorId: string
    content: string
    parentId?: string
  }) {
    const post = await this.prisma.discussionPost.create({
      data: { tenantId, ...data },
    })
    // bump thread updatedAt
    await this.prisma.discussionThread.update({
      where: { id: data.threadId },
      data: { updatedAt: new Date() },
    })
    return post
  }

  async pinThread(id: string, isPinned: boolean) {
    return this.prisma.discussionThread.update({ where: { id }, data: { isPinned } })
  }

  async lockThread(id: string, isLocked: boolean) {
    return this.prisma.discussionThread.update({ where: { id }, data: { isLocked } })
  }
}
