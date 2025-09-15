import { 
  IsUUID, 
  IsString, 
  IsBoolean, 
  IsArray, 
  IsOptional, 
  IsEmail, 
  IsPhoneNumber, 
  IsIn, 
  IsNotEmpty 
} from 'class-validator';

export class CreateJobApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  job_post_id: string;

  // Employee data (from profile or manual entry)
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  short_bio?: string;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsIn(['own_car', 'public_transit', 'not_needed'])
  transportation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  resume_url?: string;

  // Privacy controls
  @IsBoolean()
  show_phone: boolean;

  @IsBoolean()
  show_email: boolean;

  // Application specific
  @IsOptional()
  @IsString()
  cover_message?: string;

  // Safety disclaimer
  @IsBoolean()
  safety_disclaimer_accepted: boolean;
}

export class UpdateJobApplicationDto {
  @IsOptional()
  @IsIn(['applied', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected'])
  status?: string;

  @IsOptional()
  @IsString()
  cover_message?: string;

  @IsOptional()
  @IsBoolean()
  show_phone?: boolean;

  @IsOptional()
  @IsBoolean()
  show_email?: boolean;
}
