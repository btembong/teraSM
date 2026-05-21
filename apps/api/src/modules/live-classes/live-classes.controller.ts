import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common'
import { LiveClassesService } from './live-classes.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('live-classes')
@UseGuards(JwtAuthGuard)
export class LiveClassesController {
  constructor(private service: LiveClassesService) {}

  @Get()
  list(@Query('tenantId') tenantId: string, @Query('courseOfferingId') courseOfferingId?: string) {
    return this.service.list(tenantId, courseOfferingId)
  }

  @Get('upcoming')
  upcoming(@Query('tenantId') tenantId: string, @Query('offeringIds') offeringIds: string) {
    const ids = offeringIds ? offeringIds.split(',') : []
    return this.service.upcoming(tenantId, ids)
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id)
  }

  @Post()
  create(@Body() body: any) {
    const { tenantId, ...data } = body
    return this.service.create(tenantId, data)
  }

  @Post(':id/token')
  generateToken(
    @Param('id') id: string,
    @Body() body: { userId: string; userName: string; isTeacher?: boolean },
  ) {
    return this.service.generateToken(id, body.userId, body.userName, body.isTeacher ?? false)
  }

  @Put(':id/start')
  start(@Param('id') id: string) {
    return this.service.start(id)
  }

  @Put(':id/end')
  end(@Param('id') id: string) {
    return this.service.end(id)
  }

  @Put(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id)
  }

  @Post(':id/join')
  trackJoin(@Param('id') id: string, @Body() body: { tenantId: string; userId: string }) {
    return this.service.trackJoin(body.tenantId, id, body.userId)
  }

  @Post(':id/leave')
  trackLeave(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.service.trackLeave(id, body.userId)
  }

  @Post(':id/recordings')
  addRecording(
    @Param('id') id: string,
    @Body() body: { tenantId: string; url: string; duration?: number; fileSize?: number },
  ) {
    return this.service.addRecording(body.tenantId, id, body.url, body.duration, body.fileSize)
  }
}
