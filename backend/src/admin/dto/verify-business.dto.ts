import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class VerifyBusinessDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
