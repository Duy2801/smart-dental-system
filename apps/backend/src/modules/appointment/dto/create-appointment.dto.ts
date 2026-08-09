import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AppointmentPaymentOption } from '../../../../prisma/generated/enums';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  doctorId: string;

  @ApiProperty()
  @IsUUID()
  treatmentMethodId: string;

  @ApiProperty()
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: AppointmentPaymentOption })
  @IsOptional()
  @IsEnum(AppointmentPaymentOption)
  paymentOption?: AppointmentPaymentOption;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promotionCode?: string;
}
