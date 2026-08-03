import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TreatmentPlanStatus } from '../../../../prisma/generated/enums';
import { TreatmentPlanStepInputDto } from './create-treatment-plan.dto';

export class UpdateTreatmentPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên kế hoạch không được để trống' })
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: TreatmentPlanStatus })
  @IsOptional()
  @IsEnum(TreatmentPlanStatus)
  status?: TreatmentPlanStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedEndDate?: string | null;

  @ApiPropertyOptional({ type: [TreatmentPlanStepInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Kế hoạch cần ít nhất một bước điều trị' })
  @ValidateNested({ each: true })
  @Type(() => TreatmentPlanStepInputDto)
  steps?: TreatmentPlanStepInputDto[];
}
