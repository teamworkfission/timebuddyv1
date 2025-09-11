import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { SupabaseService } from '../config/supabase.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, SupabaseService, AuthService],
  exports: [JobsService],
})
export class JobsModule {}
