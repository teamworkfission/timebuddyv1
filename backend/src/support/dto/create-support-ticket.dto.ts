import { IsString, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';

export enum IssueType {
  TECHNICAL = 'technical',
  GENERAL = 'general',
  FRAUD_REPORT = 'fraud_report',
  OTHER = 'other',
}

export class CreateSupportTicketDto {
  @IsEnum(IssueType)
  issue_type: IssueType;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsString()
  screenshot_url?: string;
}

// DTO for creating ticket with file upload
export class CreateSupportTicketWithFileDto {
  @IsEnum(IssueType)
  issue_type: IssueType;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;
}