import { Module } from '@nestjs/common';
import { JoinRequestsController } from './join-requests.controller';
import { JoinRequestsService } from './join-requests.service';
import { SupabaseService } from '../config/supabase.service';
import { GidService } from '../employees/gid.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [JoinRequestsController],
  providers: [JoinRequestsService, SupabaseService, GidService],
  exports: [JoinRequestsService],
})
export class JoinRequestsModule {}
