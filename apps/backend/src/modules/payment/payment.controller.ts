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
import { timingSafeEqual } from 'crypto';
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
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
    if (!expected) {
      throw new UnauthorizedException('sepay.webhook_key_missing');
    }
    const bearer = authorization?.replace(/^Bearer\s+/i, '').trim();
    const provided = bearer || apiKeyHeader || '';
    const bufProvided = Buffer.from(provided);
    const bufExpected = Buffer.from(expected);
    if (
      bufProvided.length !== bufExpected.length ||
      !timingSafeEqual(bufProvided, bufExpected)
    ) {
      throw new UnauthorizedException('sepay.unauthorized');
    }
    return this.paymentService.handleSepayWebhook(dto);
  }

  @Post()
  @ApiBearerAuth()
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    await this.paymentService.ensureInvoiceAccess(user, dto.invoiceId);
    return this.paymentService.createPayment(user.userId, dto);
  }

  @Get('invoice/:invoiceId')
  @ApiBearerAuth()
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invoiceId') invoiceId: string,
  ) {
    await this.paymentService.ensureInvoiceAccess(user, invoiceId);
    return this.paymentService.getPaymentByInvoice(invoiceId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const payment = await this.paymentService.getPayment(id);
    await this.paymentService.ensureInvoiceAccess(user, payment.invoiceId);
    return payment;
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

  @Post('invoices/:invoiceId/remind')
  @ApiBearerAuth()
  @Roles('RECEPTIONIST', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remindInvoicePayment(@Param('invoiceId') invoiceId: string) {
    return this.paymentService.sendPaymentReminder(invoiceId);
  }
}

