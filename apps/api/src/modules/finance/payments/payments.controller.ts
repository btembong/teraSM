import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { PaymentsService } from './payments.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a payment for an invoice' })
  initiate(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.initiate(u.tenantId, body)
  }

  @Post('confirm/:reference')
  @ApiOperation({ summary: 'Confirm a payment (gateway webhook / manual)' })
  confirm(
    @CurrentUser() u: any,
    @Param('reference') reference: string,
    @Body() body: any,
  ) {
    return this.svc.confirm(reference, u.tenantId, body)
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get payment history for a student' })
  getStudentPayments(@CurrentUser() u: any, @Param('studentId') studentId: string) {
    return this.svc.getStudentPayments(u.tenantId, studentId)
  }

  @Get('stats/revenue')
  @ApiOperation({ summary: 'Get revenue statistics' })
  getRevenueStats(
    @CurrentUser() u: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.svc.getRevenueStats(
      u.tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    )
  }
}
