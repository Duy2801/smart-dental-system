import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { RefundStatus } from '../../../../prisma/generated/enums';

export class ProcessRefundDto {
  @IsIn([RefundStatus.COMPLETED, RefundStatus.REJECTED])
  @IsNotEmpty()
  status: RefundStatus;

  @IsString()
  @ValidateIf((dto: ProcessRefundDto) => dto.status === RefundStatus.REJECTED)
  @IsNotEmpty()
  @MaxLength(1000)
  rejectReason?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7_000_000)
  proofImageUrl?: string;
}
