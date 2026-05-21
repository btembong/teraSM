import { Controller, Get, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common'
import { PayrollService } from './payroll.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@Controller('hr/payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Get('periods')
  getPeriods(@Req() req: any) {
    return this.service.getPeriods(req.user.tenantId)
  }

  @Get('periods/:id')
  getPeriod(@Req() req: any, @Param('id') id: string) {
    return this.service.getPeriod(req.user.tenantId, id)
  }

  @Post('periods')
  createPeriod(@Req() req: any, @Body() body: any) {
    return this.service.createPeriod(req.user.tenantId, body)
  }

  @Put('periods/:id/process')
  processPeriod(@Req() req: any, @Param('id') id: string) {
    return this.service.processPeriod(req.user.tenantId, id)
  }

  @Put('periods/:id/pay')
  markPaid(@Req() req: any, @Param('id') id: string) {
    return this.service.markPaid(req.user.tenantId, id)
  }

  @Put('payslips/:id')
  updatePayslip(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.updatePayslip(req.user.tenantId, id, body)
  }

  @Get('employee/:employeeId')
  getEmployeePayslips(@Req() req: any, @Param('employeeId') employeeId: string) {
    return this.service.getEmployeePayslips(req.user.tenantId, employeeId)
  }
}
