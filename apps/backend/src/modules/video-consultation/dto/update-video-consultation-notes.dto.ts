import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateVideoConsultationNotesDto {
  @ApiPropertyOptional({ nullable: true, maxLength: 10000 })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(10000, { message: 'Ghi chú tối đa 10.000 ký tự' })
  notes?: string | null;
}
