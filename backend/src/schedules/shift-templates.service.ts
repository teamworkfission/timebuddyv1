import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto';
import { ShiftTemplate } from './dto/week-schedule-response.dto';

@Injectable()
export class ShiftTemplatesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createDefaultTemplates(businessId: string): Promise<ShiftTemplate[]> {
    const supabase = this.supabaseService.admin;
    
    const { data, error } = await supabase.rpc('create_default_shift_templates', {
      p_business_id: businessId
    });

    if (error) {
      throw new ConflictException(`Failed to create default templates: ${error.message}`);
    }

    return this.getBusinessTemplates(businessId);
  }

  async getBusinessTemplates(businessId: string): Promise<ShiftTemplate[]> {
    const supabase = this.supabaseService.admin;
    
    const { data, error } = await supabase
      .from('shift_templates')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch shift templates: ${error.message}`);
    }

    return data || [];
  }

  async createTemplate(businessId: string, createDto: CreateShiftTemplateDto): Promise<ShiftTemplate> {
    const supabase = this.supabaseService.admin;
    
    const { data, error } = await supabase
      .from('shift_templates')
      .insert({
        business_id: businessId,
        ...createDto,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictException(`Shift template with name "${createDto.name}" already exists for this business`);
      }
      throw new Error(`Failed to create shift template: ${error.message}`);
    }

    return data;
  }

  async updateTemplate(id: string, updateDto: UpdateShiftTemplateDto): Promise<ShiftTemplate> {
    const supabase = this.supabaseService.admin;
    
    const { data, error } = await supabase
      .from('shift_templates')
      .update({
        ...updateDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Shift template with ID ${id} not found`);
      }
      throw new Error(`Failed to update shift template: ${error.message}`);
    }

    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const supabase = this.supabaseService.admin;
    
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('shift_templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete shift template: ${error.message}`);
    }
  }
}
