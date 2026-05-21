import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { GradesService } from './grades.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Grades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academics/grades')
export class GradesController {
  constructor(private svc: GradesService) {}

  @Post()
  @ApiOperation({ summary: 'Enter or update a grade' })
  upsert(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.upsertGrade(u.tenantId, body)
  }

  @Post('publish/:courseOfferingId')
  @ApiOperation({ summary: 'Publish all grades for a course offering' })
  publish(@CurrentUser() u: any, @Param('courseOfferingId') courseOfferingId: string) {
    return this.svc.publishGrades(u.tenantId, courseOfferingId)
  }

  @Get('course/:courseOfferingId')
  @ApiOperation({ summary: 'Get all grades for a course offering' })
  getCourseGrades(@CurrentUser() u: any, @Param('courseOfferingId') courseOfferingId: string) {
    return this.svc.getCourseGrades(u.tenantId, courseOfferingId)
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all grades for a student' })
  getStudentGrades(
    @CurrentUser() u: any,
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.svc.getStudentGrades(u.tenantId, studentId, semesterId)
  }

  @Get('transcript/:studentId')
  @ApiOperation({ summary: 'Get full academic transcript for a student' })
  getTranscript(@CurrentUser() u: any, @Param('studentId') studentId: string) {
    return this.svc.getTranscript(u.tenantId, studentId)
  }
}
