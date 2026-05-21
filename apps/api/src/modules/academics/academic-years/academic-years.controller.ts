import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AcademicYearsService } from './academic-years.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Academic Years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academics/years')
export class AcademicYearsController {
  constructor(private svc: AcademicYearsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an academic year' })
  create(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.create(u.tenantId, body)
  }

  @Get()
  findAll(@CurrentUser() u: any) {
    return this.svc.findAll(u.tenantId)
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current academic year with active semester' })
  getCurrent(@CurrentUser() u: any) {
    return this.svc.getCurrent(u.tenantId)
  }

  @Post('semesters')
  @ApiOperation({ summary: 'Create a semester under an academic year' })
  createSemester(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.createSemester(u.tenantId, body)
  }

  @Get(':yearId/semesters')
  getSemesters(@CurrentUser() u: any, @Param('yearId') yearId: string) {
    return this.svc.getSemesters(u.tenantId, yearId)
  }

  @Get('semesters/current')
  @ApiOperation({ summary: 'Get current semester' })
  getCurrentSemester(@CurrentUser() u: any) {
    return this.svc.getCurrentSemester(u.tenantId)
  }
}
