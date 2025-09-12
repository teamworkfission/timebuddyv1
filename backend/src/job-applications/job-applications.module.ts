import { Module } from '@nestjs/common';
import { JobApplicationsController } from './job-applications.controller';
import { JobApplicationsService } from './job-applications.service';
import { SupabaseService } from '../config/supabase.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [JobApplicationsController],
  providers: [JobApplicationsService, SupabaseService, AuthService],
  exports: [JobApplicationsService],
})
export class JobApplicationsModule {}
