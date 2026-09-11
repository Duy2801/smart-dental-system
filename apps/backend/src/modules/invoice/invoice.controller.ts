import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceService } from './invoice.service';

@ApiTags('Invoice')
@ApiBearerAuth()
@Controller(['invoices', 'admin/invoices'])
@Roles('RECEPTIONIST', 'ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  findAll(@Query() query: InvoiceQueryDto) {
    return this.invoiceService.findAll(query);
  }
}
