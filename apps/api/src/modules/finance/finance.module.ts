import { Module } from '@nestjs/common'
import { FeesModule } from './fees/fees.module'
import { InvoicesModule } from './invoices/invoices.module'
import { PaymentsModule } from './payments/payments.module'
import { ScholarshipsModule } from './scholarships/scholarships.module'

@Module({
  imports: [FeesModule, InvoicesModule, PaymentsModule, ScholarshipsModule],
  exports: [FeesModule, InvoicesModule, PaymentsModule, ScholarshipsModule],
})
export class FinanceModule {}
