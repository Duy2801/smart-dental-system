import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AiService } from './ai.service';
import { SuggestAdminContentDto } from './dto/suggest-admin-content.dto';

@ApiTags('AI Admin Assist')
@ApiBearerAuth()
@Controller('admin/ai/content')
@UseGuards(JwtAuthGuard, RolesGuard)
// Cùng quyền với API thêm/sửa dịch vụ và khuyến mãi
@Roles('ADMIN', 'RECEPTIONIST')
export class AdminAiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest')
  suggest(@CurrentUser() user: AuthenticatedUser, @Body() dto: SuggestAdminContentDto) {
    return this.aiService.suggestAdminContent(user, dto);
  }
}
