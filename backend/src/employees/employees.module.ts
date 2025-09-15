import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { GidService } from './gid.service';
import { SupabaseService } from '../config/supabase.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, GidService, SupabaseService, AuthService],
  exports: [EmployeesService, GidService],
})
export class EmployeesModule {}
