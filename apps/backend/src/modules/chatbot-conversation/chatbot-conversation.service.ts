import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../ai/ai-client.service';
import { AppointmentService } from '../appointment/appointment.service';
import { PatientService } from '../patient/patient.service';
import { PrismaService } from '../prisma/prisma.service';
import { PatientChatDto } from './dto/chat.dto';

@Injectable()
export class ChatbotConversationService {
  private readonly logger = new Logger(ChatbotConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClientService: AiClientService,
    private readonly appointmentService: AppointmentService,
    private readonly patientService: PatientService,
  ) {}

  async handlePatientChat(user: any | null, dto: PatientChatDto) {
    const payload = await this.buildAgentPayload(user, dto, true);

    try {
      return await this.aiClientService.post<any>(
        '/api/v1/chatbot/agent-chat',
        payload,
      );
    } catch (err: any) {
      this.logger.error(`AI Chat error: ${err.message}`);
      return this.maintenanceReply();
    }
  }

  async handlePatientAgentChat(user: any | null, dto: PatientChatDto) {
    const payload = await this.buildAgentPayload(user, dto, false);

    try {
      return await this.aiClientService.post<any>(
        '/api/v1/chatbot/agent-chat',
        payload,
      );
    } catch (err: any) {
      this.logger.error(`AI Agent Chat error: ${err.message}`);
      return this.maintenanceReply();
    }
  }

