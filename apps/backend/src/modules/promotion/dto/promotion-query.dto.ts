import { IsOptional, IsString } from 'class-validator';

export class PromotionQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
