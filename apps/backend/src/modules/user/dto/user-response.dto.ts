import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserStatus } from '../../../../prisma/generated/enums';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  fullName: string;

  @ApiPropertyOptional()
  @Expose()
  phone?: string | null;

  @ApiProperty({ type: [String] })
  @Expose()
  roles?: string[];

  @ApiProperty({ enum: UserStatus })
  @Expose()
  status: UserStatus;

  @ApiProperty()
  @Expose()
  emailVerified: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
