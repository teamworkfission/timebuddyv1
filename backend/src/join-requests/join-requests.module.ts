import { Module } from '@nestjs/common';
import { JoinRequestsController } from './join-requests.controller';
import { JoinRequestsService } from './join-requests.service';
import { SupabaseService } from '../config/supabase.service';
import { GidService } from '../employees/gid.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [JoinRequestsController],
  providers: [JoinRequestsService, SupabaseService, GidService, AuthService],
  exports: [JoinRequestsService],
})
export class JoinRequestsModule {}
