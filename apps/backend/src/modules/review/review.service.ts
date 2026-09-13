import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewQueryDto } from './dto/review-query.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ReviewQueryDto) {
    const search = query.search?.trim();
    const rating = query.rating ?? 'ALL';
    const visibility = query.visibility ?? 'ALL';
    const page = query.page;
    const limit = query.limit;

    const where = {
      ...(visibility === 'VISIBLE'
        ? { isVisible: true }
        : visibility === 'HIDDEN'
          ? { isVisible: false }
          : {}),
      ...(rating === '5'
        ? { rating: 5 }
        : rating === '4'
          ? { rating: 4 }
          : rating === '3'
            ? { rating: { lte: 3 } }
            : {}),
      ...(search
        ? {
            OR: [
              { comment: { contains: search, mode: 'insensitive' as const } },
              {
                patient: {
                  user: {
                    fullName: {
                      contains: search,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [reviews, filteredTotal, ratingGroups] = await Promise.all([
      this.prisma.review.findMany({
        where,
        select: {
          id: true,
          rating: true,
          comment: true,
          isVisible: true,
          createdAt: true,
          patient: {
            select: {
              fullName: true,
              user: { select: { fullName: true } },
            },
          },
          doctor: { select: { user: { select: { fullName: true } } } },
          appointment: {
            select: {
              treatmentMethod: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({
        by: ['rating'],
        _count: { _all: true },
      }),
    ]);

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const group of ratingGroups) {
      if (group.rating >= 1 && group.rating <= 5) {
        ratingCounts[group.rating as keyof typeof ratingCounts] =
          group._count._all;
      }
    }

    const totalReviews = Object.values(ratingCounts).reduce(
      (total, count) => total + count,
      0,
    );
    const ratingSum = Object.entries(ratingCounts).reduce(
      (total, [value, count]) => total + Number(value) * count,
      0,
    );

    return {
      items: reviews.map((review) => ({
        id: review.id,
        patient_name:
          review.patient.fullName ??
          review.patient.user?.fullName ??
          'Bệnh nhân',
        doctor_name: `${review.doctor.user.fullName} (${review.appointment?.treatmentMethod?.name ?? 'Dịch vụ'})`,
        rating: review.rating,
        comment: review.comment ?? '',
        is_visible: review.isVisible,
        created_at: review.createdAt.toISOString(),
      })),
      summary: {
        averageRating:
          totalReviews === 0 ? '0.0' : (ratingSum / totalReviews).toFixed(1),
        ratingCounts,
        totalReviews,
      },
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
      },
    };
  }

  async updateVisibility(id: string, isVisible: boolean) {
    const result = await this.prisma.review.updateMany({
      where: { id },
      data: { isVisible },
    });

    if (result.count === 0) {
      throw new NotFoundException('review.not_found');
    }

    return {
      id,
      is_visible: isVisible,
    };
  }

  async remove(id: string) {
    const result = await this.prisma.review.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new NotFoundException('review.not_found');
    }

    return { message: 'review.deleted' };
  }
}
