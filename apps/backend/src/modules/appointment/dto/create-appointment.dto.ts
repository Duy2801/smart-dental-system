import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  doctorId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}