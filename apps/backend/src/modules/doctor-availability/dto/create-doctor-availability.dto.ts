import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  AvailabilityApprovalStatus,
  AvailabilityRecordType,
} from '../../../../prisma/generated/client';

export class CreateDoctorAvailabilityDto {
  @IsUUID()
  doctorId: string;

  @IsEnum(AvailabilityRecordType)
  recordType: AvailabilityRecordType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsDateString()
  specificDate?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(AvailabilityApprovalStatus)
  approvalStatus?: AvailabilityApprovalStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

