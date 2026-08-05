import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AppointmentPaymentOption } from '../../../../prisma/generated/enums';

export class CreateStaffAppointmentDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

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

  /** Walk-in: tạo xong chuyển thẳng CHECKED_IN */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  walkIn?: boolean;
}
