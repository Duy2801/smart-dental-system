import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRefundRequestDto {
  @IsUUID()
  @IsOptional()
  videoConsultationId?: string;

  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountHolder: string;

  @IsString()
  @IsOptional()
  qrCodeUrl?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
