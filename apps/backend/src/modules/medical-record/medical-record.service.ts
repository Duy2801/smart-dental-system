import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const recordInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      user: { select: { fullName: true, phone: true } },
    },
  },
  appointment: {
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      service: { select: { name: true } },
    },
  },
  prescriptionRecords: {
    include: { items: true },
  },
} as const;

@Injectable()
export class MedicalRecordService {
  constructor(private prisma: PrismaService) {}

  async findByDoctor(doctorId: string) {
    const records = await this.prisma.medicalRecord.findMany({
      where: { doctorId },
      include: recordInclude,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toSummary(r));
  }

  async findOne(id: string) {
    const r = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: recordInclude,
    });
    if (!r) throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
    return this.toDetail(r);
  }

  async update(id: string, dto: {
    chiefComplaint?: string;
    diagnosis?: string;
    treatmentNotes?: string;
    internalNotes?: string;
    followUpDate?: string | null;
  }) {
    const exists = await this.prisma.medicalRecord.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Không tìm thấy hồ sơ bệnh án');
    const updated = await this.prisma.medicalRecord.update({
      where: { id },
      data: {
        chiefComplaint: dto.chiefComplaint,
        diagnosis: dto.diagnosis,
        treatmentNotes: dto.treatmentNotes,
        internalNotes: dto.internalNotes,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      },
      include: recordInclude,
    });
    return this.toDetail(updated);
  }

  private toSummary(r: any) {
    return {
      id: r.id,
      patientId: r.patientId,
      patientName: r.patient?.user?.fullName ?? '—',
      patientCode: r.patient?.patientCode ?? '—',
      diagnosis: r.diagnosis ?? null,
      chiefComplaint: r.chiefComplaint ?? null,
      serviceName: r.appointment?.service?.name ?? null,
      scheduledAt: r.appointment?.scheduledAt ?? null,
      followUpDate: r.followUpDate ?? null,
      prescriptionCount: r.prescriptionRecords?.length ?? 0,
      createdAt: r.createdAt,
    };
  }

  private toDetail(r: any) {
    return {
      ...this.toSummary(r),
      treatmentNotes: r.treatmentNotes ?? null,
      internalNotes: r.internalNotes ?? null,
      patientPhone: r.patient?.user?.phone ?? null,
      appointmentStatus: r.appointment?.status ?? null,
      prescriptions: (r.prescriptionRecords ?? []).map((p: any) => ({
        id: p.id,
        notes: p.notes,
        items: p.items ?? [],
        createdAt: p.createdAt,
      })),
    };
  }
}
