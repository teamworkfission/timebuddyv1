import { IsString, IsUrl, IsPort, validateSync } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';

export class EnvironmentVariables {
  @IsUrl({ require_tld: false })
  SUPABASE_URL!: string;

  @IsString()
  SUPABASE_SERVICE_ROLE_KEY!: string;

  @IsString()
  ALLOWED_ORIGINS!: string;

  @IsPort()
  @Transform(({ value }) => parseInt(value))
  PORT: number = 3000;

  @IsString()
  NODE_ENV: string = 'development';
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
