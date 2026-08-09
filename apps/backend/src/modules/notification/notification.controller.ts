import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/curent-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { MarketingCampaignQueryDto } from './dto/marketing-campaign-query.dto';
import { NotificationService } from './notification.service';

@ApiTags('Notification')
@ApiBearerAuth()
@Controller(['notifications', 'admin/marketing-campaigns'])
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('my-notifications')
  @UseGuards(JwtAuthGuard)
  findUserNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationService.findUserNotifications(user.userId, {
      type,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.getUnreadCount(user.userId);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notificationService.markAsRead(user.userId, id);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAllAsRead(user.userId);
  }

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

