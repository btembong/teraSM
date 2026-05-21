import { Module } from '@nestjs/common'
import { EmployeesModule } from './employees/employees.module'
import { LeaveModule } from './leave/leave.module'
import { PayrollModule } from './payroll/payroll.module'

@Module({
  imports: [EmployeesModule, LeaveModule, PayrollModule],
})
export class HrModule {}
