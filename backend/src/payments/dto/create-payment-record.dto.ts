import { IsUUID, IsNumber, Min, IsDateString, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentRecordDto {
  @IsUUID()
  business_id: string;
  
  @IsUUID()
  employee_id: string;
  
  @IsDateString()
  period_start: string;
  
  @IsDateString()
  period_end: string;
  
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  total_hours: number;
  
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  hourly_rate: number;
  
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  advances?: number;
  
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  bonuses?: number;
  
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  deductions?: number;
  
  @IsOptional()
  @IsString()
  notes?: string;
}
