import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminReviewController, ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewController, AdminReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
