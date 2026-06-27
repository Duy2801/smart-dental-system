import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'backvia149@gmail.com' })
  @IsEmail({}, { message: 'validator.email' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(6, { message: 'validator.password_length' })
  password: string;

  @ApiProperty({ example: 'Nhan Pham' })
  @IsString()
  fullName: string;

  @ApiProperty({})
  @IsNumber({}, { each: true })
  roles?: number[];
}
