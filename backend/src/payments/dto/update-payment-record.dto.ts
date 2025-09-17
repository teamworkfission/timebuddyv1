import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentRecordDto } from './create-payment-record.dto';

export class UpdatePaymentRecordDto extends PartialType(CreatePaymentRecordDto) {}

export class MarkAsPaidDto {
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'other';
  notes?: string;
}
