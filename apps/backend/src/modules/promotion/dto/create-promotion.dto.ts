import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DiscountType } from '../../../../prisma/generated/enums';

export class CreatePromotionDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @IsNumber()
  @Min(1)
  discount_value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_uses?: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  applicable_service_slug?: string;

  @IsOptional()
  @IsString()
  applicable_treatment_method_id?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  broadcast_notification?: boolean;
}
