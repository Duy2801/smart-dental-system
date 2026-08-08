import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateVideoConsultationDto {
  @ApiProperty({ description: 'ID của bác sĩ tư vấn' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ description: 'Thời gian bắt đầu hẹn tư vấn (ISO string)' })
  @IsString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiProperty({
    description: 'Thời lượng tư vấn (phút): 15, 30, hoặc 60',
    enum: [15, 30, 60],
  })
  @IsInt()
  @IsIn([15, 30, 60])
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Lý do khám / Triệu chứng bệnh nhân mô tả' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Danh sách URL hình ảnh / tài liệu đính kèm', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class GetConsultationSlotsDto {
  @ApiProperty({ description: 'ID của bác sĩ' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ description: 'Ngày muốn chọn (định dạng YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Thời lượng tư vấn (15, 30, 60 phút)', enum: [15, 30, 60] })
  @IsInt()
  @IsIn([15, 30, 60])
  durationMinutes: number;
}
