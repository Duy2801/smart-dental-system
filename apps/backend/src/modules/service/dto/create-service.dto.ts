import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

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
