import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Review')
@Controller('reviews')
export class ReviewController {}
