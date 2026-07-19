import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClinicalCaseService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(limit = 6) {
    return this.prisma.clinicalCase.findMany({
      where: {
        isPublished: true,
        patientConsentPublic: true,
      },
      take: limit,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        doctor: { include: { user: true } },
        service: true,
        patient: { include: { user: true } },
      },
    });
  }
}
