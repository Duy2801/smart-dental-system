import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RefundStatus } from '../../../prisma/generated/enums';
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { RefundService } from './refund.service';

@ApiTags('Refund Requests')
@ApiBearerAuth()
@Controller('refund-requests')
export class RefundController {
  constructor(private service: RefundService) {}

  @Post()
  @Roles('PATIENT', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  createRefundRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRefundRequestDto,
  ) {
    return this.service.createRefundRequest(user, dto);
  }

  @Get('my')
  @Roles('PATIENT', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findMyRefunds(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findMyRefunds(user);
  }

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Query('status') status?: RefundStatus) {
    return this.service.findAll(status);
  }

  @Patch(':id/process')
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  processRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ProcessRefundDto,
  ) {
    return this.service.processRefund(id, user, dto);
  }
}
