import { IsUUID, IsNumber, Min, IsDateString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class SetEmployeeRateDto {
  @IsUUID()
  business_id: string;
  
  @IsUUID()
  employee_id: string;
  
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  hourly_rate: number;
  
  @IsDateString()
  @IsOptional()
  effective_from?: string;
}
