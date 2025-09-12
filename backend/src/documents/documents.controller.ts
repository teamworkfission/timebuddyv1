import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, DocumentType, DocumentUrlDto } from './dto/upload-document.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  headers: Request['headers'];
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: any,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentUrlDto> {
    // For now, we'll extract userId from the request
    // In a real app, this would come from JWT authentication middleware
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentsService.uploadDocument(
      userId,
      file,
      uploadDocumentDto.type,
    );
  }

  @Delete(':type')
  async deleteDocument(
    @Param('type') type: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!Object.values(DocumentType).includes(type as DocumentType)) {
      throw new BadRequestException('Invalid document type');
    }

    return this.documentsService.deleteDocument(userId, type as DocumentType);
  }

  @Get(':type')
  async getDocument(
    @Param('type') type: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentUrlDto | null> {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!Object.values(DocumentType).includes(type as DocumentType)) {
      throw new BadRequestException('Invalid document type');
    }

    return this.documentsService.getDocumentUrl(userId, type as DocumentType);
  }

  @Get()
  async listDocuments(
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentUrlDto[]> {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.documentsService.listUserDocuments(userId);
  }
}
