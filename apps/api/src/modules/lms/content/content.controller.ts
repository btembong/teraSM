import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ContentService } from './content.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@Controller('lms/content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private service: ContentService) {}

  @Get()
  list(@Query('tenantId') tenantId: string, @Query('courseOfferingId') courseOfferingId: string) {
    return this.service.list(tenantId, courseOfferingId)
  }

  @Post()
  create(@Body() body: any) {
    const { tenantId, ...data } = body
    return this.service.create(tenantId, data)
  }

  @Put(':id/publish')
  publish(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.service.publish(tenantId, id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const { tenantId, ...data } = body
    return this.service.update(tenantId, id, data)
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.service.delete(tenantId, id)
  }
}
