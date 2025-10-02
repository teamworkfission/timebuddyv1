import { 
  IsString, 
  IsEmail, 
  IsIn, 
  IsInt, 
  IsNotEmpty, 
  Min, 
  MaxLength, 
  IsOptional, 
  IsArray, 
  IsUUID,
  IsNumber,
  ValidateIf,
  ArrayMaxSize
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export const JOB_TYPES = ['full-time', 'part-time'] as const;
export type JobType = typeof JOB_TYPES[number];

export const JOB_STATUSES = ['draft', 'published', 'closed'] as const;
export type JobStatus = typeof JOB_STATUSES[number];

export const PAY_TYPES = ['hourly', 'salary'] as const;
export type PayType = typeof PAY_TYPES[number];

export const SUPPLEMENTAL_PAY_OPTIONS = ['bonus', 'tips', 'commission'] as const;
export type SupplementalPayOption = typeof SUPPLEMENTAL_PAY_OPTIONS[number];

export const BENEFITS_OPTIONS = ['health_insurance', '401k', 'pto'] as const;
export type BenefitsOption = typeof BENEFITS_OPTIONS[number];

export class CreateJobDto {
  @IsUUID()
  @IsNotEmpty()
  business_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  job_title: string;

  @IsString()
  @IsIn(JOB_TYPES)
  job_type: JobType;

  @IsString()
  @IsIn(JOB_STATUSES)
  @IsOptional()
  status?: JobStatus = 'draft';

  // Business info (auto-filled but editable)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  business_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  location: string;

  @IsString()
  @IsNotEmpty()
  business_type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  phone: string;

  @ValidateIf((object, value) => value !== null && value !== undefined && value !== '')
  @IsEmail()
  @IsOptional()
  email?: string;

  // Schedule & Hours
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsInt()
  @Min(1)
  @IsOptional()
  expected_hours_per_week?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  schedule?: string;

  // Compensation
  @IsString()
  @IsIn(PAY_TYPES)
  pay_type: PayType;

  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pay_min: number;

  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @ValidateIf((object, value) => value !== null && value !== undefined && value !== '')
  @Min(0)
  @IsOptional()
  pay_max?: number;

  @IsString()
  @IsOptional()
  pay_currency?: string = 'USD';

  // Benefits & Supplemental (arrays)
  @IsArray()
  @IsString({ each: true })
  @IsIn(SUPPLEMENTAL_PAY_OPTIONS, { each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  supplemental_pay?: SupplementalPayOption[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsIn(BENEFITS_OPTIONS, { each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  benefits?: BenefitsOption[] = [];

  // Job Details
  @IsString()
  @IsNotEmpty()
  job_description: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  language_preference?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  transportation_requirement?: string;
}

