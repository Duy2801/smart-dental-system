import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Invoice')
@Controller('invoices')
export class InvoiceController {}
