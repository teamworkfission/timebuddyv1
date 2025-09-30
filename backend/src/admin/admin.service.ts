import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { VerifyBusinessDto } from './dto/verify-business.dto';

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  async login(username: string, password: string) {
    // Static admin credentials for MVP
    if (username === 'admin' && password === 'admin') {
      // In a real implementation, we would sign a JWT token here
      // For now, we'll return a simple success response
      return {
        success: true,
        message: 'Admin login successful',
        // Note: In production, return a proper JWT token
        token: 'admin-session-token'
      };
    }

    throw new UnauthorizedException('Invalid admin credentials');
  }

  async getPendingBusinesses() {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select(`
        business_id,
        name,
        type,
        email,
        phone,
        location,
        street_address,
        city,
        state,
        zip_code,
        document_url,
        verification_status,
        verification_notes,
        created_at,
        employer_id,
        profiles!businesses_employer_id_fkey(email)
      `)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch pending businesses: ${error.message}`);
    }

    return (data || []).map(business => ({
      business_id: business.business_id,
      name: business.name,
      type: business.type,
      email: business.email,
      phone: business.phone,
      location: business.location,
      street_address: business.street_address,
      city: business.city,
      state: business.state,
      zip_code: business.zip_code,
      document_url: business.document_url,
      verification_status: business.verification_status,
      verification_notes: business.verification_notes,
      created_at: business.created_at,
      employer_email: (business.profiles as any)?.email,
    }));
  }

  async getAllBusinesses() {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select(`
        business_id,
        name,
        type,
        email,
        phone,
        location,
        street_address,
        city,
        state,
        zip_code,
        document_url,
        verification_status,
        verification_notes,
        verified_at,
        verified_by,
        created_at,
        employer_id,
        profiles!businesses_employer_id_fkey(email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch businesses: ${error.message}`);
    }

    return (data || []).map(business => ({
      business_id: business.business_id,
      name: business.name,
      type: business.type,
      email: business.email,
      phone: business.phone,
      location: business.location,
      street_address: business.street_address,
      city: business.city,
      state: business.state,
      zip_code: business.zip_code,
      document_url: business.document_url,
      verification_status: business.verification_status,
      verification_notes: business.verification_notes,
      verified_at: business.verified_at,
      verified_by: business.verified_by,
      created_at: business.created_at,
      employer_email: (business.profiles as any)?.email,
    }));
  }

  async verifyBusiness(businessId: string, verifyDto: VerifyBusinessDto, adminEmail: string) {
    // First check if business exists
    const { data: business, error: fetchError } = await this.supabase.admin
      .from('businesses')
      .select('business_id, name, verification_status')
      .eq('business_id', businessId)
      .single();

    if (fetchError || !business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Update verification status
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .update({
        verification_status: verifyDto.status,
        verification_notes: verifyDto.notes || null,
        verified_at: new Date().toISOString(),
        verified_by: adminEmail,
      })
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update business verification: ${error.message}`);
    }

    return {
      business_id: data.business_id,
      name: data.name,
      verification_status: data.verification_status,
      verification_notes: data.verification_notes,
      verified_at: data.verified_at,
      verified_by: data.verified_by,
    };
  }

  async getBusinessStats() {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select('verification_status');

    if (error) {
      throw new Error(`Failed to fetch business stats: ${error.message}`);
    }

    const stats = (data || []).reduce((acc, business) => {
      acc[business.verification_status] = (acc[business.verification_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: data?.length || 0,
      pending: stats.pending || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
    };
  }
}
