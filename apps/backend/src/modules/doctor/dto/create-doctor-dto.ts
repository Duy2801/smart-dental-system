import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
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
}
