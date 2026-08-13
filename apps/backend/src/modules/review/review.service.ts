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

    const reviews = await this.prisma.review.findMany({
      where: {
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
                { comment: { contains: search, mode: 'insensitive' } },
                {
                  patient: {
                    user: {
                      fullName: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: { include: { treatmentMethod: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((review) => ({
      id: review.id,
      patient_name: review.patient.fullName ?? review.patient.user?.fullName ?? 'Benh nhan',
      doctor_name: `${review.doctor.user.fullName} (${review.appointment?.treatmentMethod?.name ?? 'Dich vu'})`,
      rating: review.rating,
      comment: review.comment ?? '',
      is_visible: review.isVisible,
      created_at: review.createdAt.toISOString(),
    }));
  }

  async updateVisibility(id: string, isVisible: boolean) {
    await this.ensureExists(id);

    const review = await this.prisma.review.update({
      where: { id },
      data: { isVisible },
    });

    return {
      id: review.id,
      is_visible: review.isVisible,
    };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.review.delete({ where: { id } });
    return { message: 'review.deleted' };
  }

  private async ensureExists(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!review) {
      throw new NotFoundException('review.not_found');
    }
  }
}
