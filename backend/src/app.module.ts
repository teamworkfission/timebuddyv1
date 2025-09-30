import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { BusinessesModule } from './businesses/businesses.module';
import { JobsModule } from './jobs/jobs.module';
import { EmployeesModule } from './employees/employees.module';
import { DocumentsModule } from './documents/documents.module';
import { JobApplicationsModule } from './job-applications/job-applications.module';
import { JoinRequestsModule } from './join-requests/join-requests.module';
import { SchedulesModule } from './schedules/schedules.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { SupportModule } from './support/support.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 20, // 20 requests per minute per IP
      },
    ]),
    AuthModule,
    BusinessesModule,
    JobsModule,
    EmployeesModule,
    DocumentsModule,
    JobApplicationsModule,
    JoinRequestsModule,
    SchedulesModule,
    PaymentsModule,
    AdminModule,
    SupportModule,
  ],
})
export class AppModule {}
