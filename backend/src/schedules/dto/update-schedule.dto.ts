import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'posted'])
  status?: 'draft' | 'posted';
}
