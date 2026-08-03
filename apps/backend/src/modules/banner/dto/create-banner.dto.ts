import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({ description: 'Tiêu đề của Banner' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết banner' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'URL hình ảnh banner (từ Cloudinary)' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Đường dẫn liên kết khi nhấn vào banner' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ description: 'Loại điều hướng (SERVICE, PROMOTION, EXTERNAL)' })
  @IsOptional()
  @IsString()
  targetType?: string;

  @ApiPropertyOptional({ description: 'ID của đối tượng điều hướng' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị' })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
