import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { DocumentType, DocumentUrlDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadDocument(
    userId: string, 
    file: any, 
    documentType: DocumentType
  ): Promise<DocumentUrlDto> {
    try {
      // Validate file type
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Only PDF, DOC, and DOCX files are allowed');
      }

      // Validate file size (5MB limit)
      const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxFileSize) {
        throw new BadRequestException('File size must be less than 5MB');
      }

      // Generate file path: {userId}/{documentType}.{extension}
      const fileExtension = this.getFileExtension(file.mimetype);
      const filePath = `${userId}/${documentType}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabaseService.admin.storage
        .from('employee-documents')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true, // Replace if exists
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new InternalServerErrorException('Failed to upload document');
      }

      // Generate signed URL for access (valid for 1 year)
      const { data: urlData, error: urlError } = await this.supabaseService.admin.storage
        .from('employee-documents')
        .createSignedUrl(filePath, 31536000); // 1 year in seconds

      if (urlError) {
        console.error('Supabase signed URL error:', urlError);
        throw new InternalServerErrorException('Failed to generate document URL');
      }

      return {
        url: urlData.signedUrl,
        filename: file.originalname,
        type: documentType,
        uploadedAt: new Date().toISOString(),
      };

    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('Unexpected error during document upload:', error);
      throw new InternalServerErrorException('Failed to upload document');
    }
  }

  async deleteDocument(userId: string, documentType: DocumentType): Promise<{ success: boolean }> {
    try {
      // Try to find the document with different extensions
      const extensions = ['pdf', 'doc', 'docx'];
      let deletionSuccess = false;

      for (const ext of extensions) {
        const filePath = `${userId}/${documentType}.${ext}`;
        
        const { error } = await this.supabaseService.admin.storage
          .from('employee-documents')
          .remove([filePath]);

        // If no error, document was deleted
        if (!error) {
          deletionSuccess = true;
          break;
        }
      }

      return { success: deletionSuccess };

    } catch (error) {
      console.error('Error deleting document:', error);
      throw new InternalServerErrorException('Failed to delete document');
    }
  }

  async getDocumentUrl(userId: string, documentType: DocumentType): Promise<DocumentUrlDto | null> {
    try {
      const extensions = ['pdf', 'doc', 'docx'];

      for (const ext of extensions) {
        const filePath = `${userId}/${documentType}.${ext}`;
        
        // Check if file exists
        const { data, error } = await this.supabaseService.admin.storage
          .from('employee-documents')
          .list(userId, { search: `${documentType}.${ext}` });

        if (!error && data && data.length > 0) {
          // Generate signed URL
          const { data: urlData, error: urlError } = await this.supabaseService.admin.storage
            .from('employee-documents')
            .createSignedUrl(filePath, 31536000); // 1 year

          if (!urlError && urlData) {
            return {
              url: urlData.signedUrl,
              filename: data[0].name,
              type: documentType,
              uploadedAt: data[0].created_at || new Date().toISOString(),
            };
          }
        }
      }

      return null;

    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  }

  async listUserDocuments(userId: string): Promise<DocumentUrlDto[]> {
    try {
      const documents: DocumentUrlDto[] = [];
      
      // Check for resume
      const resume = await this.getDocumentUrl(userId, DocumentType.RESUME);
      if (resume) {
        documents.push(resume);
      }

      // Check for cover letter
      const coverLetter = await this.getDocumentUrl(userId, DocumentType.COVER_LETTER);
      if (coverLetter) {
        documents.push(coverLetter);
      }

      return documents;

    } catch (error) {
      console.error('Error listing user documents:', error);
      throw new InternalServerErrorException('Failed to list documents');
    }
  }

  private getFileExtension(mimeType: string): string {
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'application/msword':
        return 'doc';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      default:
        throw new BadRequestException('Unsupported file type');
    }
  }
}
