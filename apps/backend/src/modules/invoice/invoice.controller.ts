import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceService } from './invoice.service';

@ApiTags('Invoice')
@Controller(['invoices', 'admin/invoices'])
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  findAll(@Query() query: InvoiceQueryDto) {
    return this.invoiceService.findAll(query);
  }
}
