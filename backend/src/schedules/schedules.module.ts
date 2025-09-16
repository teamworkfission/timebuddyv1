import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { ShiftTemplatesService } from './shift-templates.service';
import { SupabaseService } from '../config/supabase.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, ShiftTemplatesService, SupabaseService, AuthService],
  exports: [SchedulesService, ShiftTemplatesService],
})
export class SchedulesModule {}
