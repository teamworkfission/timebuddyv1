import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { SupabaseService } from '../config/supabase.service';
import { TimezoneService } from '../config/timezone.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [BusinessesController],
  providers: [BusinessesService, SupabaseService, TimezoneService, AuthService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
