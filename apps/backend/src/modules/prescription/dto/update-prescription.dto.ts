import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];
}
