import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PrescriptionItemDto {
  @ApiProperty({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsNotEmpty({ message: 'Tên thuốc không được để trống' })
  @MaxLength(200)
  medicineName: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  @IsNotEmpty({ message: 'Liều dùng không được để trống' })
  @MaxLength(100)
  dosage: string;

  @ApiPropertyOptional({ example: '3 lần/ngày' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  frequency?: string;

  @ApiPropertyOptional({ example: '5 ngày' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @ApiPropertyOptional({ example: 'Uống sau ăn' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instruction?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  medicalRecordId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ type: [PrescriptionItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Đơn thuốc cần ít nhất một loại thuốc' })
  @ArrayMaxSize(50, { message: 'Đơn thuốc có tối đa 50 loại thuốc' })
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];

  @ApiProperty({ description: 'Bác sĩ đã hoàn tất kiểm tra an toàn đơn thuốc' })
  @IsBoolean()
  safetyAcknowledged: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  safetyOverride?: boolean;
}
