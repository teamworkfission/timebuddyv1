import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { UserGuard } from './guards/user.guard';
import { SupabaseService } from '../config/supabase.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit to match bucket config
      },
    }),
  ],
  controllers: [SupportController],
  providers: [SupportService, UserGuard, SupabaseService],
})
export class SupportModule {}
