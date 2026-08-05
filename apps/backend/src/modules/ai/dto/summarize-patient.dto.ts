import { IsOptional, IsUUID } from 'class-validator';

export class SummarizePatientDto {
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;
}
