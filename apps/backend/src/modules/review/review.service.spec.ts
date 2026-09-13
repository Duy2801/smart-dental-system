import { NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  const reviewRepository = {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };
  const service = new ReviewService({ review: reviewRepository } as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a paginated list and global rating summary', async () => {
    reviewRepository.findMany.mockResolvedValue([
      {
        id: 'review-1',
        rating: 5,
        comment: 'Tốt',
        isVisible: true,
        createdAt: new Date('2026-09-13T00:00:00.000Z'),
        patient: { fullName: 'Nguyễn An', user: null },
        doctor: { user: { fullName: 'Trần Bình' } },
        appointment: { treatmentMethod: { name: 'Khám tổng quát' } },
      },
    ]);
    reviewRepository.count.mockResolvedValue(21);
    reviewRepository.groupBy.mockResolvedValue([
      { rating: 5, _count: { _all: 2 } },
      { rating: 3, _count: { _all: 1 } },
    ]);

    const result = await service.findAll({
      page: 2,
      limit: 20,
      rating: 'ALL',
      visibility: 'ALL',
    });

    expect(reviewRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.summary).toEqual({
      averageRating: '4.3',
      ratingCounts: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 2 },
      totalReviews: 3,
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 21,
      totalPages: 2,
    });
  });

  it('updates visibility in one database operation', async () => {
    reviewRepository.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.updateVisibility('review-1', false)).resolves.toEqual({
      id: 'review-1',
      is_visible: false,
    });
    expect(reviewRepository.updateMany).toHaveBeenCalledTimes(1);
  });

  it('reports a missing review when deleting', async () => {
    reviewRepository.deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
