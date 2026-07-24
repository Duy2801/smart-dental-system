import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

/** Payload webhook SePay (money-in). */
export class SepayWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  id?: number | string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transferType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  transferAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceCode?: string;
}
