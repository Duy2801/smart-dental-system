import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class DraftMedicalRecordDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  chatbotSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  serviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  doctorNotesHint?: string;
}
