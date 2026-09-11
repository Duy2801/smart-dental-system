import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PrescriptionItemDto } from './create-prescription.dto';

export class UpdatePrescriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ type: [PrescriptionItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Đơn thuốc cần ít nhất một loại thuốc' })
  @ArrayMaxSize(50, { message: 'Đơn thuốc có tối đa 50 loại thuốc' })
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];

  @ApiPropertyOptional()
  @IsDateString()
  expectedUpdatedAt: string;

  @ApiPropertyOptional()
  @IsBoolean()
  safetyAcknowledged: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  safetyOverride?: boolean;
}
