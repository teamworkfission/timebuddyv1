import { IsString, IsNotEmpty, IsNumber, Min, Max, Matches, IsOptional } from 'class-validator';

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  employee_id: string;

  @IsNumber()
  @Min(0)
  @Max(6)
  day_of_week: number; // 0=Sunday, 1=Monday, etc.

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'start_time must be in HH:MM or HH:MM:SS format'
  })
  start_time: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'end_time must be in HH:MM or HH:MM:SS format'
  })
  end_time: string;

  @IsOptional()
  @IsString()
  shift_template_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
