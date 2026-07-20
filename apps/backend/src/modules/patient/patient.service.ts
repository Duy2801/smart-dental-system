import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  AppointmentPaymentOption,
  AppointmentPaymentStatus,
  AppointmentStatus,
  BookingSource,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  TreatmentPlanStatus,
  TreatmentStepPaymentStatus,
  TreatmentStepStatus,
} from '../../../prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyRecords(userId: string) {
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
    if (existing) return existing;

    return this.prisma.patient.create({
      data: {
        userId,
        patientCode: await this.generatePatientCode(),
      },
      select: { id: true },
    });
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
          endAt: new Date(firstVisit.getTime() + service.durationMinutes * 60_000),
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
          endAt: new Date(secondVisit.getTime() + service.durationMinutes * 60_000),
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
          chiefComplaint: 'Benh nhan dat lich va can duoc theo doi dieu tri.',
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

      const prescription = await tx.prescription.create({
        data: {
          medicalRecordId: medicalRecord.id,
          treatmentPlanStepId: step1.id,
          doctorId: doctor.id,
          patientId,
          notes: 'Don thuoc sau buoc dieu tri dau tien.',
          items: {
            create: [
              {
                medicineName: 'Paracetamol',
                dosage: '500mg',
                frequency: 'Khi dau',
                duration: '3 ngay',
                instruction: 'Uong sau an, khong qua lieu khuyen cao.',
              },
            ],
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

    return {
      patient: {
        id: patient.id,
        patientCode: patient.patientCode,
        fullName: patient.user.fullName,
        phone: patient.user.phone,
        email: patient.user.email,
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
        service: record.appointment.service.name,
        diagnosis: record.diagnosis,
        treatmentNotes: record.treatmentNotes,
        followUpDate: record.followUpDate?.toISOString() ?? null,
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
