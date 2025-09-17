import { Module } from '@nestjs/common';
import { JobApplicationsController } from './job-applications.controller';
import { JobApplicationsService } from './job-applications.service';
import { SupabaseService } from '../config/supabase.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [JobApplicationsController],
  providers: [JobApplicationsService, SupabaseService],
  exports: [JobApplicationsService],
})
export class JobApplicationsModule {}
