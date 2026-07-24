import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ enum: ['CASH', 'BANK_TRANSFER'] })
  @IsIn(['CASH', 'BANK_TRANSFER'])
  method: 'CASH' | 'BANK_TRANSFER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'Mã khuyến mãi (tuỳ chọn)' })
  @IsOptional()
  @IsString()
  promotionCode?: string;
}
