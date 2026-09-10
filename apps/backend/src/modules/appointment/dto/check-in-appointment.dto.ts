import { Equals, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckInAppointmentDto {
  @IsBoolean()
  @Equals(true)
  medicalHistoryConfirmed: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
