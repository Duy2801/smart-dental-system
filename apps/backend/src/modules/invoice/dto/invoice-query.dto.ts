import { IsIn, IsOptional, IsString } from 'class-validator';

export class InvoiceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ALL', 'PAID', 'UNPAID', 'CANCELLED'])
  status?: 'ALL' | 'PAID' | 'UNPAID' | 'CANCELLED';
}
