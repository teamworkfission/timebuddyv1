import { 
  IsString, 
  IsNotEmpty, 
  IsEmail, 
  IsOptional, 
  IsArray, 
  IsIn, 
  MaxLength 
} from 'class-validator';

export class CreateEmployeeDto {
  // Required fields
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  full_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  // Optional fields
  @IsOptional()
  @IsString()
  @MaxLength(500)
  short_bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  availability?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsIn(['own_car', 'public_transit', 'not_needed'])
  transportation?: 'own_car' | 'public_transit' | 'not_needed';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  resume_url?: string;
}
