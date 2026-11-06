import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleVideoConsultationDto {
  @ApiProperty({ description: 'Thời gian tư vấn mới (ISO 8601)' })
  @IsDateString()
  scheduledAt: string;
}
