import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class TreatmentPlanStepInputDto {
  @ApiPropertyOptional({ description: 'ID bước hiện có (khi sửa)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'Cắm trụ Implant' })
  @IsString()
  @IsNotEmpty({ message: 'Tên bước không được để trống' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'R46' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  targetTooth?: string;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;
}

export class CreateTreatmentPlanDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'Niềng răng mắc cài kim loại' })
  @IsString()
  @IsNotEmpty({ message: 'Tên kế hoạch không được để trống' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedEndDate?: string;

  @ApiProperty({ type: [TreatmentPlanStepInputDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Kế hoạch cần ít nhất một bước điều trị' })
  @ValidateNested({ each: true })
  @Type(() => TreatmentPlanStepInputDto)
  steps: TreatmentPlanStepInputDto[];
}
