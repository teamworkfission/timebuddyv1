import { IsUUID, IsDateString, IsOptional, IsEnum } from 'class-validator';

export class PaymentReportDto {
  @IsUUID()
  business_id: string;
  
  @IsDateString()
  start_date: string;
  
  @IsDateString()
  end_date: string;
  
  @IsOptional()
  @IsUUID()
  employee_id?: string;
}

export class ExportPayrollDto {
  @IsUUID()
  business_id: string;
  
  @IsEnum(['csv'])
  format: 'csv';
  
  @IsDateString()
  start_date: string;
  
  @IsDateString()
  end_date: string;
  
  @IsOptional()
  @IsUUID()
  employee_id?: string;
}
