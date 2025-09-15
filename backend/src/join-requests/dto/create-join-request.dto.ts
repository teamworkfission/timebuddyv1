import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches } from 'class-validator';

export class CreateJoinRequestDto {
  @IsString()
  @IsNotEmpty()
  business_id: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^GID-[A-Z0-9]{6}$/, {
    message: 'Employee GID must be in format GID-XXXXXX where X is alphanumeric'
  })
  employee_gid: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
