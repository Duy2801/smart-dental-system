import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export enum AutoScheduleMode {
  REPLACE = 'REPLACE',
  APPEND = 'APPEND',
}

export class AutoWeeklyShiftDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;
}

export class AutoWeeklyAvailabilityDto {
  @IsUUID()
  doctorId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  daysOfWeek: number[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AutoWeeklyShiftDto)
  shifts: AutoWeeklyShiftDto[];

  @IsEnum(AutoScheduleMode)
  mode: AutoScheduleMode = AutoScheduleMode.REPLACE;
}
