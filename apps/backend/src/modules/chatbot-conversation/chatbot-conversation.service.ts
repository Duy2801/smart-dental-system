import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AiClientService } from '../ai/ai-client.service';
import { AppointmentService } from '../appointment/appointment.service';
import { PatientService } from '../patient/patient.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatHistoryDto, PatientChatDto } from './dto/chat.dto';

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
    } catch {
      this.logger.error('AI chat request failed');
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
    } catch {
      this.logger.error('AI agent chat request failed');
      return this.maintenanceReply();
    }
  }

  private async buildAgentPayload(
    user: any | null,
    dto: PatientChatDto,
    allowLegacyPatientFallback: boolean,
  ) {
    const profiles = user?.userId
      ? await this.currentProfiles(user.userId)
      : [];
    const allowed = new Set(profiles.map((profile) => profile.id));
    if (dto.patientId && !allowed.has(dto.patientId))
      throw new ForbiddenException('patient.access_denied');
    const selected =
      profiles.find((profile) => profile.id === dto.patientId) ||
      (allowLegacyPatientFallback
        ? profiles.find((profile) => profile.isPrimary)
        : undefined);
    const metadata = this.sanitizeIdentity(dto.metadata || {}, allowed);
    const history = (dto.history || []).map((h) => ({
      role: h.role,
      content: h.content,
      metadata: this.sanitizeIdentity(h.metadata || {}, allowed),
    }));

    return {
      created_by_user_id: user?.userId || null,
      patient_id: selected?.id || null,
      patient_name: selected?.fullName || null,
      patient_phone: selected?.phone || null,
      message: dto.message,
      metadata,
      history,
    };
  }

  private sanitizeIdentity(value: any, allowed: Set<string>): any {
    if (Array.isArray(value))
      return value.map((item) => this.sanitizeIdentity(item, allowed));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) => {
        const normalized = key.replace(/[_-]/g, '').toLowerCase();
        if (
          [
            'userid',
            'createdbyuserid',
            'createdby',
            'accountid',
            'sessionid',
          ].includes(normalized)
        )
          return [];
        if (
          normalized === 'patientid' &&
          item !== null &&
          item !== '' &&
          (typeof item !== 'string' || !allowed.has(item))
        )
          throw new ForbiddenException('patient.access_denied');
        return [[key, this.sanitizeIdentity(item, allowed)]];
      }),
    );
  }

  private async currentProfiles(userId: string) {
    const profiles =
      await this.patientService.getManagedPatientProfiles(userId);
    // Profile presentation is cached; authorization always checks current grants.
    const links = await this.prisma.patientAccount.findMany({
      where: { userId },
      select: { patientId: true },
    });
    const allowed = new Set(links.map((link) => link.patientId));
    return profiles.filter((profile) => allowed.has(profile.id));
  }

  private async historyOwner(user: any, create = false) {
    if (!user?.userId) throw new UnauthorizedException();
    let patient = await this.prisma.patient.findFirst({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!patient && create) {
      await this.patientService.getManagedPatientProfiles(user.userId);
      patient = await this.prisma.patient.findFirst({
        where: { userId: user.userId },
        select: { id: true },
      });
    }
    if (!patient) return null;
    return { sessionId: `patient-chat:${user.userId}`, patientId: patient.id };
  }

  private async validatedHistory(dto: unknown, user: any) {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    const valid: ChatHistoryDto = await pipe.transform(dto, {
      type: 'body',
      metatype: ChatHistoryDto,
    });
    const profiles = await this.currentProfiles(user.userId);
    return this.sanitizeIdentity(
      valid.messages,
      new Set(profiles.map((profile) => profile.id)),
    );
  }

  async getHistory(user: any) {
    const owner = await this.historyOwner(user);
    if (!owner) return { messages: [] };
    const stored = await this.prisma.chatbotConversation.findUnique({
      where: { sessionId: owner.sessionId },
    });
    if (!stored) return { messages: [] };
    if (stored.patientId !== owner.patientId)
      throw new ForbiddenException('patient.access_denied');
    return {
      messages: await this.validatedHistory(
        { messages: stored.messages },
        user,
      ),
    };
  }

  async putHistory(user: any, dto: ChatHistoryDto) {
    const owner = await this.historyOwner(user, true);
    if (!owner) throw new ForbiddenException('patient.access_denied');
    const messages = await this.validatedHistory(dto, user);
    const stored = await this.prisma.chatbotConversation.findUnique({
      where: { sessionId: owner.sessionId },
    });
    if (stored && stored.patientId !== owner.patientId)
      throw new ForbiddenException('patient.access_denied');
    await this.prisma.chatbotConversation.upsert({
      where: { sessionId: owner.sessionId },
      create: { ...owner, messages },
      update: { messages },
    });
    return { messages };
  }

  async deleteHistory(user: any) {
    const owner = await this.historyOwner(user);
    if (!owner) return { messages: [] };
    await this.prisma.chatbotConversation.deleteMany({ where: owner });
    return { messages: [] };
  }

  async getInternalClinic() {
    const textFields = ['name', 'phone', 'email', 'address', 'logoUrl'];
    const jsonFields = ['businessHours', 'lunchBreak', 'specialDates'];
    try {
      const rows = await this.prisma.clinicConfig.findMany({
        where: {
          configKey: {
            in: [...textFields, ...jsonFields].map((key) => `clinic.${key}`),
          },
        },
      });
      const output: Record<string, unknown> = {};
      for (const row of rows) {
        const key = row.configKey.replace(/^clinic\./, '');
        if (textFields.includes(key)) output[key] = row.configValue;
        if (jsonFields.includes(key)) {
          try {
            const parsed: unknown = JSON.parse(row.configValue);
            const fields =
              key === 'businessHours'
                ? ['id', 'label', 'isOpen', 'start', 'end']
                : key === 'lunchBreak'
                  ? ['isEnabled', 'start', 'end']
                  : ['date', 'label', 'isClosed', 'start', 'end'];
            const selectPublic = (item: unknown) =>
              item && typeof item === 'object' && !Array.isArray(item)
                ? Object.fromEntries(
                    Object.entries(item).filter(
                      ([field, value]) =>
                        fields.includes(field) &&
                        ['string', 'number', 'boolean'].includes(typeof value),
                    ),
                  )
                : null;
            if (key === 'lunchBreak') {
              const item = selectPublic(parsed);
              if (item) output[key] = item;
            } else if (Array.isArray(parsed))
              output[key] = parsed
                .map(selectPublic)
                .filter((item) => item !== null);
          } catch {
            /* An invalid configured value is unavailable. */
          }
        }
      }
      return output;
    } catch {
      throw new ServiceUnavailableException('chatbot.source_unavailable');
    }
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
                const discount =
                  (basePrice * Number(tmPromo.discountValue)) / 100;
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
              : s.basePrice === null || s.basePrice === undefined
                ? null
                : Number(s.basePrice);

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
      return [];
    } catch {
      throw new ServiceUnavailableException('chatbot.source_unavailable');
    }
  }

  async getInternalPatients(userId: string) {
    if (!userId) return [];
    try {
      return await this.currentProfiles(userId);
    } catch {
      throw new ServiceUnavailableException('chatbot.source_unavailable');
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
      return [];
    } catch {
      throw new ServiceUnavailableException('chatbot.source_unavailable');
    }
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
      const patients = await this.currentProfiles(userId);
      const patientIds = patients.map((p) => p.id);
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date());
      const part = (type: string) =>
        parts.find((item) => item.type === type)?.value;
      const today = new Date(
        `${part('year')}-${part('month')}-${part('day')}T00:00:00+07:00`,
      );

      const appointments = await this.prisma.appointment.findMany({
        where: {
          patientId: { in: patientIds },
          scheduledAt: { gte: today },
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
        },
        include: {
          patient: { select: { id: true, fullName: true } },
          doctor: {
            select: { id: true, user: { select: { fullName: true } } },
          },
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
        scheduledAt: apt.scheduledAt ? apt.scheduledAt.toISOString() : '',
        status: apt.status,
      }));
    } catch {
      throw new ServiceUnavailableException('chatbot.source_unavailable');
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
              ...(tm?.service?.slug
                ? [{ applicableServiceSlug: tm.service.slug }]
                : []),
            ],
          },
          orderBy: { discountValue: 'desc' },
        });
        if (promo) {
          promotionCode = promo.code;
        }
      } catch {
        this.logger.warn('AI booking promotion lookup failed');
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
        (typeof createdAppointment.doctorName === 'string'
          ? createdAppointment.doctorName
          : null) ||
        createdAppointment.doctor?.user?.fullName ||
        createdAppointment.doctor?.fullName ||
        'Bác sĩ chuyên khoa',
      serviceName:
        (typeof createdAppointment.serviceName === 'string'
          ? createdAppointment.serviceName
          : null) ||
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
