import { IsBoolean } from 'class-validator';

export class UpdatePromotionStatusDto {
  @IsBoolean()
  is_active: boolean;
}
