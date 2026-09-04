import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
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
import { RedisService } from '../redis/redis.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreateManagedPatientDto } from './dto/create-managed-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue('mail-queue')
    private readonly mailQueue: Queue,
  ) { }

  async invalidatePatientCache(patientId?: string, userId?: string) {
    try {
      if (patientId) {
        await this.redis.del(`patient:records:${patientId}`);
      }
      if (userId) {
        await this.redis.del(`patient:profiles:${userId}`);
        await this.redis.del(`patient:appointments:upcoming:${userId}`);
        await this.redis.del(`patient:appointments:history:${userId}`);
      }
    } catch (err: any) {
      // ignore
    }
  }

  async getManagedPatientProfiles(userId: string) {
    const cacheKey = `patient:profiles:${userId}`;
    return this.redis.rememberJson(cacheKey, 60, async () => {
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

    const duplicateConditions: any[] = [];
    if (phone) {
      duplicateConditions.push({ phone });
    }
    if (email) {
      duplicateConditions.push({ email });
    }
    if (fullName && dateOfBirth) {
      duplicateConditions.push({
        fullName: { equals: fullName, mode: 'insensitive' },
        dateOfBirth,
      });
    } else if (fullName && !phone && !email) {
      duplicateConditions.push({
        fullName: { equals: fullName, mode: 'insensitive' },
        dateOfBirth: null,
      });
    }

    const duplicate = await this.prisma.patient.findFirst({
      where: {
        patientAccounts: { some: { userId } },
        OR: duplicateConditions,
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
    void this.invalidatePatientCache(patient.id, userId);

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

    const [userPhone, userEmail, patientPhone, patientEmail] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { phone }, select: { id: true } }),
        this.prisma.user.findUnique({ where: { email }, select: { id: true } }),
        this.prisma.patient.findFirst({ where: { phone }, select: { id: true } }),
        this.prisma.patient.findFirst({ where: { email }, select: { id: true } }),
      ]);

    if (userPhone || patientPhone) {
      throw new ConflictException('auth.phone_exists');
    }
    if (userEmail || patientEmail) {
      throw new ConflictException('auth.email_exists');
    }

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

    // 1. Tự động gửi Email Chào mừng thành viên mới & Cấp mã hồ sơ y tế
    if (user.email && !user.email.endsWith('@clinic.local')) {
      try {
        await this.mailQueue.add('send-patient-welcome', {
          name: user.fullName,
          email: user.email,
          patientCode: patient.patientCode,
          phone: user.phone,
        });
      } catch {
        // non-blocking
      }
    }

    // 2. Gửi thông báo In-App
    try {
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: '🎉 Chào mừng bạn đến với Nha khoa Smart Dental!',
          content: `Mã hồ sơ bệnh nhân kỹ thuật số của bạn là ${patient.patientCode}. Bạn có thể theo dõi lịch khám, bệnh án và đơn thuốc tại đây.`,
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch {
      // non-blocking
    }

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

  /** Gửi lại thư chào mừng & mã hồ sơ cho bệnh nhân */
  async sendWelcomeEmailToPatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });
    if (!patient) throw new NotFoundException('Không tìm thấy thông tin bệnh nhân');

    const email = patient.user?.email || patient.email;
    const name = patient.user?.fullName || patient.fullName;
    const phone = patient.user?.phone || patient.phone;

    if (!email || email.endsWith('@clinic.local')) {
      throw new BadRequestException('Bệnh nhân chưa đăng ký địa chỉ email hợp lệ');
    }

    await this.mailQueue.add('send-patient-welcome', {
      name,
      email,
      patientCode: patient.patientCode,
      phone,
    });

    if (patient.user?.id) {
      await this.prisma.notification.create({
        data: {
          userId: patient.user.id,
          type: 'SYSTEM',
          title: '🎉 Chào mừng bạn đến với Nha khoa Smart Dental!',
          content: `Mã hồ sơ bệnh nhân kỹ thuật số của bạn là ${patient.patientCode}.`,
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    return { success: true, message: `Đã gửi thư chào mừng đến ${email}` };
  }

  /** Gửi thông báo nhắc tái khám & chăm sóc răng định kỳ 6 tháng */
  async sendPeriodicCheckupReminder(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
          select: { scheduledAt: true },
        },
      },
    });
    if (!patient) throw new NotFoundException('Không tìm thấy thông tin bệnh nhân');

    const email = patient.user?.email || patient.email;
    const name = patient.user?.fullName || patient.fullName;
    const lastVisitDate = patient.appointments[0]?.scheduledAt
      ? patient.appointments[0].scheduledAt.toISOString()
      : undefined;

    if (!email || email.endsWith('@clinic.local')) {
      throw new BadRequestException('Bệnh nhân chưa đăng ký địa chỉ email hợp lệ để gửi thông báo');
    }

    await this.mailQueue.add('send-periodic-checkup-reminder', {
      name,
      email,
      patientCode: patient.patientCode,
      lastVisitDate,
    });

    if (patient.user?.id) {
      await this.prisma.notification.create({
        data: {
          userId: patient.user.id,
          type: 'SYSTEM',
          title: '🦷 Nhắc lịch chăm sóc răng & cạo vôi định kỳ 6 tháng',
          content: `Đã đến thời gian kiểm tra răng và cạo vôi định kỳ. Hãy đặt lịch hẹn để bảo vệ nụ cười khỏe đẹp nhé!`,
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    return { success: true, message: `Đã gửi lời nhắc tái khám định kỳ đến ${email}` };
  }

  /** Gửi hàng loạt thông báo nhắc tái khám cho tất cả bệnh nhân đến hạn */
  async sendBulkPeriodicCheckupReminders() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Deduplicate: Lấy danh sách user IDs đã nhận thông báo nhắc tái khám trong 30 ngày qua
    const recentNotifiedUserIds = new Set(
      (
        await this.prisma.notification.findMany({
          where: {
            type: 'SYSTEM',
            title: { contains: 'định kỳ' },
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { userId: true },
        })
      ).map((n) => n.userId),
    );

    // 2. DB-level filtering: Chỉ lọc bệnh nhân không có lịch hẹn nào trong 6 tháng qua
    const eligiblePatients = await this.prisma.patient.findMany({
      where: {
        appointments: {
          none: {
            scheduledAt: { gte: sixMonthsAgo },
          },
        },
        OR: [
          { email: { not: null } },
          { user: { isNot: null } },
        ],
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
          select: { scheduledAt: true },
        },
      },
    });

    let sentCount = 0;
    const notificationsToCreate: Array<{
      userId: string;
      type: 'SYSTEM';
      title: string;
      content: string;
      channel: 'IN_APP';
      status: 'SENT';
      sentAt: Date;
    }> = [];
    const mailJobs: Array<Promise<any>> = [];

    for (const patient of eligiblePatients) {
      const email = patient.user?.email || patient.email;
      if (!email || email.endsWith('@clinic.local')) continue;

      // Nếu có userId và đã nhận thông báo trong 30 ngày qua thì skip để tránh spam
      if (patient.user?.id && recentNotifiedUserIds.has(patient.user.id)) {
        continue;
      }

      const name = patient.user?.fullName || patient.fullName;
      const lastVisit = patient.appointments[0]?.scheduledAt;

      mailJobs.push(
        this.mailQueue.add('send-periodic-checkup-reminder', {
          name,
          email,
          patientCode: patient.patientCode,
          lastVisitDate: lastVisit?.toISOString(),
        }),
      );

      if (patient.user?.id) {
        recentNotifiedUserIds.add(patient.user.id);
        notificationsToCreate.push({
          userId: patient.user.id,
          type: 'SYSTEM',
          title: '🦷 Nhắc lịch chăm sóc răng & cạo vôi định kỳ 6 tháng',
          content: `Đã đến thời gian kiểm tra răng và cạo vôi định kỳ. Hãy đặt lịch hẹn để bảo vệ nụ cười khỏe đẹp nhé!`,
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: new Date(),
        });
      }

      sentCount++;
    }

    if (notificationsToCreate.length > 0) {
      await this.prisma.notification.createMany({
        data: notificationsToCreate,
      });
    }

    await Promise.all(mailJobs);

    return {
      success: true,
      sentCount,
      message: `Đã gửi lời nhắc tái khám định kỳ đến ${sentCount} bệnh nhân`,
    };
  }

  async updatePatient(patientId: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, userId: true, medicalHistory: true, phone: true, email: true },
    });
    if (!patient) throw new BadRequestException('patient.not_found');

    const newPhone = dto.phone !== undefined ? dto.phone?.trim() || null : undefined;
    const newEmail = dto.email !== undefined ? dto.email?.trim().toLowerCase() || null : undefined;

    if (newPhone) {
      const [existingUserPhone, existingPatientPhone] = await Promise.all([
        this.prisma.user.findFirst({
          where: { phone: newPhone, ...(patient.userId ? { id: { not: patient.userId } } : {}) },
          select: { id: true },
        }),
        this.prisma.patient.findFirst({
          where: { phone: newPhone, id: { not: patientId } },
          select: { id: true },
        }),
      ]);
      if (existingUserPhone || existingPatientPhone) {
        throw new ConflictException('auth.phone_exists');
      }
    }

    if (newEmail) {
      const [existingUserEmail, existingPatientEmail] = await Promise.all([
        this.prisma.user.findFirst({
          where: { email: newEmail, ...(patient.userId ? { id: { not: patient.userId } } : {}) },
          select: { id: true },
        }),
        this.prisma.patient.findFirst({
          where: { email: newEmail, id: { not: patientId } },
          select: { id: true },
        }),
      ]);
      if (existingUserEmail || existingPatientEmail) {
        throw new ConflictException('auth.email_exists');
      }
    }

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

    await this.prisma.$transaction(async (tx) => {
      if (patient.userId) {
        await tx.user.update({
          where: { id: patient.userId },
          data: {
            ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
            ...(newPhone !== undefined ? { phone: newPhone ?? undefined } : {}),
            ...(newEmail !== undefined ? { email: newEmail ?? undefined } : {}),
          },
        });
      }

      await tx.patient.update({
        where: { id: patientId },
        data: {
          ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
          ...(newPhone !== undefined ? { phone: newPhone } : {}),
          ...(newEmail !== undefined ? { email: newEmail } : {}),
          ...(dto.address !== undefined
            ? { address: dto.address?.trim() || null }
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
                dto.emergencyContactName?.trim() || null,
            }
            : {}),
          ...(dto.emergencyContactPhone !== undefined
            ? {
              emergencyContactPhone:
                dto.emergencyContactPhone?.trim() || null,
            }
            : {}),
        },
      });
    });

    return this.findPatientDetail(patientId);
  }

  async updateMyProfile(userId: string, dto: UpdatePatientDto) {
    const patient = await this.findOrCreatePatientProfile(userId);
    const newPhone =
      dto.phone !== undefined
        ? (this.cleanText(dto.phone) ?? null)
        : undefined;
    const newEmail =
      dto.email !== undefined
        ? (this.cleanText(dto.email)?.toLowerCase() ?? null)
        : undefined;

    if (newPhone) {
      const [existingUserPhone, existingPatientPhone] = await Promise.all([
        this.prisma.user.findFirst({
          where: { phone: newPhone, id: { not: userId } },
          select: { id: true },
        }),
        this.prisma.patient.findFirst({
          where: { phone: newPhone, id: { not: patient.id } },
          select: { id: true },
        }),
      ]);
      if (existingUserPhone || existingPatientPhone) {
        throw new ConflictException('auth.phone_exists');
      }
    }

    if (newEmail) {
      const [existingUserEmail, existingPatientEmail] = await Promise.all([
        this.prisma.user.findFirst({
          where: { email: newEmail, id: { not: userId } },
          select: { id: true },
        }),
        this.prisma.patient.findFirst({
          where: { email: newEmail, id: { not: patient.id } },
          select: { id: true },
        }),
      ]);
      if (existingUserEmail || existingPatientEmail) {
        throw new ConflictException('auth.email_exists');
      }
    }

    const currentPatient = await this.prisma.patient.findUnique({
      where: { id: patient.id },
      select: { medicalHistory: true },
    });

    const allergies =
      dto.allergies !== undefined
        ? dto.allergies.map((s) => s.trim()).filter(Boolean)
        : this.parseAllergies(currentPatient?.medicalHistory);
    const historyOnly =
      dto.medicalHistory !== undefined
        ? this.stripAllergyLine(dto.medicalHistory)
        : this.stripAllergyLine(currentPatient?.medicalHistory);
    const medicalHistory =
      this.mergeMedicalHistory(historyOnly || undefined, allergies) ?? null;

    const fullName = this.cleanText(dto.fullName);
    const address = this.cleanText(dto.address);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(newPhone !== undefined ? { phone: newPhone } : {}),
          ...(newEmail ? { email: newEmail } : {}),
        },
      });

      await tx.patient.update({
        where: { id: patient.id },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(newPhone !== undefined ? { phone: newPhone } : {}),
          ...(newEmail !== undefined ? { email: newEmail } : {}),
          ...(dto.address !== undefined ? { address: address || null } : {}),
          medicalHistory,
          ...(dto.dateOfBirth !== undefined
            ? {
              dateOfBirth: dto.dateOfBirth
                ? new Date(dto.dateOfBirth)
                : null,
            }
            : {}),
          ...(dto.gender ? { gender: dto.gender } : {}),
        },
      });
    });

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

      return this.getCachedPatientRecordResponse(link.patientId);
    }

    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patient) {
      return {
        patient: null,
        activePlan: null,
        treatmentPlans: [],
        medicalRecords: [],
        timeline: [],
      };
    }

    return this.getCachedPatientRecordResponse(patient.id);
  }

  async getCachedPatientRecordResponse(patientId: string) {
    const cacheKey = `patient:records:${patientId}`;
    return this.redis.rememberJson(cacheKey, 120, () =>
      this.buildPatientRecordResponse(patientId),
    );
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
