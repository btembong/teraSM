import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common'
import { LeaveService } from './leave.service'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

@Controller('hr/leave')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private readonly service: LeaveService) {}

  @Get('types')
  getLeaveTypes(@Req() req: any) {
    return this.service.getLeaveTypes(req.user.tenantId)
  }

  @Post('types')
  createLeaveType(@Req() req: any, @Body() body: any) {
    return this.service.createLeaveType(req.user.tenantId, body)
  }

  @Get('requests')
  getRequests(@Req() req: any, @Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    return this.service.getRequests(req.user.tenantId, employeeId, status)
  }

  @Post('requests')
  createRequest(@Req() req: any, @Body() body: any) {
    return this.service.createRequest(req.user.tenantId, body.employeeId, body)
  }

  @Put('requests/:id/approve')
  approveRequest(@Req() req: any, @Param('id') id: string) {
    return this.service.approveRequest(req.user.tenantId, id, req.user.userId)
  }

  @Put('requests/:id/reject')
  rejectRequest(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.rejectRequest(req.user.tenantId, id, req.user.userId, body.note)
  }

  @Get('balances/:employeeId')
  getBalances(@Req() req: any, @Param('employeeId') employeeId: string) {
    return this.service.getBalances(req.user.tenantId, employeeId)
  }
}
