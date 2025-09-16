import { IsString, IsNotEmpty, IsNumber, Min, Max, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AM_PM_TIME_REGEX } from '../../utils/time-parser';

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Employee UUID' })
  employee_id: string;

  @IsNumber()
  @Min(0)
  @Max(6)
  @ApiProperty({ description: 'Day of week (0=Sunday, 6=Saturday)' })
  day_of_week: number;

  // NEW: AM/PM format fields (primary input method)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(AM_PM_TIME_REGEX, {
    message: 'start_label must be in H:MM AM/PM or H AM/PM format (e.g., "9:00 AM", "10 PM")'
  })
  @ApiProperty({ 
    description: 'Start time in AM/PM format', 
    example: '9:00 AM',
    required: false 
  })
  start_label?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(AM_PM_TIME_REGEX, {
    message: 'end_label must be in H:MM AM/PM or H AM/PM format (e.g., "5:00 PM", "11 PM")'
  })
  @ApiProperty({ 
    description: 'End time in AM/PM format', 
    example: '5:00 PM',
    required: false 
  })
  end_label?: string;

  // LEGACY: TIME format fields (backward compatibility)
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'start_time must be in HH:MM or HH:MM:SS format'
  })
  @ApiProperty({ 
    deprecated: true, 
    description: 'Legacy field - prefer start_label for new implementations',
    example: '09:00:00',
    required: false
  })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'end_time must be in HH:MM or HH:MM:SS format'
  })
  @ApiProperty({ 
    deprecated: true, 
    description: 'Legacy field - prefer end_label for new implementations',
    example: '17:00:00',
    required: false
  })
  end_time?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Optional shift template UUID', required: false })
  shift_template_id?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Optional notes for the shift', required: false })
  notes?: string;
}
