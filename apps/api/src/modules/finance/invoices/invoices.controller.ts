import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { InvoicesService } from './invoices.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/invoices')
export class InvoicesController {
  constructor(private svc: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an invoice for a student' })
  create(@CurrentUser() u: any, @Body() body: any) {
    return this.svc.create(u.tenantId, body)
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send a draft invoice to the student' })
  send(@CurrentUser() u: any, @Param('id') id: string) {
    return this.svc.sendInvoice(id, u.tenantId)
  }

  @Post('mark-overdue')
  @ApiOperation({ summary: 'Mark all past-due invoices as overdue' })
  markOverdue(@CurrentUser() u: any) {
    return this.svc.markOverdue(u.tenantId)
  }

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  findAll(
    @CurrentUser() u: any,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.findAll(u.tenantId, studentId, status)
  }

  @Get('student/:studentId/balance')
  @ApiOperation({ summary: 'Get outstanding balance for a student' })
  getBalance(@CurrentUser() u: any, @Param('studentId') studentId: string) {
    return this.svc.getStudentBalance(u.tenantId, studentId)
  }

  @Get(':id')
  findOne(@CurrentUser() u: any, @Param('id') id: string) {
    return this.svc.findOne(id, u.tenantId)
  }
}
