import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AiService } from './ai.service';
import { ReceptionistChatDto } from './dto/receptionist-chat.dto';

@ApiTags('AI Receptionist')
@ApiBearerAuth()
@Controller('admin/ai/receptionist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RECEPTIONIST')
export class ReceptionistAiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReceptionistChatDto) {
    return this.aiService.receptionistChat(user, dto);
  }
}
