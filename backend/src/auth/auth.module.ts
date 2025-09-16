import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from '../config/supabase.service';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [forwardRef(() => EmployeesModule)],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService],
  exports: [AuthService],
})
export class AuthModule {}
