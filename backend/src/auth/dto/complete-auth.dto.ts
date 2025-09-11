import { IsIn, IsOptional } from 'class-validator';

export class CompleteAuthDto {
  @IsOptional()
  @IsIn(['employee', 'employer'])
  intendedRole?: 'employee' | 'employer';
}
