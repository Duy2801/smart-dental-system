import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from 'src/common/decorators/curent-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { PaymentService } from './payment.service';

@ApiTags('Payment')
@Controller(['payments', 'admin/payments'])
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly config: ConfigService,
  ) {}

  /** Webhook SePay — URL: POST /api/v1/payments/webhook/sepay */
  @Post('webhook/sepay')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidNonWhitelisted: false,
    }),
  )
  sepayWebhook(
    @Body() dto: SepayWebhookDto,
    @Headers('authorization') authorization?: string,
    @Headers('x-api-key') apiKeyHeader?: string,
  ) {
    const expected =
      this.config.get<string>('SEPAY_WEBHOOK_API_KEY') ||
      this.config.get<string>('SEPAY_API_KEY');
    if (expected) {
      const bearer = authorization?.replace(/^Bearer\s+/i, '').trim();
      const provided = bearer || apiKeyHeader || '';
      if (provided !== expected) {
        throw new UnauthorizedException('sepay.unauthorized');
      }
    }
    return this.paymentService.handleSepayWebhook(dto);
  }

  @Post()
  @ApiBearerAuth()
  @Roles('RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment(user.userId, dto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles('RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.paymentService.getPayment(id);
  }

  @Patch(':id/confirm')
  @ApiBearerAuth()
  @Roles('RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.paymentService.confirmByStaff(user.userId, id);
  }
}
