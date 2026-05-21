import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AttendanceService } from './attendance.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academics/attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  @Post('mark')
  @ApiOperation({ summary: 'Mark attendance for a course session' })
  mark(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.markAttendance(u.tenantId, {
      ...body,
      markedById: u.id,
    })
  }

  @Get('course/:courseOfferingId')
  @ApiOperation({ summary: 'Get attendance records for a course offering' })
  getCourse(
    @CurrentUser() u: any,
    @Param('courseOfferingId') courseOfferingId: string,
    @Query('date') date?: string,
  ) {
    return this.svc.getCourseAttendance(u.tenantId, courseOfferingId, date)
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get attendance records for a student' })
  getStudent(
    @CurrentUser() u: any,
    @Param('studentId') studentId: string,
    @Query('courseOfferingId') courseOfferingId?: string,
  ) {
    return this.svc.getStudentAttendance(u.tenantId, studentId, courseOfferingId)
  }

  @Get('summary/:courseOfferingId/:studentId')
  @ApiOperation({ summary: 'Get attendance summary for a student in a course' })
  getSummary(
    @CurrentUser() u: any,
    @Param('courseOfferingId') courseOfferingId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.svc.getAttendanceSummary(u.tenantId, courseOfferingId, studentId)
  }
}
