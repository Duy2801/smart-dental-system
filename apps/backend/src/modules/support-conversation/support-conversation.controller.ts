import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { SendSupportMessageDto } from './dto/send-message.dto';
import { SupportConversationService } from './support-conversation.service';

@ApiTags('Support Conversation')
@ApiBearerAuth()
@Controller(['support-conversations', 'admin/support-conversations'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportConversationController {
  constructor(private readonly service: SupportConversationService) {}

  @Post()
  @Roles('PATIENT')
  openConversation(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getOrCreateForPatient(user.userId);
  }

  @Get('current')
  @Roles('PATIENT')
  getCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getCurrentForPatient(user.userId);
  }

  @Get('unclaimed')
  @Roles('RECEPTIONIST', 'ADMIN')
  listUnclaimed() {
    return this.service.listUnclaimed();
  }

  @Get('mine')
  @Roles('RECEPTIONIST', 'ADMIN')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMine(user);
  }

  @Post(':id/claim')
  @Roles('RECEPTIONIST', 'ADMIN')
  claim(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.claim(id, user);
  }

  @Get(':id/messages')
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  getMessages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getMessages(id, user);
  }

  @Post(':id/messages')
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendSupportMessageDto,
  ) {
    return this.service.sendMessage(id, user, dto.content);
  }

  @Patch(':id/read')
  @Roles('RECEPTIONIST', 'ADMIN')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.markRead(id, user);
  }

  @Post(':id/close')
  @Roles('RECEPTIONIST', 'ADMIN')
  close(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.close(id, user);
  }
}
