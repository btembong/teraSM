import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  getForUser(@Req() req: any) {
    return this.service.getForUser(req.user.tenantId, req.user.userId)
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.service.getUnreadCount(req.user.tenantId, req.user.userId)
  }

  @Post('mark-read')
  markRead(@Req() req: any, @Body() body: { ids?: string[] }) {
    return this.service.markRead(req.user.tenantId, req.user.userId, body.ids)
  }
}
