import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payments')
export class PaymentController {}
