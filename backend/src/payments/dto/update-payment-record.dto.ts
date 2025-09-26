import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CreatePaymentRecordDto } from './create-payment-record.dto';

export class UpdatePaymentRecordDto extends PartialType(CreatePaymentRecordDto) {}

export class MarkAsPaidDto {
  @IsIn(['cash', 'check', 'bank_transfer', 'other'])
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'other';
  
  @IsOptional()
  @IsString()
  notes?: string;
}
