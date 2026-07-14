import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStaffUserDto {
  @ApiProperty({ example: 'receptionist@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Test@123456' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'Le Thi Hoa' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '0923456789' })
  @IsOptional()
  @Matches(/^[+]?[0-9]{9,15}$/)
  phone?: string;
}
