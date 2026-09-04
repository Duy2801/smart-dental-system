import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { MarketingCampaignQueryDto } from './dto/marketing-campaign-query.dto';
import { NotificationService } from './notification.service';

@ApiTags('Admin Marketing Campaigns')
@ApiBearerAuth()
@Controller('admin/marketing-campaigns')
export class AdminMarketingCampaignController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List marketing campaign broadcasts' })
  findMarketingCampaigns(@Query() query: MarketingCampaignQueryDto) {
    return this.notificationService.findMarketingCampaigns(query);
  }

  @Post()
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create and broadcast a marketing campaign' })
  createMarketingCampaign(@Body() dto: CreateMarketingCampaignDto) {
    return this.notificationService.createMarketingCampaign(dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a marketing campaign' })
  removeMarketingCampaign(@Param('id') id: string) {
    return this.notificationService.removeMarketingCampaign(id);
  }
}
