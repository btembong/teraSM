import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ScholarshipsService } from './scholarships.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Scholarships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/scholarships')
export class ScholarshipsController {
  constructor(private svc: ScholarshipsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a scholarship or bursary' })
  create(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.create(u.tenantId, body)
  }

  @Get()
  @ApiOperation({ summary: 'List all scholarships' })
  findAll(@CurrentUser() u: any) {
    return this.svc.findAll(u.tenantId)
  }

  @Post('award')
  @ApiOperation({ summary: 'Award a scholarship to a student' })
  award(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.award(u.tenantId, body)
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get scholarships awarded to a student' })
  getStudentScholarships(@CurrentUser() u: any, @Param('studentId') studentId: string) {
    return this.svc.getStudentScholarships(u.tenantId, studentId)
  }

  @Patch('award/:id/status')
  @ApiOperation({ summary: 'Update scholarship award status' })
  updateStatus(
    @CurrentUser() u: any,
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.svc.updateStatus(id, u.tenantId, body.status, body.notes)
  }
}
