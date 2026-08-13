import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class DraftPrescriptionDto {
  @IsOptional()
  @IsUUID()
  medicalRecordId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  treatmentNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  medicalHistory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  serviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  doctorNotesHint?: string;
}
