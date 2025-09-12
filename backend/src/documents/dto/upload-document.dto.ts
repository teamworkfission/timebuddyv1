import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum DocumentType {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
}

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  type: DocumentType;

  @IsOptional()
  @IsString()
  filename?: string;
}

export class DocumentUrlDto {
  @IsString()
  url: string;

  @IsString()
  filename: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  uploadedAt: string;
}
