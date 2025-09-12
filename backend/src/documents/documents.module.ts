import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { SupabaseService } from '../config/supabase.service';

@Module({
  imports: [
    MulterModule.register({
      // Configure multer for handling file uploads
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, SupabaseService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
