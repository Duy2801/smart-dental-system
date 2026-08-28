import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
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
  @Min(11)
  @Max(48)
  number!: number;

  @IsIn([...TOOTH_STATUSES])
  status!: (typeof TOOTH_STATUSES)[number];
}

export class DentalChartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DentalChartToothDto)
  @ArrayMaxSize(32)
  teeth!: DentalChartToothDto[];
}

export class UpdateMedicalRecordDto {
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
