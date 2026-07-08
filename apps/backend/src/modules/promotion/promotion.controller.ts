import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Promotion')
@Controller('promotions')
export class PromotionController {}
