import { IsString, IsEmail, IsIn, IsInt, IsNotEmpty, Min, MaxLength } from 'class-validator';
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

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  total_employees: number;
}

export { BUSINESS_TYPES };
