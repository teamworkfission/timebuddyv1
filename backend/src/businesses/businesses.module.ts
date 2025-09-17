import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { SupabaseService } from '../config/supabase.service';
import { TimezoneService } from '../config/timezone.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BusinessesController],
  providers: [BusinessesService, SupabaseService, TimezoneService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
