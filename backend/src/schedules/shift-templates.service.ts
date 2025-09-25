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
    
    // Check if templates already exist
    const existing = await this.getBusinessTemplates(businessId);
    if (existing.length > 0) {
      throw new ConflictException(`Default templates already exist for this business`);
    }

    // Define default templates
    const defaultTemplates = [
      {
        name: 'Morning',
        start_time: '07:00:00',
        end_time: '15:00:00',
        color: '#3B82F6',
      },
      {
        name: 'Afternoon',
        start_time: '14:00:00',
        end_time: '22:00:00',
        color: '#10B981',
      },
      {
        name: 'Night',
        start_time: '22:00:00',
        end_time: '06:00:00',
        color: '#8B5CF6',
      },
    ];

    // Create all templates
    const createdTemplates: ShiftTemplate[] = [];
    for (const template of defaultTemplates) {
      try {
        const created = await this.createTemplate(businessId, template);
        createdTemplates.push(created);
      } catch (error) {
        // If one fails, continue with others but log the error
        console.error(`Failed to create default template ${template.name}:`, error.message);
      }
    }

    if (createdTemplates.length === 0) {
      throw new ConflictException(`Failed to create any default templates`);
    }

    return createdTemplates;
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
    
    // Convert HH:MM:SS time format to required fields
    const startTime = createDto.start_time;
    const endTime = createDto.end_time;
    
    // Convert to minutes (HH:MM:SS -> minutes from midnight)
    const startMin = this.timeToMinutes(startTime);
    const endMin = this.timeToMinutes(endTime);
    
    // Convert to AM/PM labels
    const startLabel = this.timeToAMPM(startTime);
    const endLabel = this.timeToAMPM(endTime);
    
    const { data, error } = await supabase
      .from('shift_templates')
      .insert({
        business_id: businessId,
        name: createDto.name,
        start_time: startTime,
        end_time: endTime,
        start_label: startLabel,
        end_label: endLabel,
        start_min: startMin,
        end_min: endMin,
        color: createDto.color || '#3B82F6',
        is_active: createDto.is_active ?? true,
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

  // Helper method to convert HH:MM:SS to minutes from midnight
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper method to convert HH:MM:SS to AM/PM format
  private timeToAMPM(timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  async updateTemplate(id: string, updateDto: UpdateShiftTemplateDto): Promise<ShiftTemplate> {
    const supabase = this.supabaseService.admin;
    
    // Prepare update data with conversions if time fields are provided
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Copy basic fields
    if (updateDto.name) updateData.name = updateDto.name;
    if (updateDto.color) updateData.color = updateDto.color;
    if (updateDto.is_active !== undefined) updateData.is_active = updateDto.is_active;

    // Handle time updates - convert to all required formats
    if (updateDto.start_time) {
      updateData.start_time = updateDto.start_time;
      updateData.start_min = this.timeToMinutes(updateDto.start_time);
      updateData.start_label = this.timeToAMPM(updateDto.start_time);
    }

    if (updateDto.end_time) {
      updateData.end_time = updateDto.end_time;
      updateData.end_min = this.timeToMinutes(updateDto.end_time);
      updateData.end_label = this.timeToAMPM(updateDto.end_time);
    }

    const { data, error } = await supabase
      .from('shift_templates')
      .update(updateData)
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
