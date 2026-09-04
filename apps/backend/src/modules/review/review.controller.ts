import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReviewQueryDto } from './dto/review-query.dto';
import { UpdateReviewVisibilityDto } from './dto/update-review-visibility.dto';
import { ReviewService } from './review.service';

@ApiTags('Review')
@ApiBearerAuth()
@Controller(['reviews', 'admin/reviews'])
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  findAll(@Query() query: ReviewQueryDto) {
    return this.reviewService.findAll(query);
  }

  @Patch(':id/visibility')
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateVisibility(
    @Param('id') id: string,
    @Body() dto: UpdateReviewVisibilityDto,
  ) {
    return this.reviewService.updateVisibility(id, dto.is_visible);
  }

  @Delete(':id')
  @Roles('ADMIN', 'RECEPTIONIST')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}

