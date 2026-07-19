import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Dr. Tran Minh' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'doctor@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @Matches(/^[+]?[0-9]{9,15}$/)
  phone?: string;

  @ApiProperty({ example: 'Test@123456' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'DOC-001' })
  @IsString()
  @IsNotEmpty()
  doctorCode: string;

  @ApiProperty({ example: 'Orthodontics' })
  @IsString()
  @IsNotEmpty()
  specialization: string;

  @ApiProperty({ example: 'VN-DENT-0001' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiPropertyOptional({
    example:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example:
      'Bác sĩ có kinh nghiệm trong điều trị nha khoa thẩm mỹ và phục hình.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'Trưởng khoa Chỉnh nha' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Hệ thống Smart Dental AI' })
  @IsOptional()
  @IsString()
  workplace?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  yearsExperience?: number;
}
