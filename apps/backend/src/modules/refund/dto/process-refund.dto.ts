import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RefundStatus } from '../../../../prisma/generated/enums';

export class ProcessRefundDto {
  @IsEnum(RefundStatus)
  @IsNotEmpty()
  status: RefundStatus;

  @IsString()
  @IsOptional()
  rejectReason?: string;

  @IsString()
  @IsOptional()
  proofImageUrl?: string;
}
