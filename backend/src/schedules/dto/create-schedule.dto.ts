import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  business_id: string;

  @IsDateString()
  week_start_date: string; // YYYY-MM-DD format, should be a Monday
}
