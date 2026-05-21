import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { EnrollmentsService } from './enrollments.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academics/enrollments')
export class EnrollmentsController {
  constructor(private svc: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Enroll a student in a course offering' })
  enroll(@CurrentUser() u: any, @Body() body: { studentId: string; courseOfferingId: string }) {
    return this.svc.enroll(u.tenantId, body.studentId, body.courseOfferingId)
  }

  @Delete('drop')
  @ApiOperation({ summary: 'Drop a course enrollment' })
  drop(@CurrentUser() u: any, @Body() body: { studentId: string; courseOfferingId: string }) {
    return this.svc.drop(u.tenantId, body.studentId, body.courseOfferingId)
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all enrollments for a student' })
  getStudentEnrollments(
    @CurrentUser() u: any,
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.svc.getStudentEnrollments(u.tenantId, studentId, semesterId)
  }

  @Get('course/:offeringId')
  @ApiOperation({ summary: 'Get all students enrolled in a course offering' })
  getCourseEnrollments(@CurrentUser() u: any, @Param('offeringId') offeringId: string) {
    return this.svc.getCourseEnrollments(u.tenantId, offeringId)
  }
}
