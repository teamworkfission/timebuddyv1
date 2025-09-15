import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftDto } from './create-shift.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateShiftDto extends PartialType(
  OmitType(CreateShiftDto, ['employee_id'] as const)
) {}
