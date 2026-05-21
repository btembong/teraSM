import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common'
import { EmployeesService } from './employees.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@Controller('hr/employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  findAll(@Req() req: any, @Query('search') search?: string) {
    return this.service.findAll(req.user.tenantId, search)
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.service.getStats(req.user.tenantId)
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.tenantId, id)
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user.tenantId, body)
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(req.user.tenantId, id, body)
  }
}
