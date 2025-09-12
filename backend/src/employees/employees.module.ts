import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { SupabaseService } from '../config/supabase.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, SupabaseService, AuthService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
