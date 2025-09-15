import { IsString, IsNotEmpty, Matches, IsOptional, IsBoolean } from 'class-validator';

export class CreateShiftTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'start_time must be in HH:MM:SS format'
  })
  start_time: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'end_time must be in HH:MM:SS format'
  })
  end_time: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a valid hex color code'
  })
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
