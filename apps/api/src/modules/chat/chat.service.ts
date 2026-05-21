import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // Get all conversations for a user
  getConversations(tenantId: string, userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        tenantId,
        participants: { some: { userId } },
        isArchived: false,
      },
      include: {
        participants: { select: { userId: true, lastReadAt: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    })
  }

  // Get messages for a conversation
  getMessages(tenantId: string, conversationId: string, cursor?: string) {
    return this.prisma.message.findMany({
      where: { conversationId, tenantId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
  }

  // Create or find DM between two users
  async getOrCreateDM(tenantId: string, userAId: string, userBId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        type: 'DIRECT',
        participants: { every: { userId: { in: [userAId, userBId] } } },
      },
      include: { participants: true },
    })
    if (existing && existing.participants.length === 2) return existing

    return this.prisma.conversation.create({
      data: {
        tenantId,
        type: 'DIRECT',
        createdById: userAId,
        participants: {
          create: [
            { tenantId, userId: userAId },
            { tenantId, userId: userBId },
          ],
        },
      },
      include: { participants: true },
    })
  }

  // Create group chat (e.g. for a course)
  createGroup(tenantId: string, createdById: string, name: string, description: string, memberIds: string[]) {
    const allMemberIds = [...new Set([createdById, ...memberIds])]
    return this.prisma.conversation.create({
      data: {
        tenantId,
        type: 'GROUP',
        name,
        description,
        createdById,
        participants: {
          create: allMemberIds.map((uid) => ({ tenantId, userId: uid, isAdmin: uid === createdById })),
        },
      },
      include: { participants: true },
    })
  }

  // Send a message
  async sendMessage(tenantId: string, conversationId: string, senderId: string, content: string, fileUrl?: string, fileName?: string, fileType?: string) {
    const message = await this.prisma.message.create({
      data: { tenantId, conversationId, senderId, content, fileUrl, fileName, fileType },
    })
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    })
    return message
  }

  // Mark messages as read
  async markRead(conversationId: string, userId: string, messageIds: string[]) {
    await this.prisma.messageReadReceipt.createMany({
      data: messageIds.map((messageId) => ({ messageId, userId })),
      skipDuplicates: true,
    })
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    })
  }

  // Get unread count for a user
  async getUnreadCount(tenantId: string, userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId, participants: { some: { userId } } },
      include: { participants: { where: { userId } } },
    })

    let total = 0
    for (const conv of conversations) {
      const participant = conv.participants[0]
      const lastReadAt = participant?.lastReadAt
      const unread = await this.prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          isDeleted: false,
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      })
      total += unread
    }
    return { unread: total }
  }
}
