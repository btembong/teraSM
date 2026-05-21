import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common'
import { AssignmentsService } from './assignments.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@Controller('lms/assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private service: AssignmentsService) {}

  @Get()
  list(@Query('tenantId') tenantId: string, @Query('courseOfferingId') courseOfferingId?: string) {
    return this.service.list(tenantId, courseOfferingId)
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id)
  }

  @Get(':id/submissions')
  getSubmissions(@Param('id') id: string) {
    return this.service.getSubmissions(id)
  }

  @Post()
  create(@Body() body: any) {
    const { tenantId, ...data } = body
    return this.service.create(tenantId, data)
  }

  @Put(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publish(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body)
  }

  @Put('submissions/:submissionId/grade')
  grade(
    @Param('submissionId') submissionId: string,
    @Body() body: { score: number; feedback: string; gradedById: string },
  ) {
    return this.service.gradeSubmission(submissionId, body.score, body.feedback, body.gradedById)
  }
}
