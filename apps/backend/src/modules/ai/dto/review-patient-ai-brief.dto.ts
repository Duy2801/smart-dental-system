import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum PatientAiBriefFeedback {
  HELPFUL = 'HELPFUL',
  INACCURATE = 'INACCURATE',
  MISSED_RISK = 'MISSED_RISK',
}

export class ReviewPatientAiBriefDto {
  @IsEnum(PatientAiBriefFeedback)
  feedback!: PatientAiBriefFeedback;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
