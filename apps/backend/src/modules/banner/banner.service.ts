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
        description: 'Chăm sóc nụ cười toàn diện cùng đội ngũ thạc sĩ, bác sĩ chuyên khoa với hệ thống trang thiết bị hiện đại chuẩn Châu Âu.',
        imageUrl: 'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1786204828/smart-dental/banners/bannerhome.png',
        linkUrl: '/booking',
        targetType: 'SERVICE',
        displayOrder: 1,
        isActive: true,
      },
      {
        title: 'Ưu Đãi Niềng Răng Thẩm Mỹ 30%',
        description: 'Giảm ngay 30% gói Niềng Răng Thẩm Mỹ (Mắc cài & Trong suốt). Mô phỏng nụ cười 3D ClinCheck miễn phí.',
        imageUrl: 'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763841/smart-dental/promotions/banner-nieng-rang.png',
        linkUrl: '/promotions',
        targetType: 'PROMOTION',
        displayOrder: 2,
        isActive: true,
      },
      {
        title: 'Trồng Răng Implant Giảm Ngay 5 Triệu',
        description: 'Trồng răng Implant chuyên nghiệp giảm trực tiếp 5.000.000đ cho mỗi trụ Implant. Miễn phí chụp phim CT ConeBeam 3D.',
        imageUrl: 'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763842/smart-dental/promotions/banner-implant.png',
        linkUrl: '/promotions',
        targetType: 'PROMOTION',
        displayOrder: 3,
        isActive: true,
      },
      {
        title: 'Nhổ Răng Không Đau Giảm 500K',
        description: 'Tiểu phẫu nhổ răng khôn mọc lệch, mọc ngầm công nghệ siêu âm không đau, an toàn, hiệu quả.',
        imageUrl: 'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763843/smart-dental/promotions/banner-nho-rang.png',
        linkUrl: '/promotions',
        targetType: 'PROMOTION',
        displayOrder: 4,
        isActive: true,
      },
      {
        title: 'Lấy Cao Răng Siêu Âm Chỉ Từ 99K',
        description: 'Dịch vụ lấy cao răng công nghệ sóng siêu âm nhẹ nhàng không buốt giá, làm sạch mảng bám mang lại hàm răng sáng bóng.',
        imageUrl: 'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763844/smart-dental/promotions/banner-cao-rang.png',
        linkUrl: '/promotions',
        targetType: 'PROMOTION',
        displayOrder: 5,
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