  private async buildAgentPayload(
    user: any | null,
    dto: PatientChatDto,
    allowLegacyPatientFallback: boolean,
  ) {
    let patientId = dto.patientId;
    let patientName = dto.patientName;
    let patientPhone = dto.patientPhone;

    if (allowLegacyPatientFallback && user?.userId && !patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { OR: [{ userId: user.userId }, { id: user.userId }] },
      });
      if (patient) {
        patientId = patient.id;
        patientName = patientName || patient.fullName || undefined;
        patientPhone = patientPhone || patient.phone || undefined;
      }
    }

    return {
      created_by_user_id: user?.userId || null,
      patient_id: patientId || null,
      patient_name: patientName || null,
      patient_phone: patientPhone || null,
      message: dto.message,
      metadata: dto.metadata || {},
      history: (dto.history || []).map((h) => ({
        role: h.role,
        content: h.content,
        metadata: h.metadata || {},
      })),
    };
  }

  private maintenanceReply() {
    return {
      reply:
        'Xin loi quy khach, he thong AI dat lich dang bao tri. Quy khach vui long thu lai sau nhe!',
      should_book: true,
      suggestions: [
        {
          type: 'quick_reply',
          label: 'Dat lich kham',
          value: 'Toi muon dat lich kham',
          metadata: {},
        },
      ],
    };
  }

  async getInternalServices() {
    try {
      const now = new Date();
      const activePromotions = await this.prisma.promotion.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });

      const services = await this.prisma.service.findMany({
        where: { isActive: true },
        include: {
          treatmentMethods: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { displayOrder: 'asc' },
      });

      if (services && services.length > 0) {
        return services.map((s) => {
          const servicePromo = activePromotions.find(
            (p) => p.applicableServiceSlug === s.slug,
          );

          const treatmentMethods = (s.treatmentMethods || []).map((tm) => {
            const tmPromo =
              activePromotions.find(
                (p) => p.applicableTreatmentMethodId === tm.id,
              ) || servicePromo;

            const basePrice = Number(tm.basePrice);
            let finalPrice = basePrice;
            let discountInfo: string | null = null;

            if (tmPromo) {
              if (tmPromo.discountType === 'PERCENTAGE') {
                const discount = (basePrice * Number(tmPromo.discountValue)) / 100;
                finalPrice = Math.max(0, basePrice - discount);
                discountInfo = `Giảm ${tmPromo.discountValue}% (Mã: ${tmPromo.code})`;
              } else if (tmPromo.discountType === 'FIXED_AMOUNT') {
                const discount = Number(tmPromo.discountValue);
                finalPrice = Math.max(0, basePrice - discount);
                discountInfo = `Giảm ${discount.toLocaleString('vi-VN')}đ (Mã: ${tmPromo.code})`;
              }
            }

            return {
              id: tm.id,
              name: tm.name,
              description: tm.description,
              basePrice,
              finalPrice,
              promotionCode: tmPromo?.code || null,
              discountInfo,
            };
          });

          const lowestPrice =
            treatmentMethods.length > 0
              ? Math.min(...treatmentMethods.map((m) => m.finalPrice))
              : Number(s.basePrice || 200000);

          return {
            id: s.id,
            name: s.name,
            slug: s.slug,
            description: s.description || s.shortDescription || '',
            price: lowestPrice,
            promotionCode: servicePromo?.code || null,
            discountInfo: servicePromo
              ? servicePromo.discountType === 'PERCENTAGE'
                ? `Giảm ${servicePromo.discountValue}% (Mã: ${servicePromo.code})`
                : `Giảm ${Number(servicePromo.discountValue).toLocaleString('vi-VN')}đ (Mã: ${servicePromo.code})`
              : null,
            treatmentMethods,
          };
        });
      }
    } catch (err: any) {
      this.logger.error(`getInternalServices error: ${err.message}`);
    }

    const options = await this.appointmentService.getBookingOptions({});
    const services = (options.services || []) as any[];

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.treatmentMethods?.[0]?.basePrice
        ? Number(s.treatmentMethods[0].basePrice)
        : 200000,
      treatmentMethods: s.treatmentMethods || [],
    }));
  }

  async getInternalPatients(userId: string) {
    if (!userId) return [];
    try {
      return await this.patientService.getManagedPatientProfiles(userId);
    } catch (err: any) {
      this.logger.error(`getInternalPatients error: ${err.message}`);
      return [];
    }
  }

  async createInternalPatient(
    userId: string,
    dto: {
      fullName: string;
      dateOfBirth?: string;
      gender?: string;
      phone?: string;
      relationship?: string;
    },
  ) {
    if (!userId) throw new BadRequestException('auth.login_required');
    return this.patientService.createManagedPatientProfile(userId, {
      fullName: dto.fullName,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender as any,
      phone: dto.phone,
      relationship: (dto.relationship as any) || 'CHILD',
    });
  }

  async getInternalDoctors() {
    try {
      const doctors = await this.prisma.doctor.findMany({
        where: { isActive: true },
        include: {
          user: { select: { fullName: true } },
          specializations: {
            include: { specialization: { select: { name: true } } },
          },
        },
      });

      if (doctors && doctors.length > 0) {
        return doctors.map((d) => {
          const specs =
            d.specializations
              ?.map((ds) => ds.specialization?.name)
              .filter(Boolean) || [];
          const specText =
            specs.length > 0
              ? specs.join(', ')
              : d.specialization || 'Nha khoa tổng quát';
          return {
            id: d.id,
            fullName: d.user?.fullName || 'Bác sĩ',
            title: d.position || '',
            specialization: specText,
            yearsExperience: d.yearsExperience || 0,
            bio: d.bio || '',
          };
        });
      }
    } catch (err: any) {
      this.logger.error(`getInternalDoctors prisma query error: ${err.message}`);
    }

    // Fallback to appointmentService booking options if direct prisma query fails or returns empty
    const options = await this.appointmentService.getBookingOptions({});
    const doctors = (options.doctors || []) as any[];

    return doctors.map((d) => ({
      id: d.id,
      fullName: d.user?.fullName || d.fullName || 'Bác sĩ',
      title: d.title || d.position || '',
      specialization: d.specialization || 'Nha khoa tổng quát',
      yearsExperience: d.yearsExperience || 0,
    }));
  }

  async getInternalSlots(query: {
    date: string;
    doctorId?: string;
    serviceId?: string;
    treatmentMethodId?: string;
    time?: string;
  }) {
    const options = await this.appointmentService.getBookingOptions({
      date: query.date,
      doctorId: query.doctorId,
      serviceId: query.serviceId,
      treatmentMethodId: query.treatmentMethodId,
      time: query.time,
    });
    return {
      date: query.date,
      dates: options.dates || [],
      selectedDateId: options.selectedDateId,
      doctors: (options.doctors || []).map((d: any) => ({
        id: d.id,
        name: d.user?.fullName || d.fullName || 'Bác sĩ',
        title: d.title,
        specialization: d.specialization,
      })),
      timeSlots: options.timeSlots || [],
    };
  }

  async getInternalAppointments(userId: string) {
    if (!userId) return [];

    try {
      const patients = await this.prisma.patient.findMany({
        where: { OR: [{ userId }, { id: userId }] },
        select: { id: true },
      });
      const patientIds = patients.map((p) => p.id);

      const appointments = await this.prisma.appointment.findMany({
        where: {
          OR: [
            { createdBy: userId },
            { patientId: { in: patientIds } },
          ],
          status: { notIn: ['CANCELLED'] },
        },
        include: {
          patient: { select: { id: true, fullName: true, phone: true } },
          doctor: { select: { id: true, user: { select: { fullName: true } } } },
          treatmentMethod: {
            select: {
              id: true,
              name: true,
              service: { select: { name: true } },
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      });

      return appointments.map((apt) => ({
        id: apt.id,
        appointmentCode:
          apt.appointmentCode || apt.id.substring(0, 8).toUpperCase(),
        patientName: apt.patient?.fullName || 'Bệnh nhân',
        doctorName: apt.doctor?.user?.fullName || 'Bác sĩ',
        serviceName:
          apt.treatmentMethod?.service?.name ||
          apt.treatmentMethod?.name ||
          'Khám nha khoa',
        treatmentMethodName: apt.treatmentMethod?.name || '',
        scheduledAt: apt.scheduledAt
          ? apt.scheduledAt.toISOString()
          : '',
        status: apt.status,
      }));
    } catch (err: any) {
      this.logger.error(`getInternalAppointments error: ${err.message}`);
      return [];
    }
  }

  async bookInternalAppointment(dto: {
    createdByUserId?: string;
    patientId?: string;
    doctorId?: string;
    treatmentMethodId?: string;
    scheduledAt: string;
    notes?: string;
    patientName?: string;
    patientPhone?: string;
    promotionCode?: string;
  }) {
    if (!dto.createdByUserId) {
      throw new BadRequestException('auth.login_required');
    }
    if (!dto.patientId) {
      throw new BadRequestException('patient.required');
    }
    if (!dto.doctorId) {
      throw new BadRequestException('doctor.required');
    }
    if (!dto.treatmentMethodId) {
      throw new BadRequestException('treatment_method.required');
    }

    // Auto-detect active promotion for this treatment method / service if not explicitly provided
    let promotionCode = dto.promotionCode;
    if (!promotionCode && dto.treatmentMethodId) {
      try {
        const tm = await this.prisma.treatmentMethod.findUnique({
          where: { id: dto.treatmentMethodId },
          include: { service: true },
        });
        const now = new Date();
        const promo = await this.prisma.promotion.findFirst({
          where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
            OR: [
              { applicableTreatmentMethodId: dto.treatmentMethodId },
              ...(tm?.service?.slug ? [{ applicableServiceSlug: tm.service.slug }] : []),
            ],
          },
          orderBy: { discountValue: 'desc' },
        });
        if (promo) {
          promotionCode = promo.code;
        }
      } catch (err: any) {
        this.logger.warn(`Auto promotion lookup error: ${err.message}`);
      }
    }

    const createdAppointment =
      (await this.appointmentService.createAppointmentForPatient(
        dto.createdByUserId,
        {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          treatmentMethodId: dto.treatmentMethodId,
          scheduledAt: dto.scheduledAt,
          promotionCode: promotionCode,
          notes: dto.notes
            ? `[AI Agent] ${dto.notes}`
            : '[AI Agent] Dat lich tu dong qua AI Chatbot',
        },
      )) as any;

    return {
      success: true,
      appointmentId: createdAppointment.id,
      appointmentCode: createdAppointment.appointmentCode,
      appliedPromotionCode: promotionCode || null,
      patientName:
        createdAppointment.patientName ||
        createdAppointment.patient?.fullName ||
        dto.patientName ||
        'Bệnh nhân',
      patientPhone: createdAppointment.patient?.phone || dto.patientPhone || '',
      doctorName:
        (typeof createdAppointment.doctorName === 'string' ? createdAppointment.doctorName : null) ||
        createdAppointment.doctor?.user?.fullName ||
        createdAppointment.doctor?.fullName ||
        'Bác sĩ chuyên khoa',
      serviceName:
        (typeof createdAppointment.serviceName === 'string' ? createdAppointment.serviceName : null) ||
        createdAppointment.service?.name ||
        createdAppointment.treatmentMethod?.service?.name ||
        createdAppointment.treatmentMethod?.name ||
        'Khám nha khoa',
      scheduledAt:
        createdAppointment.scheduledAt instanceof Date
          ? createdAppointment.scheduledAt.toISOString()
          : createdAppointment.scheduledAt,
      status: createdAppointment.status,
    };
  }
}
