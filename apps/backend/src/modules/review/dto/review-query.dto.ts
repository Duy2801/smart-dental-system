import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
