import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class JobSearchDto {
  @IsOptional()
  @IsString()
  keywords?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export interface PublicJobPost {
  id: string;
  job_title: string;
  business_name: string;
  location: string;
  job_type: string;
  pay_type: string;
  pay_min: number;
  pay_max?: number;
  pay_currency: string;
  expected_hours_per_week?: number;
  schedule?: string;
  supplemental_pay: string[];
  benefits: string[];
  job_description: string;
  business_type: string;
  language_preference?: string;
  transportation_requirement?: string;
  phone: string;
  email?: string;
  published_at: string;
  created_at: string;
}

export interface JobSearchResponse {
  jobs: PublicJobPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LocationOption {
  name: string;
  job_count: number;
}
