import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common'
import { DiscussionsService } from './discussions.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@Controller('lms/discussions')
@UseGuards(JwtAuthGuard)
export class DiscussionsController {
  constructor(private service: DiscussionsService) {}

  @Get('threads')
  listThreads(@Query('tenantId') tenantId: string, @Query('courseOfferingId') courseOfferingId: string) {
    return this.service.listThreads(tenantId, courseOfferingId)
  }

  @Get('threads/:id')
  getThread(@Param('id') id: string) {
    return this.service.getThread(id)
  }

  @Post('threads')
  createThread(@Body() body: any) {
    const { tenantId, ...data } = body
    return this.service.createThread(tenantId, data)
  }

  @Post('posts')
  createPost(@Body() body: any) {
    const { tenantId, ...data } = body
    return this.service.createPost(tenantId, data)
  }

  @Put('threads/:id/pin')
  pinThread(@Param('id') id: string, @Body('isPinned') isPinned: boolean) {
    return this.service.pinThread(id, isPinned)
  }

  @Put('threads/:id/lock')
  lockThread(@Param('id') id: string, @Body('isLocked') isLocked: boolean) {
    return this.service.lockThread(id, isLocked)
  }
}
