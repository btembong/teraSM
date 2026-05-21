import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { TenantsModule } from './modules/tenants/tenants.module'
import { AcademicsModule } from './modules/academics/academics.module'
import { FinanceModule } from './modules/finance/finance.module'
import { LmsModule } from './modules/lms/lms.module'
import { LiveClassesModule } from './modules/live-classes/live-classes.module'
import { HrModule } from './modules/hr/hr.module'
import { ChatModule } from './modules/chat/chat.module'
import { AnnouncementsModule } from './modules/announcements/announcements.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import * as path from 'path'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../../.env'),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    AcademicsModule,
    FinanceModule,
    LmsModule,
    LiveClassesModule,
    HrModule,
    ChatModule,
    AnnouncementsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
