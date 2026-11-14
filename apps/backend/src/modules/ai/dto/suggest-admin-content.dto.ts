import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const ADMIN_CONTENT_KINDS = ['service', 'treatment_method', 'promotion'] as const;
export type AdminContentKind = (typeof ADMIN_CONTENT_KINDS)[number];

export class SuggestAdminContentDto {
  @IsIn(ADMIN_CONTENT_KINDS)
  kind: AdminContentKind;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  serviceName?: string;

  /** Mức giảm, phạm vi, thời hạn... để AI viết mô tả khuyến mãi cho đúng */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  promotionContext?: string;
}
