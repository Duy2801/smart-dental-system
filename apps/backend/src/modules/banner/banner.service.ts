import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannerService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultBannersIfEmpty();
  }

  private async seedDefaultBannersIfEmpty() {
    const count = await this.prisma.banner.count();
    if (count > 0) return;

    const initialBanners: CreateBannerDto[] = [
      {
        title: 'Nha Khoa Thẩm Mỹ Công Nghệ Cao Smart Dental',
        description: 'Đội ngũ thạc sĩ, bác sĩ chuyên khoa với hệ thống trang thiết bị hiện đại chuẩn Châu Âu. Cam kết mang đến nụ cười hoàn hảo.',
        imageUrl: 'https://res.cloudinary.com/dpp9823/image/upload/v1722600000/dental_banner_1.jpg',
        linkUrl: '/service',
        targetType: 'SERVICE',
        displayOrder: 1,
        isActive: true,
      },
      {
        title: 'Niềng Răng Trong Suốt Invisalign & Trả Góp 0%',
        description: 'Khôi phục khớp cắn chuẩn xác và nụ cười tự tin không mắc cài. Ưu đãi miễn phí chụp phim 3D CT ConeBeam.',
        imageUrl: 'https://res.cloudinary.com/dpp9823/image/upload/v1722600000/dental_banner_2.jpg',
        linkUrl: '/promotions',
        targetType: 'PROMOTION',
        displayOrder: 2,
        isActive: true,
      },
      {
        title: 'Cấy Ghép Implant Thụy Sĩ - Bảo Hành Trọn Đời',
        description: 'Phục hình răng đã mất bằng công nghệ Implant không đau, ăn nhai chắc chắn như răng thật.',
        imageUrl: 'https://res.cloudinary.com/dpp9823/image/upload/v1722600000/dental_banner_3.jpg',
        linkUrl: '/service',
        targetType: 'SERVICE',
        displayOrder: 3,
        isActive: true,
      },
    ];

    for (const item of initialBanners) {
      await this.prisma.banner.create({
        data: item,
      });
    }
  }

  async findActive() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.banner.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.banner.findUnique({
      where: { id },
    });
  }

  async create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateBannerDto) {
    return this.prisma.banner.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
