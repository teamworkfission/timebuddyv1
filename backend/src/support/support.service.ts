import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private readonly supabase: SupabaseService) {}

  async createTicket(userId: string, userEmail: string, userRole: string, createDto: CreateSupportTicketDto) {
    const { data, error } = await this.supabase.admin
      .from('support_tickets')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_role: userRole,
        issue_type: createDto.issue_type,
        subject: createDto.subject,
        description: createDto.description,
        screenshot_url: createDto.screenshot_url || null,
        status: 'open',
        priority: 'normal',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }

    return {
      id: data.id,
      subject: data.subject,
      issue_type: data.issue_type,
      status: data.status,
      created_at: data.created_at,
    };
  }

  async getUserTickets(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('support_tickets')
      .select(`
        id,
        issue_type,
        subject,
        description,
        status,
        priority,
        created_at,
        updated_at,
        resolved_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user tickets: ${error.message}`);
    }

    return data || [];
  }

  async uploadScreenshot(userId: string, file: any): Promise<string> {
    try {
      // Validate file type
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
      }

      // Validate file size (2MB limit as per bucket config)
      const maxFileSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxFileSize) {
        throw new BadRequestException('File size must be less than 2MB');
      }

      // Generate file path: {userId}/screenshot-{timestamp}.{extension}
      const fileExtension = this.getFileExtension(file.mimetype);
      const timestamp = Date.now();
      const filePath = `${userId}/screenshot-${timestamp}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.admin.storage
        .from('support-attachments')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false, // Don't replace existing files
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new InternalServerErrorException('Failed to upload screenshot');
      }

      // Generate signed URL for access (valid for 1 year)
      const { data: urlData, error: urlError } = await this.supabase.admin.storage
        .from('support-attachments')
        .createSignedUrl(filePath, 31536000); // 1 year in seconds

      if (urlError) {
        console.error('Supabase signed URL error:', urlError);
        throw new InternalServerErrorException('Failed to generate screenshot URL');
      }

      return urlData.signedUrl;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('Unexpected error during screenshot upload:', error);
      throw new InternalServerErrorException('Failed to upload screenshot');
    }
  }

  private getFileExtension(mimetype: string): string {
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };
    return mimeToExt[mimetype] || 'jpg';
  }

  async getTicket(ticketId: string, userId: string) {
    const { data, error } = await this.supabase.admin
      .from('support_tickets')
      .select(`
        id,
        issue_type,
        subject,
        description,
        screenshot_url,
        status,
        priority,
        created_at,
        updated_at,
        resolved_at,
        admin_notes
      `)
      .eq('id', ticketId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Support ticket not found');
    }

    return data;
  }
}
