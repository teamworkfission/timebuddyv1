import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConfirmedHoursDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Business UUID' })
  business_id: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Week start date (Sunday)', example: '2025-09-21' })
  week_start_date: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Sunday', example: 8.0, required: false })
  sunday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Monday', example: 8.0, required: false })
  monday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Tuesday', example: 8.0, required: false })
  tuesday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Wednesday', example: 8.0, required: false })
  wednesday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Thursday', example: 8.0, required: false })
  thursday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Friday', example: 8.0, required: false })
  friday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Saturday', example: 8.0, required: false })
  saturday_hours?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Optional notes about the hours', required: false })
  notes?: string;
}

export class UpdateConfirmedHoursDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Sunday', example: 8.0, required: false })
  sunday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Monday', example: 8.0, required: false })
  monday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Tuesday', example: 8.0, required: false })
  tuesday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Wednesday', example: 8.0, required: false })
  wednesday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Thursday', example: 8.0, required: false })
  thursday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Friday', example: 8.0, required: false })
  friday_hours?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @IsOptional()
  @ApiProperty({ description: 'Hours worked on Saturday', example: 8.0, required: false })
  saturday_hours?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Optional notes about the hours', required: false })
  notes?: string;
}

export class ConfirmedHoursResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Employee UUID' })
  employee_id: string;

  @ApiProperty({ description: 'Business UUID' })
  business_id: string;

  @ApiProperty({ description: 'Week start date (Sunday)' })
  week_start_date: string;

  @ApiProperty({ description: 'Hours worked on Sunday' })
  sunday_hours: number;

  @ApiProperty({ description: 'Hours worked on Monday' })
  monday_hours: number;

  @ApiProperty({ description: 'Hours worked on Tuesday' })
  tuesday_hours: number;

  @ApiProperty({ description: 'Hours worked on Wednesday' })
  wednesday_hours: number;

  @ApiProperty({ description: 'Hours worked on Thursday' })
  thursday_hours: number;

  @ApiProperty({ description: 'Hours worked on Friday' })
  friday_hours: number;

  @ApiProperty({ description: 'Hours worked on Saturday' })
  saturday_hours: number;

  @ApiProperty({ description: 'Total hours for the week (calculated)' })
  total_hours: number;

  @ApiProperty({ description: 'Status: draft, submitted, approved, rejected' })
  status: 'draft' | 'submitted' | 'approved' | 'rejected';

  @ApiProperty({ description: 'When hours were submitted', required: false })
  submitted_at?: string;

  @ApiProperty({ description: 'When hours were approved', required: false })
  approved_at?: string;

  @ApiProperty({ description: 'Who approved the hours', required: false })
  approved_by?: string;

  @ApiProperty({ description: 'When hours were rejected', required: false })
  rejected_at?: string;

  @ApiProperty({ description: 'Who rejected the hours', required: false })
  rejected_by?: string;

  @ApiProperty({ description: 'Reason for rejection', required: false })
  rejection_reason?: string;

  @ApiProperty({ description: 'Optional notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Created timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Updated timestamp' })
  updated_at: string;
}

export class WeeklyHoursWithScheduleDto {
  @ApiProperty({ description: 'Confirmed hours (if exists)' })
  confirmed_hours?: ConfirmedHoursResponseDto;

  @ApiProperty({ description: 'Scheduled hours from posted schedules' })
  scheduled_hours: {
    sunday_hours: number;
    monday_hours: number;
    tuesday_hours: number;
    wednesday_hours: number;
    thursday_hours: number;
    friday_hours: number;
    saturday_hours: number;
    total_hours: number;
  };

  @ApiProperty({ description: 'Business information' })
  business: {
    business_id: string;
    name: string;
  };
}

export class SubmitHoursDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Optional submission notes', required: false })
  notes?: string;
}

export class ApproveHoursDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Optional approval notes', required: false })
  notes?: string;
}

export class RejectHoursDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Reason for rejecting the submitted hours' })
  rejection_reason: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Optional rejection notes', required: false })
  notes?: string;
}
