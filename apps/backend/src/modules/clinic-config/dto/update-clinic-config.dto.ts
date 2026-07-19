import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class BusinessHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  id: number;

  @IsString()
  label: string;

  @IsBoolean()
  isOpen: boolean;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  start: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  end: string;
}

export class ClinicSpecialDateDto {
  @IsDateString()
  date: string;

  @IsString()
  @MaxLength(120)
  label: string;

  @IsBoolean()
  isClosed: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  start?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  end?: string;
}

export class UpdateClinicConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHourDto)
  businessHours?: BusinessHourDto[];

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  slotIntervalMinutes?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicSpecialDateDto)
  specialDates?: ClinicSpecialDateDto[];
}
