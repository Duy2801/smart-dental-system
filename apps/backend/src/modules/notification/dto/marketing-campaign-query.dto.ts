import { IsIn, IsOptional, IsString } from 'class-validator';

export class MarketingCampaignQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ALL', 'EMAIL', 'IN_APP'])
  channel?: 'ALL' | 'EMAIL' | 'IN_APP';
}
