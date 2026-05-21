import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { FeesService } from './fees.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Fees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/fees')
export class FeesController {
  constructor(private svc: FeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a fee structure' })
  create(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.create(u.tenantId, body)
  }

  @Get()
  @ApiOperation({ summary: 'List all active fee structures' })
  findAll(@CurrentUser() u: any, @Query('semesterId') semesterId?: string) {
    return this.svc.findAll(u.tenantId, semesterId)
  }

  @Get(':id')
  findOne(@CurrentUser() u: any, @Param('id') id: string) {
    return this.svc.findOne(id, u.tenantId)
  }

  @Patch(':id')
  update(@CurrentUser() u: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, u.tenantId, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a fee structure' })
  deactivate(@CurrentUser() u: any, @Param('id') id: string) {
    return this.svc.deactivate(id, u.tenantId)
  }
}
