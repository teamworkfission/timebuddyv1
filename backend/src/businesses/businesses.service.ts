import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createBusinessDto: CreateBusinessDto, employerId: string) {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .insert({
        ...createBusinessDto,
        employer_id: employerId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create business: ${error.message}`);
    }

    return data;
  }

  async findAllByEmployer(employerId: string) {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch businesses: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string, employerId: string) {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select('*')
      .eq('business_id', id)
      .eq('employer_id', employerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Business with ID ${id} not found`);
      }
      throw new Error(`Failed to fetch business: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto, employerId: string) {
    // First check if business exists and belongs to employer
    await this.findOne(id, employerId);

    const { data, error } = await this.supabase.admin
      .from('businesses')
      .update(updateBusinessDto)
      .eq('business_id', id)
      .eq('employer_id', employerId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update business: ${error.message}`);
    }

    return data;
  }

  async remove(id: string, employerId: string) {
    // First check if business exists and belongs to employer
    await this.findOne(id, employerId);

    const { error } = await this.supabase.admin
      .from('businesses')
      .delete()
      .eq('business_id', id)
      .eq('employer_id', employerId);

    if (error) {
      throw new Error(`Failed to delete business: ${error.message}`);
    }

    return { message: 'Business deleted successfully' };
  }

  async getBusinessStats(employerId: string) {
    const { data, error } = await this.supabase.admin
      .from('businesses')
      .select('business_id, total_employees')
      .eq('employer_id', employerId);

    if (error) {
      throw new Error(`Failed to fetch business stats: ${error.message}`);
    }

    const businesses = data || [];
    const totalBusinesses = businesses.length;
    const totalEmployees = businesses.reduce((sum, business) => sum + (business.total_employees || 0), 0);

    return {
      total_businesses: totalBusinesses,
      total_employees: totalEmployees,
    };
  }
}
