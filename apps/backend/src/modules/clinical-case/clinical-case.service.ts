import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_PUBLIC_CASES = 24;

@Injectable()
export class ClinicalCaseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * API công khai. Bệnh nhân chỉ đồng ý công khai ca điều trị, không đồng ý công khai
   * tài khoản của họ, nên chỉ trả tên bác sĩ và dịch vụ, không trả thông tin bệnh nhân.
   */
  async findPublished(limit = 6) {
    return this.prisma.clinicalCase.findMany({
      where: {
        isPublished: true,
        patientConsentPublic: true,
      },
      take: Math.min(Math.max(1, Math.floor(limit)), MAX_PUBLIC_CASES),
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      omit: { patientId: true },
      include: {
        doctor: {
          select: {
            id: true,
            avatarUrl: true,
            specialization: true,
            user: { select: { fullName: true } },
          },
        },
        service: true,
      },
    });
  }
}
