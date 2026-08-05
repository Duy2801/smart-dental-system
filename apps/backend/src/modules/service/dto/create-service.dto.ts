import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DepositCalculationMode } from '../../../../prisma/generated/enums';

export class ServiceMediaDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ServiceProcedureStepDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  stepOrder?: number;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}

export class ServiceFaqDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ServiceHighlightDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  icon: string;
}

export class CreateTreatmentMethodDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceMediaDto)
  media?: ServiceMediaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceProcedureStepDto)
  procedureSteps?: ServiceProcedureStepDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFaqDto)
  faqs?: ServiceFaqDto[];
}

export class CreateServiceDto {
  @IsString()
  category: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  detailSummary?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  depositOverrideEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  depositPolicyEnabled?: boolean;

  @IsOptional()
  @IsEnum(DepositCalculationMode)
  depositCalculationMode?: DepositCalculationMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceHighlightDto)
  highlights?: ServiceHighlightDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suitableFor?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedItems?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preparationNotes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aftercareNotes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  importantNotes?: string[];

  @IsOptional()
  @IsString()
  pricingNote?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTreatmentMethodDto)
  treatmentMethods?: CreateTreatmentMethodDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceMediaDto)
  media?: ServiceMediaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceProcedureStepDto)
  procedureSteps?: ServiceProcedureStepDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFaqDto)
  faqs?: ServiceFaqDto[];
}
