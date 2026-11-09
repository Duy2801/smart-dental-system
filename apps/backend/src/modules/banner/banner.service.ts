import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

const bannerCachePrefix = 'catalog:banners:';
const bannerCacheTtlSeconds = 10 * 60;

@Injectable()
export class BannerService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultBannersIfEmpty();
  }

  private async seedDefaultBannersIfEmpty() {
    const count = await this.prisma.banner.count();
    if (count > 0) return;

    const initialBanners: CreateBannerDto[] = [
      {
        title: 'Nha Khoa Thẩm Mỹ Công Nghệ Cao Smart Dental',
        description:
          'Chăm sóc nụ cười toàn diện cùng đội ngũ thạc sĩ, bác sĩ chuyên khoa với hệ thống trang thiết bị hiện đại chuẩn Châu Âu.',
        imageUrl:
          'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1786204828/smart-dental/banners/bannerhome.png',
        linkUrl: '/booking',
        targetType: 'SERVICE',
        displayOrder: 1,
        isActive: true,
      },
      {
        title: 'Ưu Đãi Niềng Răng Thẩm Mỹ 30%',
        description:
          'Giảm ngay 30% gói Niềng Răng Thẩm Mỹ (Mắc cài & Trong suốt). Mô phỏng nụ cười 3D ClinCheck miễn phí.',
        imageUrl:
          'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763841/smart-dental/promotions/banner-nieng-rang.png',
        linkUrl: '/promotions',
        targetType: 'PROMOTION',
        displayOrder: 2,
        isActive: false,
      },
      {
        title: 'Trồng Răng Implant Giảm Ngay 5 Triệu',
        description:
          'Trồng răng Implant chuyên nghiệp giảm trực tiếp 5.000.000đ cho mỗi trụ Implant. Miễn phí chụp phim CT ConeBeam 3D.',
        imageUrl:
          'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763842/smart-dental/promotions/banner-implant.png',
        linkUrl: '/promotions',
        targetType: 'PROMOTION',
        displayOrder: 3,
        isActive: false,
      },
      {
        title: 'Nhổ Răng Không Đau Giảm 500K',
        description:
          'Tiểu phẫu nhổ răng khôn mọc lệch, mọc ngầm công nghệ siêu âm không đau, an toàn, hiệu quả.',
        imageUrl:
          'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763843/smart-dental/promotions/banner-nho-rang.png',
        linkUrl: '/promotions',
        targetType: 'PROMOTION',
        displayOrder: 4,
        isActive: false,
      },
      {
        title: 'Lấy Cao Răng Siêu Âm Chỉ Từ 99K',
        description:
          'Dịch vụ lấy cao răng công nghệ sóng siêu âm nhẹ nhàng không buốt giá, làm sạch mảng bám mang lại hàm răng sáng bóng.',
        imageUrl:
          'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763844/smart-dental/promotions/banner-cao-rang.png',
        linkUrl: '/promotions',
        targetType: 'PROMOTION',
        displayOrder: 5,
        isActive: false,
      },
    ];

    for (const item of initialBanners) {
      await this.prisma.banner.create({
        data: item,
      });
    }
  }

  // Trang chủ bệnh nhân chỉ hiển thị đúng 1 banner đang bật
  async findActive() {
    return this.redis.rememberJson(
      `${bannerCachePrefix}active`,
      bannerCacheTtlSeconds,
      () =>
        this.prisma.banner.findMany({
          where: { isActive: true },
          orderBy: [{ updatedAt: 'desc' }],
          take: 1,
        }),
    );
  }

  async findAll() {
    return this.redis.rememberJson(
      `${bannerCachePrefix}all`,
      bannerCacheTtlSeconds,
      () =>
        this.prisma.banner.findMany({
          orderBy: { displayOrder: 'asc' },
        }),
    );
  }

  async findOne(id: string) {
    return this.redis.rememberJson(
      `${bannerCachePrefix}detail:${id}`,
      bannerCacheTtlSeconds,
      () => this.prisma.banner.findUnique({ where: { id } }),
    );
  }

  async create(dto: CreateBannerDto) {
    const isActive = dto.isActive ?? true;
    const result = await this.prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.banner.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }
      return tx.banner.create({ data: { ...dto, isActive } });
    });
    await this.invalidateCache();
    return result;
  }

  async update(id: string, dto: UpdateBannerDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Bật banner này thì tự động tắt các banner đang hiển thị khác
      if (dto.isActive === true) {
        await tx.banner.updateMany({
          where: { isActive: true, id: { not: id } },
          data: { isActive: false },
        });
      }
      return tx.banner.update({ where: { id }, data: dto });
    });
    await this.invalidateCache();
    return result;
  }

  async remove(id: string) {
    const result = await this.prisma.banner.delete({
      where: { id },
    });
    await this.invalidateCache();
    return result;
  }

  private invalidateCache() {
    return this.redis.delByPrefix(bannerCachePrefix);
  }
}
