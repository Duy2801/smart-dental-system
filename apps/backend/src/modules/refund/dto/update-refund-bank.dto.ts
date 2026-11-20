import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Bệnh nhân cung cấp tài khoản nhận tiền cho yêu cầu hoàn tiền đang chờ xử lý. */
export class UpdateRefundBankDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  bankName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  accountHolder: string;

  @IsString()
  @IsOptional()
  qrCodeUrl?: string;
}
