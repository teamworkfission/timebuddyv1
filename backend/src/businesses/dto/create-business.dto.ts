import { IsString, IsEmail, IsIn, IsInt, IsNotEmpty, Min, MaxLength, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

const BUSINESS_TYPES = [
  'restaurant',
  'gas_station', 
  'retail_store',
  'grocery_store',
  'convenience_store',
  'pharmacy',
  'coffee_shop',
  'fast_food',
  'delivery_service',
  'warehouse',
  'office',
  'liquor_store',
  'smoke_vape_shop',
  'salon_barber',
  'nail_beauty_spa',
  'cleaning_services',
  'event_staffing',
  'childcare_daycare',
  'senior_care',
  'hospitality',
  'construction',
  'landscaping',
  'moving_storage',
  'car_wash_detailing',
  'security_services',
  'other'
] as const;

export type BusinessType = typeof BUSINESS_TYPES[number];

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsIn(BUSINESS_TYPES)
  type: BusinessType;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  location: string;

  // Individual address components (optional - can be populated manually if lookup fails)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  county?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  street_address?: string;

  // Business verification document
  @IsOptional()
  @IsString()
  document_url?: string;

}

export { BUSINESS_TYPES };
