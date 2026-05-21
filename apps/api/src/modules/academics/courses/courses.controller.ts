import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { CoursesService } from './courses.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academics/courses')
export class CoursesController {
  constructor(private svc: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a course' })
  create(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.create(u.tenantId, body)
  }

  @Get()
  @ApiOperation({ summary: 'List courses' })
  @ApiQuery({ name: 'departmentId', required: false })
  findAll(@CurrentUser() u: any, @Query('departmentId') departmentId?: string) {
    return this.svc.findAll(u.tenantId, departmentId)
  }

  @Get(':id')
  findOne(@CurrentUser() u: any, @Param('id') id: string) {
    return this.svc.findOne(id, u.tenantId)
  }

  @Patch(':id')
  update(@CurrentUser() u: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, u.tenantId, body)
  }

  @Post('offerings')
  @ApiOperation({ summary: 'Create a course offering for a semester' })
  createOffering(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.createOffering(u.tenantId, body)
  }

  @Get('offerings/semester/:semesterId')
  @ApiOperation({ summary: 'Get all course offerings for a semester' })
  getOfferings(@CurrentUser() u: any, @Param('semesterId') semesterId: string) {
    return this.svc.getOfferings(u.tenantId, semesterId)
  }
}
