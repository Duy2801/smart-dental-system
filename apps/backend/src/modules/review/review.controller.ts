import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReviewQueryDto } from './dto/review-query.dto';
import { UpdateReviewVisibilityDto } from './dto/update-review-visibility.dto';
import { ReviewService } from './review.service';

/** API công khai: chỉ trả các đánh giá đang hiển thị, bất kể query gửi lên. */
@ApiTags('Review')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  findAll(@Query() query: ReviewQueryDto) {
    return this.reviewService.findAll({ ...query, visibility: 'VISIBLE' });
  }
}

@ApiTags('Review')
@ApiBearerAuth()
@Controller('admin/reviews')
@Roles('ADMIN', 'RECEPTIONIST')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  findAll(@Query() query: ReviewQueryDto) {
    return this.reviewService.findAll(query);
  }

  @Patch(':id/visibility')
  updateVisibility(
    @Param('id') id: string,
    @Body() dto: UpdateReviewVisibilityDto,
  ) {
    return this.reviewService.updateVisibility(id, dto.is_visible);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
