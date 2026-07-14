import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ALL', '5', '4', '3'])
  rating?: 'ALL' | '5' | '4' | '3';

  @IsOptional()
  @IsIn(['ALL', 'VISIBLE', 'HIDDEN'])
  visibility?: 'ALL' | 'VISIBLE' | 'HIDDEN';
}
