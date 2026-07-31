import { IsDateString, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateMedicalRecordDto {
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
}
