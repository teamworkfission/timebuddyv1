import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { AuthModule } from '../auth/auth.module';
import { SupabaseService } from '../config/supabase.service';
import { SchedulesService } from '../schedules/schedules.service';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, SupabaseService, SchedulesService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
