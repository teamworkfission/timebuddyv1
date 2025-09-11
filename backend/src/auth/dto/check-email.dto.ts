import { IsEmail, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CheckEmailDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsIn(['signup', 'signin'])
  context!: 'signup' | 'signin';
}
