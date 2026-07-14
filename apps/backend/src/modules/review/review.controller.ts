import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewQueryDto } from './dto/review-query.dto';
import { UpdateReviewVisibilityDto } from './dto/update-review-visibility.dto';
import { ReviewService } from './review.service';

@ApiTags('Review')
@Controller(['reviews', 'admin/reviews'])
export class ReviewController {
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
