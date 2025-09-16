import { Module, forwardRef } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { GidService } from './gid.service';
import { SupabaseService } from '../config/supabase.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [EmployeesController],
  providers: [EmployeesService, GidService, SupabaseService],
  exports: [EmployeesService, GidService],
})
export class EmployeesModule {}
