import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  AppointmentPaymentOption,
  AppointmentPaymentStatus,
  AppointmentStatus,
  BookingSource,
  Gender,
  InvoiceStatus,
  InvoiceType,
  PatientRelationship,
  PaymentMethod,
  PaymentStatus,
  TreatmentPlanStatus,
  TreatmentStepPaymentStatus,
  TreatmentStepStatus,
} from '../../../prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreateManagedPatientDto } from './dto/create-managed-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  async getManagedPatientProfiles(userId: string) {
    await this.findOrCreatePatientProfile(userId);

    const links = await this.prisma.patientAccount.findMany({
      where: { userId },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true, phone: true, email: true } },
            appointments: {
              orderBy: { scheduledAt: 'desc' },
              take: 1,
              select: { scheduledAt: true },
            },
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return links.map((link) => {
      const identity = this.getPatientIdentity(link.patient);
      return {
        id: link.patient.id,
        patientCode: link.patient.patientCode,
        fullName: identity.fullName,
        phone: identity.phone,
        email: identity.email,
        gender: link.patient.gender,
        dateOfBirth: link.patient.dateOfBirth,
        address: link.patient.address,
        medicalHistory: link.patient.medicalHistory,
        relationship: link.relationship,
        isPrimary: link.isPrimary,
        canBook: link.canBook,
        lastVisit: link.patient.appointments[0]?.scheduledAt ?? null,
      };
    });
  }

  async createManagedPatientProfile(
    userId: string,
    dto: CreateManagedPatientDto,
  ) {
    await this.findOrCreatePatientProfile(userId);

    const fullName = dto.fullName.trim();
    const phone = this.cleanText(dto.phone);
    const email = this.cleanText(dto.email)?.toLowerCase();
    const dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;

    const duplicate = await this.prisma.patient.findFirst({
      where: {
        fullName: { equals: fullName, mode: 'insensitive' },
        ...(dateOfBirth ? { dateOfBirth } : {}),
        patientAccounts: { some: { userId } },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException('patient.profile_exists');
    }

    const patient = await this.prisma.patient.create({
      data: {
        patientCode: await this.generatePatientCode(),
        fullName,
        phone,
        email,
        dateOfBirth,
        gender: dto.gender ?? Gender.UNKNOWN,
        address: this.cleanText(dto.address),
        medicalHistory: this.cleanText(dto.medicalHistory),
        patientAccounts: {
          create: {
            userId,
            relationship: dto.relationship ?? PatientRelationship.OTHER,
            isPrimary: false,
            canBook: true,
          },
        },
      },
      include: {
        user: { select: { fullName: true, phone: true, email: true } },
        patientAccounts: { where: { userId }, take: 1 },
      },
    });

    const identity = this.getPatientIdentity(patient);
    const link = patient.patientAccounts[0];
    return {
      id: patient.id,
      patientCode: patient.patientCode,
      fullName: identity.fullName,
      phone: identity.phone,
      email: identity.email,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      address: patient.address,
      medicalHistory: patient.medicalHistory,
      relationship: link?.relationship ?? PatientRelationship.OTHER,
      isPrimary: link?.isPrimary ?? false,
      canBook: link?.canBook ?? true,
      lastVisit: null,
    };
  }

  async findPatients(search?: string) {
    const q = search?.trim();
    const patients = await this.prisma.patient.findMany({
      where: q
        ? {
            OR: [
              { patientCode: { contains: q, mode: 'insensitive' } },
              {
                fullName: { contains: q, mode: 'insensitive' },
              },
              { phone: { contains: q } },
              { email: { contains: q, mode: 'insensitive' } },
              {
                user: {
                  is: {
                    OR: [
                      { fullName: { contains: q, mode: 'insensitive' } },
                      { phone: { contains: q } },
                      { email: { contains: q, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          }
        : undefined,
      include: {
        user: { select: { fullName: true, phone: true, email: true } },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
          select: { scheduledAt: true },
        },
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return patients.map((p) => {
      const identity = this.getPatientIdentity(p);
      const age = p.dateOfBirth
        ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
        : null;
      return {
        id: p.id,
        patientCode: p.patientCode,
        fullName: identity.fullName,
        phone: identity.phone,
        email: identity.email,
        gender: p.gender,
        age,
        dateOfBirth: p.dateOfBirth,
        medicalHistory: p.medicalHistory,
        allergies: this.parseAllergies(p.medicalHistory),
        lastVisit: p.appointments[0]?.scheduledAt ?? null,
        totalVisits: p._count.appointments,
      };
    });
  }

  async createPatient(dto: CreatePatientDto) {
    const phone = dto.phone.trim();
    const fullName = dto.fullName.trim();
    const email =
      dto.email?.trim().toLowerCase() ||
      `walkin.${phone.replace(/\D/g, '')}@clinic.local`;

    const [phoneExists, emailExists] = await Promise.all([
      this.prisma.user.findUnique({ where: { phone }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if (phoneExists) throw new ConflictException('auth.phone_exists');
    if (emailExists) throw new ConflictException('auth.email_exists');

    const role = await this.prisma.role.upsert({
      where: { code: 'PATIENT' },
      update: {},
      create: {
        code: 'PATIENT',
        name: 'Patient',
        description: 'Bệnh nhân sử dụng hệ thống',
      },
    });

    const medicalHistory = this.mergeMedicalHistory(
      dto.medicalHistory,
      dto.allergies,
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        phone,
        emailVerified: true,
        roles: { create: { roleId: role.id } },
        patientProfile: {
          create: {
            patientCode: await this.generatePatientCode(),
            fullName,
            phone,
            email,
            dateOfBirth: dto.dateOfBirth
              ? new Date(dto.dateOfBirth)
              : undefined,
            gender: dto.gender ?? Gender.UNKNOWN,
            address: dto.address?.trim() || undefined,
            medicalHistory,
            emergencyContactName: dto.emergencyContactName?.trim() || undefined,
            emergencyContactPhone:
              dto.emergencyContactPhone?.trim() || undefined,
          },
        },
      },
      include: { patientProfile: true },
    });

    const patient = user.patientProfile!;
    await this.ensurePatientAccountLink(user.id, patient.id, true);
    return {
      id: patient.id,
      patientCode: patient.patientCode,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      address: patient.address,
      medicalHistory: patient.medicalHistory,
      allergies: dto.allergies ?? [],
    };
  }

  async updatePatient(patientId: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, userId: true, medicalHistory: true },
    });
    if (!patient) throw new BadRequestException('patient.not_found');

    const allergies =
      dto.allergies !== undefined
        ? dto.allergies.map((s) => s.trim()).filter(Boolean)
        : this.parseAllergies(patient.medicalHistory);
    const historyOnly =
      dto.medicalHistory !== undefined
        ? this.stripAllergyLine(dto.medicalHistory)
        : this.stripAllergyLine(patient.medicalHistory);
    const medicalHistory =
      this.mergeMedicalHistory(historyOnly || undefined, allergies) ?? null;

    await this.prisma.$transaction([
      ...(patient.userId
        ? [
            this.prisma.user.update({
              where: { id: patient.userId },
              data: {
                ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
                ...(dto.phone ? { phone: dto.phone.trim() } : {}),
                ...(dto.email?.trim()
                  ? { email: dto.email.trim().toLowerCase() }
                  : {}),
              },
            }),
          ]
        : []),
      this.prisma.patient.update({
        where: { id: patientId },
        data: {
          ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
          ...(dto.phone !== undefined
            ? { phone: dto.phone.trim() || null }
            : {}),
          ...(dto.email !== undefined
            ? { email: dto.email?.trim().toLowerCase() || null }
            : {}),
          ...(dto.address !== undefined
            ? { address: dto.address.trim() || null }
            : {}),
          medicalHistory,
          ...(dto.dateOfBirth !== undefined
            ? {
                dateOfBirth: dto.dateOfBirth
                  ? new Date(dto.dateOfBirth)
                  : null,
              }
            : {}),
          ...(dto.gender ? { gender: dto.gender } : {}),
          ...(dto.emergencyContactName !== undefined
            ? {
                emergencyContactName:
                  dto.emergencyContactName.trim() || null,
              }
            : {}),
          ...(dto.emergencyContactPhone !== undefined
            ? {
                emergencyContactPhone:
                  dto.emergencyContactPhone.trim() || null,
              }
            : {}),
        },
      }),
    ]);

    return this.findPatientDetail(patientId);
  }

  async updateMyProfile(userId: string, dto: UpdatePatientDto) {
    const patient = await this.findOrCreatePatientProfile(userId);
    const allergies =
      dto.allergies !== undefined
        ? dto.allergies.map((s) => s.trim()).filter(Boolean)
        : undefined;
    const historyOnly =
      dto.medicalHistory !== undefined
        ? this.stripAllergyLine(dto.medicalHistory ?? undefined)
        : undefined;
    const medicalHistory =
      this.mergeMedicalHistory(historyOnly || undefined, allergies) ?? null;
    const fullName = this.cleanText(dto.fullName);
    const phone = this.cleanText(dto.phone);
    const email = this.cleanText(dto.email)?.toLowerCase();
    const address = this.cleanText(dto.address);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
        },
      }),
      this.prisma.patient.update({
        where: { id: patient.id },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
          ...(dto.address !== undefined ? { address: address || null } : {}),
          ...(medicalHistory !== null ? { medicalHistory } : {}),
          ...(dto.dateOfBirth !== undefined
            ? {
                dateOfBirth: dto.dateOfBirth
                  ? new Date(dto.dateOfBirth)
                  : null,
            }
            : {}),
          ...(dto.gender ? { gender: dto.gender } : {}),
        },
      }),
    ]);

    return this.getProfileSummary(userId);
  }

  private parseAllergies(medicalHistory?: string | null): string[] {
    if (!medicalHistory) return [];
    const match = medicalHistory.match(/Dị ứng:\s*(.+?)(?:\n|$)/i);
    if (!match?.[1]) return [];
    return match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private stripAllergyLine(medicalHistory?: string | null): string {
    if (!medicalHistory) return '';
    return medicalHistory
      .replace(/Dị ứng:\s*.+(?:\n|$)/gi, '')
      .trim();
  }

  private mergeMedicalHistory(
    history?: string,
    allergies?: string[],
  ): string | undefined {
    const parts: string[] = [];
    if (allergies?.length) {
      parts.push(`Dị ứng: ${allergies.join(', ')}`);
    }
    if (history?.trim()) parts.push(history.trim());
    return parts.length ? parts.join('\n') : undefined;
  }

  private cleanText(value?: string | null) {
    return value?.trim() || undefined;
  }

  private getPatientIdentity(patient: {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    user?: { fullName: string; phone: string | null; email: string | null } | null;
  }) {
    return {
      fullName: patient.fullName ?? patient.user?.fullName ?? 'Bệnh nhân',
      phone: patient.phone ?? patient.user?.phone ?? null,
      email: patient.email ?? patient.user?.email ?? null,
    };
  }

  private async ensurePatientAccountLink(
    userId: string,
    patientId: string,
    isPrimary = false,
  ) {
    await this.prisma.patientAccount.upsert({
      where: { userId_patientId: { userId, patientId } },
      update: {
        relationship: PatientRelationship.SELF,
        isPrimary,
        canBook: true,
      },
      create: {
        userId,
        patientId,
        relationship: PatientRelationship.SELF,
        isPrimary,
        canBook: true,
      },
    });
  }

  async resolveDoctorIdByUserId(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!doctor) {
      throw new ForbiddenException('Không tìm thấy hồ sơ bác sĩ');
    }
    return doctor.id;
  }

  async findPatientsByDoctor(doctorId: string, search?: string) {
    const q = search?.trim().toLowerCase();
    
    const patients = await this.prisma.patient.findMany({
      where: {
        OR: [
          { appointments: { some: { doctorId } } },
          { videoConsultations: { some: { doctorId } } }
        ]
      },
      include: {
        user: { select: { fullName: true, phone: true, email: true } },
        appointments: {
          where: { doctorId },
          select: { scheduledAt: true, status: true, service: { select: { name: true } } },
        },
        videoConsultations: {
          where: { doctorId },
          select: { scheduledAt: true, status: true, durationMinutes: true },
        },
      }
    });

    return patients.map((p) => {
      const identity = this.getPatientIdentity(p);
      const age = p.dateOfBirth
        ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
        : null;

      // Combine both types of visits
      const offlineVisits = p.appointments.map(a => ({
        scheduledAt: a.scheduledAt,
        serviceName: a.service?.name ?? 'Khám trực tiếp',
        status: a.status
      }));
      
      const onlineVisits = p.videoConsultations.map(vc => ({
        scheduledAt: vc.scheduledAt,
        serviceName: `Tư vấn trực tuyến (${vc.durationMinutes} phút)`,
        status: vc.status
      }));

      const allVisits = [...offlineVisits, ...onlineVisits].sort(
        (a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime()
      );
      
      const lastVisit = allVisits[0];

      return {
        id: p.id,
        patientCode: p.patientCode,
        fullName: identity.fullName,
        phone: identity.phone,
        email: identity.email,
        gender: p.gender,
        age,
        lastVisitDate: lastVisit?.scheduledAt ?? null,
        lastService: lastVisit?.serviceName ?? '—',
        lastStatus: lastVisit?.status ?? '—',
        totalVisits: allVisits.length,
        medicalHistory: p.medicalHistory,
      };
    })
      .filter((p) => {
        if (!q) return true;
        return (
          p.fullName.toLowerCase().includes(q) ||
          p.patientCode.toLowerCase().includes(q) ||
          (p.phone ?? '').includes(q) ||
          (p.email ?? '').toLowerCase().includes(q)
        );
      });
  }

  async findPatientDetail(patientId: string, doctorId?: string) {
    if (doctorId) {
      const [relatedAppt, relatedVideo] = await Promise.all([
        this.prisma.appointment.findFirst({
          where: { patientId, doctorId },
          select: { id: true },
        }),
        this.prisma.videoConsultation.findFirst({
          where: { patientId, doctorId },
          select: { id: true },
        })
      ]);

      if (!relatedAppt && !relatedVideo) {
        throw new ForbiddenException(
          'Bạn không có quyền xem bệnh nhân này',
        );
      }
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        patientCode: true,
        fullName: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        medicalHistory: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        user: { select: { fullName: true, phone: true, email: true } },
        treatmentPlans: {
          where: {
            status: { in: ['PLANNED', 'IN_PROGRESS'] },
            ...(doctorId ? { doctorId } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            expectedEndDate: true,
            items: true,
            steps: { select: { status: true } },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy bệnh nhân');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        ...(doctorId ? { doctorId } : {}),
      },
      select: {
        id: true,
        appointmentCode: true,
        scheduledAt: true,
        status: true,
        service: { select: { name: true } },
        doctor: { select: { user: { select: { fullName: true } } } },
        medicalRecords: { select: { id: true }, take: 1 },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    const age = patient.dateOfBirth
      ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
      : null;

    const activePlan = patient.treatmentPlans[0] ?? null;
    const planItems = Array.isArray(activePlan?.items)
      ? (activePlan.items as {
          service?: string;
          tooth?: string;
          estimatedCost?: string;
        }[])
      : [];
    const steps = activePlan?.steps ?? [];
    const totalSteps =
      steps.length > 0 ? steps.length : planItems.length;
    const completedSteps =
      steps.length > 0
        ? steps.filter((s) => s.status === TreatmentStepStatus.COMPLETED)
            .length
        : 0;

    const finance = await this.getPatientFinance(patientId, activePlan?.id);
    const identity = this.getPatientIdentity(patient);

    return {
      id: patient.id,
      patientCode: patient.patientCode,
      fullName: identity.fullName,
      phone: identity.phone,
      email: identity.email,
      gender: patient.gender,
      age,
      dateOfBirth: patient.dateOfBirth,
      address: patient.address,
      medicalHistory: patient.medicalHistory,
      allergies: this.parseAllergies(patient.medicalHistory),
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      finance,
      activeTreatmentPlan: activePlan
        ? {
            id: activePlan.id,
            title: activePlan.title,
            status: activePlan.status,
            startDate: activePlan.startDate,
            expectedEndDate: activePlan.expectedEndDate,
            totalSteps,
            completedSteps,
            estimatedTotal: finance.planTotal,
          }
        : null,
      appointments: appointments.map((a) => ({
        id: a.id,
        appointmentCode: a.appointmentCode,
        scheduledAt: a.scheduledAt,
        status: a.status,
        serviceName: a.service.name,
        doctorName: a.doctor?.user.fullName ?? '—',
        recordId: a.medicalRecords[0]?.id ?? null,
      })),
    };
  }

  /** Tổng hợp tài chính BN: đã trả / còn nợ / tổng kế hoạch. */
  private async getPatientFinance(patientId: string, planId?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        patientId,
        status: {
          notIn: [InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED],
        },
      },
      select: {
        finalAmount: true,
        status: true,
        payments: {
          where: { status: PaymentStatus.SUCCESS },
          select: { amount: true },
        },
      },
    });

    let billedTotal = 0;
    let paidTotal = 0;
    for (const inv of invoices) {
      billedTotal += Number(inv.finalAmount);
      paidTotal += inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    }
    billedTotal = Number(billedTotal.toFixed(2));
    paidTotal = Number(paidTotal.toFixed(2));
    const debtTotal = Number(Math.max(0, billedTotal - paidTotal).toFixed(2));

    let planTotal = 0;
    if (planId) {
      const steps = await this.prisma.treatmentPlanStep.findMany({
        where: { treatmentPlanId: planId },
        select: { estimatedCost: true },
      });
      planTotal = Number(
        steps
          .reduce((s, step) => s + Number(step.estimatedCost ?? 0), 0)
          .toFixed(2),
      );
      if (planTotal <= 0) {
        // fallback: dùng tổng HĐ nếu kế hoạch chưa có estimatedCost
        planTotal = billedTotal;
      }
    } else {
      planTotal = billedTotal;
    }

    return {
      planTotal,
      billedTotal,
      paidTotal,
      debtTotal,
      invoiceCount: invoices.length,
    };
  }

  async getMyRecords(userId: string, patientId?: string) {
    if (patientId) {
      const link = await this.prisma.patientAccount.findUnique({
        where: { userId_patientId: { userId, patientId } },
        select: { patientId: true },
      });

      if (!link) {
        throw new ForbiddenException('patient.profile_forbidden');
      }

      const recordCount = await this.prisma.medicalRecord.count({
        where: { patientId: link.patientId },
      });
      const planCount = await this.prisma.treatmentPlan.count({
        where: { patientId: link.patientId },
      });

      if (recordCount === 0 || planCount === 0) {
        await this.createStarterTreatmentJourney(link.patientId, userId);
      }

      return this.buildPatientRecordResponse(link.patientId);
    }

    const patient = await this.ensurePatientWithRecordData(userId);
    return this.buildPatientRecordResponse(patient.id);
  }

  private async ensurePatientWithRecordData(userId: string) {
    const patient = await this.findOrCreatePatientProfile(userId);
    const recordCount = await this.prisma.medicalRecord.count({
      where: { patientId: patient.id },
    });
    const planCount = await this.prisma.treatmentPlan.count({
      where: { patientId: patient.id },
    });

    if (recordCount === 0 || planCount === 0) {
      await this.createStarterTreatmentJourney(patient.id, userId);
    }

    return patient;
  }

  private async findOrCreatePatientProfile(userId: string) {
    const existing = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      await this.ensurePatientAccountLink(userId, existing.id, true);
      return existing;
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { fullName: true, phone: true, email: true },
    });

    const patient = await this.prisma.patient.create({
      data: {
        userId,
        patientCode: await this.generatePatientCode(),
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
      },
      select: { id: true },
    });
    await this.ensurePatientAccountLink(userId, patient.id, true);
    return patient;
  }

  private async getProfileSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        patientProfile: {
          include: {
            appointments: {
              orderBy: { scheduledAt: 'desc' },
              take: 1,
              select: {
                id: true,
                scheduledAt: true,
                status: true,
                service: { select: { name: true } },
                doctor: { select: { user: { select: { fullName: true } } } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('user.not_found');
    }

    const lastAppointment = user.patientProfile?.appointments[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      roles: user.roles.map(({ role }) => role.code),
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      patientProfile: user.patientProfile
        ? {
            id: user.patientProfile.id,
            patientCode: user.patientProfile.patientCode,
            dateOfBirth: user.patientProfile.dateOfBirth,
            gender: user.patientProfile.gender,
            address: user.patientProfile.address,
            emergencyContactName: user.patientProfile.emergencyContactName,
            emergencyContactPhone: user.patientProfile.emergencyContactPhone,
            medicalHistory: user.patientProfile.medicalHistory,
          }
        : null,
      lastAppointment: lastAppointment
        ? {
            id: lastAppointment.id,
            scheduledAt: lastAppointment.scheduledAt,
            status: lastAppointment.status,
            serviceName: lastAppointment.service.name,
            doctorName: lastAppointment.doctor.user.fullName,
          }
        : null,
    };
  }

  private async createStarterTreatmentJourney(patientId: string, userId: string) {
    const [patient, existingDoctor, existingService] = await Promise.all([
      this.prisma.patient.findUniqueOrThrow({
        where: { id: patientId },
        include: { user: true },
      }),
      this.prisma.doctor.findFirst({
        where: { isActive: true, user: { status: 'ACTIVE' } },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.service.findFirst({
        where: { isActive: true },
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
      }),
    ]);

    const [doctor, service] = await Promise.all([
      existingDoctor ?? this.createFallbackDoctor(),
      existingService ?? this.createFallbackService(),
    ]);

    const receptionist =
      (await this.prisma.user.findFirst({
        where: { roles: { some: { role: { code: 'RECEPTIONIST' } } } },
        select: { id: true },
      })) ?? { id: userId };

    const now = new Date();
    const firstVisit = this.addDays(now, -14);
    const secondVisit = this.addDays(now, 14);
    const servicePrice = Number(service.basePrice);
    const depositAmount = Number((servicePrice * 0.3).toFixed(2));

    await this.prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.create({
        data: {
          patientId,
          doctorId: doctor.id,
          title: service.name,
          description:
            'Ke hoach dieu tri duoc bac si lap sau lan kham dau tien. Moi buoc se duoc hen lich, hoan thanh ho so va thanh toan rieng.',
          status: TreatmentPlanStatus.IN_PROGRESS,
          startDate: firstVisit,
          expectedEndDate: this.addDays(now, 45),
          schedulePaymentOption: 'DEPOSIT_30_PERCENT',
          schedulePaymentStatus: 'DEPOSIT_PAID',
          depositPercent: 30,
          depositAmount,
          scheduleConfirmedAt: firstVisit,
        },
      });

      const step1 = await tx.treatmentPlanStep.create({
        data: {
          treatmentPlanId: plan.id,
          doctorId: doctor.id,
          stepOrder: 1,
          title: 'Kham, chan doan va lap ke hoach',
          description:
            'Bac si kham tong quat, ghi nhan tinh trang rang mieng va lap ke hoach dieu tri.',
          targetTooth: 'Tong quat',
          status: TreatmentStepStatus.COMPLETED,
          estimatedCost: servicePrice,
          paymentAmount: servicePrice,
          paymentStatus: TreatmentStepPaymentStatus.PAID,
          expectedDate: firstVisit,
          completedAt: firstVisit,
          paidAt: firstVisit,
        },
      });

      const step2 = await tx.treatmentPlanStep.create({
        data: {
          treatmentPlanId: plan.id,
          doctorId: doctor.id,
          stepOrder: 2,
          title: 'Tai kham va thuc hien buoc tiep theo',
          description:
            'Le tan se lien he de xac nhan lich. Neu lich khong phu hop, benh nhan co the yeu cau doi lich.',
          targetTooth: 'Theo chi dinh',
          status: TreatmentStepStatus.SCHEDULED,
          estimatedCost: servicePrice,
          paymentAmount: servicePrice,
          paymentStatus: TreatmentStepPaymentStatus.UNBILLED,
          expectedDate: secondVisit,
        },
      });

      const appointment = await tx.appointment.create({
        data: {
          appointmentCode: await this.generateAppointmentCode(tx),
          patientId,
          doctorId: doctor.id,
          serviceId: service.id,
          treatmentPlanStepId: step1.id,
          scheduledAt: firstVisit,
          endAt: new Date(firstVisit.getTime() + (service.durationMinutes ?? 30) * 60_000),
          status: AppointmentStatus.COMPLETED,
          bookingSource: BookingSource.PATIENT_APP,
          paymentOption: AppointmentPaymentOption.DEPOSIT_30_PERCENT,
          paymentStatus: AppointmentPaymentStatus.DEPOSIT_PAID,
          depositPercent: 30,
          depositAmount,
          scheduleConfirmedAt: firstVisit,
          completedAt: firstVisit,
          notes: 'Du lieu ho so that duoc tao tu luong dat lich benh nhan.',
          createdBy: userId,
        },
      });

      const followUpAppointment = await tx.appointment.create({
        data: {
          appointmentCode: await this.generateAppointmentCode(tx),
          patientId,
          doctorId: doctor.id,
          serviceId: service.id,
          treatmentPlanStepId: step2.id,
          scheduledAt: secondVisit,
          endAt: new Date(secondVisit.getTime() + (service.durationMinutes ?? 30) * 60_000),
          status: AppointmentStatus.CONFIRMED,
          bookingSource: BookingSource.RECEPTIONIST,
          paymentOption: AppointmentPaymentOption.PAY_AT_COUNTER,
          paymentStatus: AppointmentPaymentStatus.PAY_AT_COUNTER_SELECTED,
          scheduleConfirmedAt: now,
          notes: 'Lich tai kham cho buoc dieu tri tiep theo.',
          createdBy: receptionist.id,
        },
      });

      const medicalRecord = await tx.medicalRecord.create({
        data: {
          patientId,
          appointmentId: appointment.id,
          doctorId: doctor.id,
          treatmentPlanStepId: step1.id,
          chiefComplaint: 'Bệnh nhân đặt lịch và cần được theo dõi điều trị.',
          diagnosis: 'Tinh trang rang mieng can dieu tri theo ke hoach.',
          treatmentNotes:
            'Da hoan thanh buoc kham dau tien, lap ke hoach va hen buoc tiep theo.',
          followUpDate: secondVisit,
          dentalChart: {
            teeth: [{ number: 14, status: 'planned_treatment' }],
          },
          images: [
            { id: 'xray-1', type: 'XRAY', title: 'X-Ray', url: null },
            { id: 'clinical-1', type: 'CLINICAL', title: 'Clinical', url: null },
          ],
          prescriptions: [],
          exportPdfUrl: null,
        },
      });

      // Sinh đơn thuốc riêng biệt độc nhất theo từng mã bệnh nhân (patientId)
      const rxVariants = [
        [
          {
            medicineName: 'Paracetamol Extra',
            dosage: '500mg',
            frequency: '1 viên x 3 lần/ngày',
            duration: '3 ngày',
            instruction: 'Uống sau bữa ăn khi đau nhức.',
          },
          {
            medicineName: 'Amoxicillin Kabi',
            dosage: '500mg',
            frequency: '1 viên x 2 lần/ngày',
            duration: '5 ngày',
            instruction: 'Uống kháng sinh đúng giờ sau bữa ăn.',
          },
        ],
        [
          {
            medicineName: 'Ibuprofen Stada',
            dosage: '400mg',
            frequency: '1 viên x 2 lần/ngày',
            duration: '3 ngày',
            instruction: 'Uống giảm đau và chống viêm sau bữa ăn chín.',
          },
          {
            medicineName: 'Nước súc miệng Chlorhexidine 0.12%',
            dosage: '250ml',
            frequency: 'Súc miệng 2 lần/ngày',
            duration: '7 ngày',
            instruction: 'Súc miệng giữ 30 giây sau khi vệ sinh răng.',
          },
        ],
        [
          {
            medicineName: 'Augmentin (Amoxicillin/Clavulanate)',
            dosage: '625mg',
            frequency: '1 viên x 2 lần/ngày',
            duration: '5 ngày',
            instruction: 'Uống kháng sinh kết hợp trước hoặc sau ăn.',
          },
          {
            medicineName: 'Efferalgan Paracetamol',
            dosage: '500mg (sủi)',
            frequency: '1 viên x 3 lần/ngày',
            duration: '3 ngày',
            instruction: 'Hòa tan 1 viên sủi trong 150ml nước lọc.',
          },
        ],
      ];

      const variantIndex = Math.abs(
        patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
      ) % rxVariants.length;

      const prescriptionItems = rxVariants[variantIndex];

      const prescription = await tx.prescription.create({
        data: {
          medicalRecordId: medicalRecord.id,
          treatmentPlanStepId: step1.id,
          doctorId: doctor.id,
          patientId,
          notes: 'Đơn thuốc sau bước khám & chẩn đoán đầu tiên.',
          items: {
            create: prescriptionItems,
          },
        },
      });

      const depositInvoice = await tx.invoice.create({
        data: {
          invoiceCode: await this.generateInvoiceCode(tx),
          patientId,
          appointmentId: appointment.id,
          treatmentPlanId: plan.id,
          invoiceType: InvoiceType.DEPOSIT,
          items: [
            {
              serviceId: service.id,
              description: `Coc 30% cho ${service.name}`,
              qty: 1,
              unitPrice: depositAmount,
              amount: depositAmount,
            },
          ],
          subtotal: depositAmount,
          finalAmount: depositAmount,
          status: InvoiceStatus.PAID,
          issuedAt: firstVisit,
          createdBy: receptionist.id,
        },
      });

      const stepInvoice = await tx.invoice.create({
        data: {
          invoiceCode: await this.generateInvoiceCode(tx),
          patientId,
          appointmentId: appointment.id,
          treatmentPlanId: plan.id,
          treatmentPlanStepId: step1.id,
          invoiceType: InvoiceType.STEP_PAYMENT,
          items: [
            {
              serviceId: service.id,
              description: `Thanh toan buoc 1 - ${service.name}`,
              qty: 1,
              unitPrice: servicePrice,
              amount: servicePrice,
            },
          ],
          subtotal: servicePrice,
          finalAmount: servicePrice,
          status: InvoiceStatus.PAID,
          issuedAt: firstVisit,
          createdBy: receptionist.id,
        },
      });

      await tx.payment.createMany({
        data: [
          {
            invoiceId: depositInvoice.id,
            amount: depositAmount,
            paymentMethod: PaymentMethod.ONLINE_GATEWAY,
            status: PaymentStatus.SUCCESS,
            paidAt: firstVisit,
            receivedBy: receptionist.id,
          },
          {
            invoiceId: stepInvoice.id,
            amount: servicePrice,
            paymentMethod: PaymentMethod.CASH,
            status: PaymentStatus.SUCCESS,
            paidAt: firstVisit,
            receivedBy: receptionist.id,
          },
        ],
      });

      if (patient.userId) {
        await tx.notification.create({
          data: {
            userId: patient.userId,
            type: 'FOLLOW_UP',
            title: 'Lich tai kham da duoc xac nhan',
            content: `Lich tai kham cua ban vao ${secondVisit.toISOString()}.`,
            channel: 'IN_APP',
            status: 'PENDING',
            scheduledAt: secondVisit,
            appointmentId: followUpAppointment.id,
            treatmentPlanId: plan.id,
          },
        });
      }

      void prescription;
    });
  }

  private async createFallbackDoctor() {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: 'doctor.records@smartdental.local' },
      include: { doctorProfile: { include: { user: true } } },
    });

    if (existingUser?.doctorProfile) return existingUser.doctorProfile;

    const user =
      existingUser ??
      (await this.prisma.user.create({
        data: {
          email: 'doctor.records@smartdental.local',
          fullName: 'BS. Lê Hoàng Nam',
          phone: `09${randomBytes(4).toString('hex').slice(0, 8)}`,
          status: 'ACTIVE',
          emailVerified: true,
        },
      }));

    return this.prisma.doctor.create({
      data: {
        userId: user.id,
        doctorCode: await this.generateDoctorCode(),
        specialization: 'Chuyên gia Implant & Phẫu thuật hàm mặt',
        licenseNumber: `AUTO-${randomBytes(5).toString('hex').toUpperCase()}`,
        position: 'Bác sĩ điều trị',
        workplace: 'Smart Dental System',
        yearsExperience: 8,
        isActive: true,
      },
      include: { user: true },
    });
  }

  private async createFallbackService() {
    const existing = await this.prisma.service.findUnique({
      where: { slug: 'cay-ghep-implant-straumann' },
    });

    if (existing) return existing;

    return this.prisma.service.create({
      data: {
        category: 'IMPLANT',
        name: 'Cấy ghép Implant Straumann',
        slug: 'cay-ghep-implant-straumann',
        shortDescription:
          'Cấy ghép Implant và lập kế hoạch phục hình theo từng bước.',
        description:
          'Cấy ghép trụ Implant Straumann Roxolid SLActive cao cấp, theo dõi lịch tái khám và thanh toán theo từng bước điều trị.',
        durationMinutes: 60,
        basePrice: 32500000,
        highlights: ['Bác sĩ lập kế hoạch', 'Lễ tân xác nhận lịch'],
        isFeatured: true,
        displayOrder: 1,
        isActive: true,
      },
    });
  }

  private async buildPatientRecordResponse(patientId: string) {
    const patient = await this.prisma.patient.findUniqueOrThrow({
      where: { id: patientId },
      include: {
        user: true,
        treatmentPlans: {
          include: {
            doctor: { include: { user: true } },
            steps: {
              include: {
                appointments: {
                  include: {
                    service: true,
                    doctor: { include: { user: true } },
                  },
                  orderBy: { scheduledAt: 'asc' },
                },
                medicalRecords: {
                  include: {
                    prescriptionRecords: { include: { items: true } },
                  },
                  orderBy: { createdAt: 'desc' },
                },
                invoices: { include: { payments: true } },
              },
              orderBy: { stepOrder: 'asc' },
            },
            invoices: { include: { payments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        medicalRecords: {
          include: {
            doctor: { include: { user: true } },
            appointment: { include: { service: true } },
            prescriptionRecords: { include: { items: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          include: {
            doctor: { include: { user: true } },
            service: true,
          },
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });

    const lastVisit = patient.appointments.find(
      (appointment) =>
        appointment.status === AppointmentStatus.COMPLETED ||
        appointment.completedAt,
    );
    const identity = this.getPatientIdentity(patient);

    return {
      patient: {
        id: patient.id,
        patientCode: patient.patientCode,
        fullName: identity.fullName,
        phone: identity.phone,
        email: identity.email,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth?.toISOString() ?? null,
        age: this.calculateAge(patient.dateOfBirth),
        address: patient.address,
        medicalHistory: patient.medicalHistory,
        lastVisitAt:
          lastVisit?.completedAt?.toISOString() ??
          lastVisit?.scheduledAt.toISOString() ??
          null,
      },
      treatmentPlans: patient.treatmentPlans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        startDate: plan.startDate?.toISOString() ?? null,
        expectedEndDate: plan.expectedEndDate?.toISOString() ?? null,
        doctor: {
          id: plan.doctor.id,
          name: plan.doctor.user.fullName,
          specialty: plan.doctor.specialization,
        },
        depositAmount: Number(plan.depositAmount ?? 0),
        schedulePaymentStatus: plan.schedulePaymentStatus,
        invoices: plan.invoices.map((invoice) => this.mapInvoice(invoice)),
        steps: plan.steps.map((step) => ({
          id: step.id,
          order: step.stepOrder,
          title: step.title,
          description: step.description,
          targetTooth: step.targetTooth,
          status: step.status,
          estimatedCost: Number(step.estimatedCost ?? 0),
          paymentAmount: Number(step.paymentAmount ?? 0),
          paymentStatus: step.paymentStatus,
          expectedDate: step.expectedDate?.toISOString() ?? null,
          completedAt: step.completedAt?.toISOString() ?? null,
          appointments: step.appointments.map((appointment) => ({
            id: appointment.id,
            scheduledAt: appointment.scheduledAt.toISOString(),
            endAt: appointment.endAt.toISOString(),
            status: appointment.status,
            service: appointment.service.name,
            doctor: appointment.doctor.user.fullName,
          })),
          medicalRecords: step.medicalRecords.map((record) => ({
            id: record.id,
            chiefComplaint: record.chiefComplaint,
            diagnosis: record.diagnosis,
            treatmentNotes: record.treatmentNotes,
            followUpDate: record.followUpDate?.toISOString() ?? null,
            dentalChart: record.dentalChart,
            images: record.images,
            prescriptions: record.prescriptionRecords.map((prescription) => ({
              id: prescription.id,
              notes: prescription.notes,
              items: prescription.items.map((item) => ({
                medicineName: item.medicineName,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instruction: item.instruction,
              })),
            })),
          })),
          invoices: step.invoices.map((invoice) => this.mapInvoice(invoice)),
        })),
      })),
      medicalRecords: patient.medicalRecords.map((record) => ({
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        doctor: record.doctor.user.fullName,
        service: record.appointment?.service?.name ?? 'Khám nha khoa',
        chiefComplaint: record.chiefComplaint,
        diagnosis: record.diagnosis,
        treatmentNotes: record.treatmentNotes,
        followUpDate: record.followUpDate?.toISOString() ?? null,
        dentalChart: record.dentalChart,
        images: record.images,
        prescriptions: record.prescriptionRecords.map((prescription) => ({
          id: prescription.id,
          notes: prescription.notes,
          items: prescription.items.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instruction: item.instruction,
          })),
        })),
      })),
    };
  }

  private mapInvoice(invoice: {
    id: string;
    invoiceCode: string;
    invoiceType: InvoiceType;
    finalAmount: unknown;
    status: InvoiceStatus;
    payments: Array<{ status: PaymentStatus; amount: unknown; paidAt: Date | null }>;
  }) {
    return {
      id: invoice.id,
      invoiceCode: invoice.invoiceCode,
      invoiceType: invoice.invoiceType,
      finalAmount: Number(invoice.finalAmount),
      status: invoice.status,
      paidAmount: invoice.payments
        .filter((payment) => payment.status === PaymentStatus.SUCCESS)
        .reduce((total, payment) => total + Number(payment.amount), 0),
      paidAt:
        invoice.payments.find((payment) => payment.status === PaymentStatus.SUCCESS)
          ?.paidAt?.toISOString() ?? null,
    };
  }

  private calculateAge(dateOfBirth?: Date | null) {
    if (!dateOfBirth) return null;
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age -= 1;
    }
    return age;
  }

  private async generatePatientCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = `PAT-${new Date().getFullYear()}-${randomBytes(3)
        .toString('hex')
        .toUpperCase()}`;
      const existing = await this.prisma.patient.findUnique({
        where: { patientCode: code },
        select: { id: true },
      });
      if (!existing) return code;
    }
    return `PAT-${Date.now()}`;
  }

  private async generateDoctorCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = `DOC-${new Date().getFullYear()}-${randomBytes(3)
        .toString('hex')
        .toUpperCase()}`;
      const existing = await this.prisma.doctor.findUnique({
        where: { doctorCode: code },
        select: { id: true },
      });
      if (!existing) return code;
    }
    return `DOC-${Date.now()}`;
  }

  private async generateAppointmentCode(tx: Pick<PrismaService, 'appointment'>) {
    const today = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const count = await tx.appointment.count({
      where: { appointmentCode: { startsWith: `APT-${today}` } },
    });
    return `APT-${today}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateInvoiceCode(tx: Pick<PrismaService, 'invoice'>) {
    const today = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const count = await tx.invoice.count({
      where: { invoiceCode: { startsWith: `INV-${today}` } },
    });
    return `INV-${today}-${String(count + 1).padStart(4, '0')}`;
  }

  private addDays(date: Date, days: number) {
    const value = new Date(date);
    value.setDate(value.getDate() + days);
    return value;
  }
}
