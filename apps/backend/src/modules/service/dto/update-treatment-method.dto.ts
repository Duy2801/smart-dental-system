import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateTreatmentMethodDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsInt()
  @Min(0)
  displayOrder: number;

  @IsBoolean()
  isActive: boolean;
}
