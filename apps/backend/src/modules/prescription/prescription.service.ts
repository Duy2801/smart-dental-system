import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrescriptionService {
  constructor(private prisma: PrismaService) {}

  async findByDoctor(doctorId: string) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: { doctorId },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            patientCode: true,
            user: { select: { fullName: true } },
          },
        },
        medicalRecord: {
          select: { diagnosis: true, appointment: { select: { scheduledAt: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return prescriptions.map((p) => ({
      id: p.id,
      patientId: p.patientId,
      patientName: p.patient?.user?.fullName ?? '—',
      patientCode: p.patient?.patientCode ?? '—',
      diagnosis: p.medicalRecord?.diagnosis ?? null,
      scheduledAt: p.medicalRecord?.appointment?.scheduledAt ?? null,
      notes: p.notes ?? null,
      itemCount: p.items?.length ?? 0,
      items: p.items ?? [],
      createdAt: p.createdAt,
    }));
  }

  async create(doctorId: string, dto: {
    patientId: string;
    medicalRecordId: string;
    notes?: string;
    items: Array<{
      medicineName: string;
      dosage: string;
      frequency?: string;
      duration?: string;
      instruction?: string;
    }>;
  }) {
    return this.prisma.prescription.create({
      data: {
        doctorId,
        patientId: dto.patientId,
        medicalRecordId: dto.medicalRecordId,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instruction: item.instruction,
          })),
        },
      },
      include: { items: true },
    });
  }
}
