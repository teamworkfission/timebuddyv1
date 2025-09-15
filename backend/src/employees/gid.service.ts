import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class GidService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Validates GID format (GID-XXXXXX where X is alphanumeric)
   */
  validateGidFormat(gid: string): boolean {
    const gidRegex = /^GID-[A-Z0-9]{6}$/;
    return gidRegex.test(gid);
  }

  /**
   * Checks if a GID exists in the database
   */
  async gidExists(gid: string): Promise<boolean> {
    const { data, error } = await this.supabase.admin
      .from('employees')
      .select('employee_gid')
      .eq('employee_gid', gid)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check GID existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Finds employee by GID
   */
  async findEmployeeByGid(gid: string) {
    if (!this.validateGidFormat(gid)) {
      throw new Error('Invalid GID format. Expected format: GID-XXXXXX');
    }

    const { data, error } = await this.supabase.admin
      .from('employees')
      .select('id, user_id, full_name, email, employee_gid, city, state')
      .eq('employee_gid', gid)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find employee by GID: ${error.message}`);
    }

    return data;
  }

  /**
   * Gets employee GID by user ID
   */
  async getEmployeeGidByUserId(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.admin
      .from('employees')
      .select('employee_gid')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get employee GID: ${error.message}`);
    }

    return data?.employee_gid || null;
  }

  /**
   * Validates that a GID exists and returns employee info
   */
  async validateAndGetEmployee(gid: string) {
    const employee = await this.findEmployeeByGid(gid);
    
    if (!employee) {
      throw new Error('Employee not found with the provided GID');
    }

    return employee;
  }
}
