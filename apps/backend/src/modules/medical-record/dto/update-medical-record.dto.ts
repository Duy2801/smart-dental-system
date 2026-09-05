import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const TOOTH_STATUSES = [
  'healthy',
  'caries',
  'filled',
  'missing',
  'crown',
  'root_canal',
  'implant',
  'treated',
] as const;

const FDI_TOOTH_NUMBERS = [
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
] as const;

export class MedicalRecordImageDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  /** URL http(s) tới ảnh đã upload / cloud */
  @IsString()
  @MaxLength(2000)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string | null;

  @IsOptional()
  @IsIn(['xray', 'intraoral', 'other'])
  type?: 'xray' | 'intraoral' | 'other';
}

export class DentalChartToothDto {
  @IsInt()
  @IsIn([...FDI_TOOTH_NUMBERS])
  number!: number;

  @IsIn([...TOOTH_STATUSES])
  status!: (typeof TOOTH_STATUSES)[number];
}

export class DentalChartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DentalChartToothDto)
  @ArrayMaxSize(32)
  @ArrayUnique((tooth: DentalChartToothDto) => tooth.number)
  teeth!: DentalChartToothDto[];
}

export class UpdateMedicalRecordDto {
  @IsOptional()
  @IsDateString()
  expectedUpdatedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  chiefComplaint?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  diagnosis?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  treatmentNotes?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  internalNotes?: string | null;

  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsDateString()
  @IsOptional()
  followUpDate?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalRecordImageDto)
  @ArrayMaxSize(20)
  images?: MedicalRecordImageDto[] | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @ValidateNested()
  @Type(() => DentalChartDto)
  dentalChart?: DentalChartDto | null;
}
