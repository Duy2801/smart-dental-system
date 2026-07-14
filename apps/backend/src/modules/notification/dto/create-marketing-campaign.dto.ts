import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationChannel } from '../../../../prisma/generated/enums';

export class CreateMarketingCampaignDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}
