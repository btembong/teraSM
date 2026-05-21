import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { DepartmentsService } from './departments.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academics/departments')
export class DepartmentsController {
  constructor(private svc: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a department' })
  create(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.create(u.tenantId, body)
  }

  @Get()
  @ApiOperation({ summary: 'List all departments' })
  findAll(@CurrentUser() u: any) {
    return this.svc.findAll(u.tenantId)
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
  remove(@CurrentUser() u: any, @Param('id') id: string) {
    return this.svc.remove(id, u.tenantId)
  }
}
