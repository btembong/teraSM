import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common'
import { ChatService } from './chat.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.service.getConversations(req.user.tenantId, req.user.userId)
  }

  @Get('conversations/:id/messages')
  getMessages(@Req() req: any, @Param('id') id: string, @Query('cursor') cursor?: string) {
    return this.service.getMessages(req.user.tenantId, id, cursor)
  }

  @Post('dm')
  getOrCreateDM(@Req() req: any, @Body() body: { targetUserId: string }) {
    return this.service.getOrCreateDM(req.user.tenantId, req.user.userId, body.targetUserId)
  }

  @Post('groups')
  createGroup(@Req() req: any, @Body() body: { name: string; description: string; memberIds: string[] }) {
    return this.service.createGroup(req.user.tenantId, req.user.userId, body.name, body.description, body.memberIds)
  }

  @Post('conversations/:id/messages')
  sendMessage(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.sendMessage(req.user.tenantId, id, req.user.userId, body.content, body.fileUrl, body.fileName, body.fileType)
  }

  @Post('conversations/:id/read')
  markRead(@Req() req: any, @Param('id') id: string, @Body() body: { messageIds: string[] }) {
    return this.service.markRead(id, req.user.userId, body.messageIds)
  }

  @Get('unread')
  getUnreadCount(@Req() req: any) {
    return this.service.getUnreadCount(req.user.tenantId, req.user.userId)
  }
}
