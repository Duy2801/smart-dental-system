import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { MarketingCampaignQueryDto } from './dto/marketing-campaign-query.dto';
import { NotificationService } from './notification.service';

@ApiTags('Notification')
@Controller(['notifications', 'admin/marketing-campaigns'])
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findMarketingCampaigns(@Query() query: MarketingCampaignQueryDto) {
    return this.notificationService.findMarketingCampaigns(query);
  }

  @Post()
  createMarketingCampaign(@Body() dto: CreateMarketingCampaignDto) {
    return this.notificationService.createMarketingCampaign(dto);
  }

  @Delete(':id')
  removeMarketingCampaign(@Param('id') id: string) {
    return this.notificationService.removeMarketingCampaign(id);
  }
}
