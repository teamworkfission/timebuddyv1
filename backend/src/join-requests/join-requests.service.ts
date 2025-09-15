import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { GidService } from '../employees/gid.service';

export interface JoinRequest {
  id: string;
  business_id: string;
  employee_gid: string;
  employer_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  business_name?: string;
  employee_name?: string;
}

export interface CreateJoinRequestDto {
  business_id: string;
  employee_gid: string;
  message?: string;
}

export interface UpdateJoinRequestDto {
  status: 'accepted' | 'declined';
}

@Injectable()
export class JoinRequestsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly gidService: GidService,
  ) {}

  /**
   * Send a join request from employer to employee
   */
  async sendJoinRequest(employerId: string, createDto: CreateJoinRequestDto): Promise<JoinRequest> {
    const { business_id, employee_gid, message } = createDto;

    // Validate GID format
    if (!this.gidService.validateGidFormat(employee_gid)) {
      throw new Error('Invalid GID format. Expected format: GID-XXXXXX');
    }

    // Verify employee exists
    const employee = await this.gidService.findEmployeeByGid(employee_gid);
    if (!employee) {
      throw new NotFoundException('Employee not found with the provided GID');
    }

    // Verify business belongs to employer
    const { data: business, error: businessError } = await this.supabase.admin
      .from('businesses')
      .select('business_id, name')
      .eq('business_id', business_id)
      .eq('employer_id', employerId)
      .maybeSingle();

    if (businessError || !business) {
      throw new ForbiddenException('Business not found or you do not have permission to manage it');
    }

    // Check if employee is already associated with this business
    const { data: existingAssociation } = await this.supabase.admin
      .from('business_employees')
      .select('id')
      .eq('business_id', business_id)
      .eq('employee_id', employee.id)
      .maybeSingle();

    if (existingAssociation) {
      throw new ConflictException('Employee is already associated with this business');
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await this.supabase.admin
      .from('business_employee_requests')
      .select('id, status')
      .eq('business_id', business_id)
      .eq('employee_gid', employee_gid)
      .maybeSingle();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new ConflictException('A join request is already pending for this employee');
      } else {
        // Delete old declined/accepted request and create new one
        await this.supabase.admin
          .from('business_employee_requests')
          .delete()
          .eq('id', existingRequest.id);
      }
    }

    // Create the join request
    const { data, error } = await this.supabase.admin
      .from('business_employee_requests')
      .insert({
        business_id,
        employee_gid,
        employer_id: employerId,
        message,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create join request: ${error.message}`);
    }

    return data;
  }

  /**
   * Get join requests sent by an employer
   */
  async getEmployerJoinRequests(employerId: string): Promise<JoinRequest[]> {
    const { data, error } = await this.supabase.admin
      .from('business_employee_requests')
      .select(`
        *,
        businesses!inner(name)
      `)
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch join requests: ${error.message}`);
    }

    return (data || []).map(request => ({
      ...request,
      business_name: request.businesses?.name,
    }));
  }

  /**
   * Get join requests for an employee
   */
  async getEmployeeJoinRequests(userId: string): Promise<JoinRequest[]> {
    // Get employee GID first
    const employeeGid = await this.gidService.getEmployeeGidByUserId(userId);
    if (!employeeGid) {
      throw new NotFoundException('Employee profile not found');
    }

    const { data, error } = await this.supabase.admin
      .from('business_employee_requests')
      .select(`
        *,
        businesses!inner(name)
      `)
      .eq('employee_gid', employeeGid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch join requests: ${error.message}`);
    }

    return (data || []).map(request => ({
      ...request,
      business_name: request.businesses?.name,
    }));
  }

  /**
   * Employee accepts or declines a join request
   */
  async respondToJoinRequest(
    userId: string, 
    requestId: string, 
    updateDto: UpdateJoinRequestDto
  ): Promise<JoinRequest> {
    const { status } = updateDto;

    // Get employee GID
    const employeeGid = await this.gidService.getEmployeeGidByUserId(userId);
    if (!employeeGid) {
      throw new NotFoundException('Employee profile not found');
    }

    // Verify request belongs to this employee and is pending
    const { data: request, error: requestError } = await this.supabase.admin
      .from('business_employee_requests')
      .select('*')
      .eq('id', requestId)
      .eq('employee_gid', employeeGid)
      .eq('status', 'pending')
      .maybeSingle();

    if (requestError || !request) {
      throw new NotFoundException('Join request not found or already processed');
    }

    // Update request status
    const { data: updatedRequest, error: updateError } = await this.supabase.admin
      .from('business_employee_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update join request: ${updateError.message}`);
    }

    // If accepted, create business-employee association
    if (status === 'accepted') {
      const employee = await this.gidService.findEmployeeByGid(employeeGid);
      
      const { error: associationError } = await this.supabase.admin
        .from('business_employees')
        .insert({
          business_id: request.business_id,
          employee_id: employee.id,
        });

      if (associationError) {
        // Rollback the request status update
        await this.supabase.admin
          .from('business_employee_requests')
          .update({ status: 'pending' })
          .eq('id', requestId);
        
        throw new Error(`Failed to create business association: ${associationError.message}`);
      }
    }

    return updatedRequest;
  }

  /**
   * Cancel a join request (employer only)
   */
  async cancelJoinRequest(employerId: string, requestId: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from('business_employee_requests')
      .delete()
      .eq('id', requestId)
      .eq('employer_id', employerId);

    if (error) {
      throw new Error(`Failed to cancel join request: ${error.message}`);
    }
  }
}
