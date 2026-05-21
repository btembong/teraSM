import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common'
import { SubmissionsService } from './submissions.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@Controller('lms/submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private service: SubmissionsService) {}

  @Get('my')
  listByStudent(@Query('tenantId') tenantId: string, @Query('studentId') studentId: string) {
    return this.service.listByStudent(tenantId, studentId)
  }

  @Get('assignment/:assignmentId/student/:studentId')
  getMySubmission(
    @Query('tenantId') tenantId: string,
    @Param('assignmentId') assignmentId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getMySubmission(tenantId, assignmentId, studentId)
  }

  @Post()
  submit(@Body() body: any) {
    const { tenantId, ...data } = body
    return this.service.submit(tenantId, data)
  }
}
