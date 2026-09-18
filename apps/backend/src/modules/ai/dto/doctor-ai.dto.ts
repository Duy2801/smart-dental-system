import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PrescriptionReviewItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medicineName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dosage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  frequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instruction?: string;
}

export class ReviewPrescriptionDto {
  @IsOptional()
  @IsUUID()
  medicalRecordId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionReviewItemDto)
  items!: PrescriptionReviewItemDto[];
}

export class GenerateAftercareDto {
  @IsUUID()
  medicalRecordId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  treatmentNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  followUpDate?: string;
}

export class SendAftercareDto extends GenerateAftercareDto {
  @IsString()
  @MaxLength(12000)
  content!: string;
}

export class ExplainTreatmentPlanDto {
  @IsUUID()
  treatmentPlanId!: string;
}

export class AnalyzeXrayDto {
  @IsUUID()
  imageId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  clinicalNoteHint?: string;
}

export class XrayBoundingBoxDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  x!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  y!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  width!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  height!: number;
}

export class ReviewedXrayFindingDto {
  @IsOptional()
  @IsUUID()
  findingId?: string;

  @IsInt()
  @IsIn([
    11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33,
    34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48,
  ])
  fdiToothNumber!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  findingType!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => XrayBoundingBoxDto)
  boundingBox!: XrayBoundingBoxDto;

  @IsIn(['UNASSESSED', 'LOW', 'MEDIUM', 'HIGH'])
  severity!: 'UNASSESSED' | 'LOW' | 'MEDIUM' | 'HIGH';

  @IsOptional()
  @IsIn(['AI', 'DOCTOR'])
  source?: 'AI' | 'DOCTOR';

  @IsIn(['ACCEPTED', 'REJECTED'])
  doctorStatus!: 'ACCEPTED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  doctorNote?: string;
}

export class ReviewXrayAnalysisDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ReviewedXrayFindingDto)
  findings!: ReviewedXrayFindingDto[];
}
