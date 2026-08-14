import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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
