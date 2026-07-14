import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const TEST_PASSWORD = 'Test@123456';
const now = new Date();
const dayMs = 24 * 60 * 60 * 1000;

const addDays = (days: number) => new Date(now.getTime() + days * dayMs);
const dateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

const roles = [
  ['ADMIN', 'Administrator', 'Full system access'],
  ['DOCTOR', 'Doctor', 'Dental doctor account'],
  ['RECEPTIONIST', 'Receptionist', 'Front desk account'],
  ['PATIENT', 'Patient', 'Patient portal account'],
  ['MANAGER', 'Clinic Manager', 'Clinic operation manager'],
  ['ACCOUNTANT', 'Accountant', 'Billing and payment staff'],
  ['ASSISTANT', 'Dental Assistant', 'Doctor assistant'],
  ['SUPPORT', 'Support Agent', 'Patient support staff'],
  ['MARKETING', 'Marketing Staff', 'Promotion management staff'],
  ['VIEWER', 'Viewer', 'Read-only account'],
] as const;

const permissions = [
  ['users.read', 'View users', 'users', 'read'],
  ['users.manage', 'Manage users', 'users', 'manage'],
  ['roles.manage', 'Manage roles', 'roles', 'manage'],
  ['appointments.read', 'View appointments', 'appointments', 'read'],
  ['appointments.manage', 'Manage appointments', 'appointments', 'manage'],
  ['patients.manage', 'Manage patients', 'patients', 'manage'],
  ['doctors.manage', 'Manage doctors', 'doctors', 'manage'],
  ['invoices.manage', 'Manage invoices', 'invoices', 'manage'],
  ['payments.manage', 'Manage payments', 'payments', 'manage'],
  ['reports.read', 'View reports', 'reports', 'read'],
] as const;

const clinicConfigs = Array.from({ length: 10 }, (_, index) => ({
  configType: index < 5 ? 'BUSINESS' : 'SYSTEM',
  configKey: `seed.config.${String(index + 1).padStart(2, '0')}`,
  configValue:
    index === 0
      ? 'Smart Dental Clinic'
      : index === 1
        ? '08:00'
        : index === 2
          ? '18:00'
          : `Seed configuration value ${index + 1}`,
  configDate: index < 3 ? null : addDays(index),
}));

const adminUsers = [
  {
    email: 'admin@smartdental.test',
    fullName: 'Admin Test',
    phone: '0900000001',
    roleCode: 'ADMIN',
    status: 'ACTIVE' as const,
  },
  {
    email: 'receptionist@smartdental.test',
    fullName: 'Receptionist Test',
    phone: '0900000002',
    roleCode: 'RECEPTIONIST',
    status: 'ACTIVE' as const,
  },
  {
    email: 'manager@smartdental.test',
    fullName: 'Manager Test',
    phone: '0900000003',
    roleCode: 'MANAGER',
    status: 'ACTIVE' as const,
  },
  {
    email: 'accountant@smartdental.test',
    fullName: 'Accountant Test',
    phone: '0900000004',
    roleCode: 'ACCOUNTANT',
    status: 'ACTIVE' as const,
  },
  {
    email: 'assistant@smartdental.test',
    fullName: 'Assistant Test',
    phone: '0900000005',
    roleCode: 'ASSISTANT',
    status: 'ACTIVE' as const,
  },
  {
    email: 'support@smartdental.test',
    fullName: 'Support Test',
    phone: '0900000006',
    roleCode: 'SUPPORT',
    status: 'ACTIVE' as const,
  },
  {
    email: 'marketing@smartdental.test',
    fullName: 'Marketing Test',
    phone: '0900000007',
    roleCode: 'MARKETING',
    status: 'INACTIVE' as const,
  },
  {
    email: 'viewer@smartdental.test',
    fullName: 'Viewer Test',
    phone: '0900000008',
    roleCode: 'VIEWER',
    status: 'SUSPENDED' as const,
  },
];

const patientSeeds = Array.from({ length: 10 }, (_, index) => ({
  email: `patient${String(index + 1).padStart(2, '0')}@smartdental.test`,
  fullName: `Patient Seed ${String(index + 1).padStart(2, '0')}`,
  phone: `09100000${String(index + 1).padStart(2, '0')}`,
  patientCode: `PAT-SEED-${String(index + 1).padStart(3, '0')}`,
  dateOfBirth: dateOnly(`199${index % 10}-0${(index % 9) + 1}-15`),
  gender: (['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const)[index % 4],
  status: (index === 8 ? 'INACTIVE' : index === 9 ? 'SUSPENDED' : 'ACTIVE') as
    | 'ACTIVE'
    | 'INACTIVE'
    | 'SUSPENDED',
  address: `${index + 1} Nguyen Trai, District ${index + 1}, Ho Chi Minh City`,
  emergencyContactName: `Emergency Contact ${index + 1}`,
  emergencyContactPhone: `09810000${String(index + 1).padStart(2, '0')}`,
  medicalHistory:
    index % 3 === 0
      ? 'Sensitive teeth and mild gum bleeding.'
      : 'No significant medical history.',
}));

const doctorSeeds = Array.from({ length: 10 }, (_, index) => ({
  email:
    index === 0
      ? 'doctor@smartdental.test'
      : `doctor${String(index + 1).padStart(2, '0')}@smartdental.test`,
  fullName: `Doctor Seed ${String(index + 1).padStart(2, '0')}`,
  phone: `09200000${String(index + 1).padStart(2, '0')}`,
  doctorCode: `DOC-SEED-${String(index + 1).padStart(3, '0')}`,
  specialization: [
    'General Dentistry',
    'Orthodontics',
    'Endodontics',
    'Periodontics',
    'Prosthodontics',
  ][index % 5],
  licenseNumber: `VN-DENT-SEED-${String(index + 1).padStart(4, '0')}`,
  status: (index === 9 ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
  isActive: index !== 9,
}));

const services = [
  ['General', 'Dental Checkup', 'Routine dental examination.', 30, '200000'],
  ['General', 'Teeth Cleaning', 'Scaling and polishing.', 45, '350000'],
  ['Restorative', 'Dental Filling', 'Composite tooth filling.', 60, '600000'],
  [
    'Endodontics',
    'Root Canal Treatment',
    'Single-root canal therapy.',
    90,
    '1800000',
  ],
  [
    'Cosmetic',
    'Teeth Whitening',
    'In-clinic whitening session.',
    60,
    '1500000',
  ],
  ['Surgery', 'Tooth Extraction', 'Simple extraction procedure.', 45, '500000'],
  [
    'Orthodontics',
    'Braces Consultation',
    'Initial orthodontic assessment.',
    45,
    '300000',
  ],
  [
    'Prosthodontics',
    'Dental Crown',
    'Porcelain crown restoration.',
    90,
    '3500000',
  ],
  [
    'Implant',
    'Implant Consultation',
    'Implant planning consultation.',
    60,
    '500000',
  ],
  ['Pediatric', 'Kids Dental Care', 'Dental care for children.', 30, '250000'],
] as const;

const promotions = Array.from({ length: 10 }, (_, index) => ({
  code: `SEEDPROMO${String(index + 1).padStart(2, '0')}`,
  name: `Seed Promotion ${index + 1}`,
  description: `Sample promotion ${index + 1}`,
  discountType: (index % 2 === 0 ? 'PERCENTAGE' : 'FIXED_AMOUNT') as
    | 'PERCENTAGE'
    | 'FIXED_AMOUNT',
  discountValue:
    index % 2 === 0 ? String(5 + index) : String(50000 * (index + 1)),
  minOrderAmount: String(200000 * (index + 1)),
  maxUses: 100 + index,
  usedCount: index,
  startDate:
    index === 8
      ? addDays(20)
      : index === 9
        ? addDays(-90)
        : addDays(-30 + index),
  endDate:
    index === 8 ? addDays(90) : index === 9 ? addDays(-5) : addDays(60 + index),
  isActive: index !== 7,
}));

async function seedBaseData() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const createdRoles = new Map<string, { id: string }>();
  for (const [code, name, description] of roles) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name, description, isActive: true },
      create: { code, name, description, isActive: true },
      select: { id: true },
    });
    createdRoles.set(code, role);
  }

  const createdPermissions: Array<{ id: string; code: string }> = [];
  for (const [code, name, module, action] of permissions) {
    createdPermissions.push(
      await prisma.permission.upsert({
        where: { code },
        update: { name, module, action, description: `${name} permission` },
        create: {
          code,
          name,
          module,
          action,
          description: `${name} permission`,
        },
        select: { id: true, code: true },
      }),
    );
  }

  const permissionsByCode = new Map(
    createdPermissions.map((permission) => [permission.code, permission]),
  );
  const rolePermissionCodes: Record<string, string[]> = {
    ADMIN: createdPermissions.map((permission) => permission.code),
    MANAGER: [
      'users.read',
      'appointments.read',
      'appointments.manage',
      'patients.manage',
      'doctors.manage',
      'reports.read',
    ],
    DOCTOR: ['appointments.read', 'patients.manage', 'reports.read'],
    RECEPTIONIST: [
      'appointments.read',
      'appointments.manage',
      'patients.manage',
      'payments.manage',
    ],
    ACCOUNTANT: ['invoices.manage', 'payments.manage', 'reports.read'],
    ASSISTANT: ['appointments.read', 'patients.manage'],
    SUPPORT: ['users.read', 'appointments.read', 'patients.manage'],
    MARKETING: ['reports.read'],
    VIEWER: ['users.read', 'appointments.read', 'reports.read'],
    PATIENT: ['appointments.read'],
  };

  for (const [roleCode, permissionCodes] of Object.entries(
    rolePermissionCodes,
  )) {
    const role = createdRoles.get(roleCode)!;
    for (const permissionCode of permissionCodes) {
      const permission = permissionsByCode.get(permissionCode)!;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  for (const config of clinicConfigs) {
    await prisma.clinicConfig.upsert({
      where: { configKey: config.configKey },
      update: config,
      create: config,
    });
  }

  const adminAndReception = new Map<string, { id: string }>();
  for (const userSeed of adminUsers) {
    const user = await prisma.user.upsert({
      where: { email: userSeed.email },
      update: {
        fullName: userSeed.fullName,
        phone: userSeed.phone,
        passwordHash,
        status: userSeed.status,
        emailVerified: true,
      },
      create: {
        email: userSeed.email,
        fullName: userSeed.fullName,
        phone: userSeed.phone,
        passwordHash,
        status: userSeed.status,
        emailVerified: true,
      },
      select: { id: true },
    });

    const role = createdRoles.get(userSeed.roleCode)!;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
    adminAndReception.set(userSeed.roleCode, user);
  }

  const patients: Array<{ id: string; userId: string }> = [];
  const patientRole = createdRoles.get('PATIENT')!;
  for (const patientSeed of patientSeeds) {
    const user = await prisma.user.upsert({
      where: { email: patientSeed.email },
      update: {
        fullName: patientSeed.fullName,
        phone: patientSeed.phone,
        passwordHash,
        status: patientSeed.status,
        emailVerified: true,
      },
      create: {
        email: patientSeed.email,
        fullName: patientSeed.fullName,
        phone: patientSeed.phone,
        passwordHash,
        status: patientSeed.status,
        emailVerified: true,
      },
      select: { id: true },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: patientRole.id } },
      update: {},
      create: { userId: user.id, roleId: patientRole.id },
    });

    patients.push(
      await prisma.patient.upsert({
        where: { patientCode: patientSeed.patientCode },
        update: {
          userId: user.id,
          dateOfBirth: patientSeed.dateOfBirth,
          gender: patientSeed.gender,
          address: patientSeed.address,
          emergencyContactName: patientSeed.emergencyContactName,
          emergencyContactPhone: patientSeed.emergencyContactPhone,
          medicalHistory: patientSeed.medicalHistory,
        },
        create: {
          userId: user.id,
          patientCode: patientSeed.patientCode,
          dateOfBirth: patientSeed.dateOfBirth,
          gender: patientSeed.gender,
          address: patientSeed.address,
          emergencyContactName: patientSeed.emergencyContactName,
          emergencyContactPhone: patientSeed.emergencyContactPhone,
          medicalHistory: patientSeed.medicalHistory,
        },
        select: { id: true, userId: true },
      }),
    );
  }

  const doctors: Array<{ id: string; userId: string }> = [];
  const doctorRole = createdRoles.get('DOCTOR')!;
  for (const doctorSeed of doctorSeeds) {
    const user = await prisma.user.upsert({
      where: { email: doctorSeed.email },
      update: {
        fullName: doctorSeed.fullName,
        phone: doctorSeed.phone,
        passwordHash,
        status: doctorSeed.status,
        emailVerified: true,
      },
      create: {
        email: doctorSeed.email,
        fullName: doctorSeed.fullName,
        phone: doctorSeed.phone,
        passwordHash,
        status: doctorSeed.status,
        emailVerified: true,
      },
      select: { id: true },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: doctorRole.id } },
      update: {},
      create: { userId: user.id, roleId: doctorRole.id },
    });

    doctors.push(
      await prisma.doctor.upsert({
        where: { doctorCode: doctorSeed.doctorCode },
        update: {
          userId: user.id,
          specialization: doctorSeed.specialization,
          licenseNumber: doctorSeed.licenseNumber,
          isActive: doctorSeed.isActive,
        },
        create: {
          userId: user.id,
          doctorCode: doctorSeed.doctorCode,
          specialization: doctorSeed.specialization,
          licenseNumber: doctorSeed.licenseNumber,
          isActive: doctorSeed.isActive,
        },
        select: { id: true, userId: true },
      }),
    );
  }

  const createdServices: Array<{
    id: string;
    name: string;
    basePrice: { toString(): string };
  }> = [];
  for (const [
    category,
    name,
    description,
    durationMinutes,
    basePrice,
  ] of services) {
    const existingService = await prisma.service.findFirst({
      where: { name },
      select: { id: true },
    });

    if (existingService) {
      createdServices.push(
        await prisma.service.update({
          where: { id: existingService.id },
          data: {
            category,
            description,
            durationMinutes,
            basePrice,
            isActive: true,
          },
          select: { id: true, name: true, basePrice: true },
        }),
      );
      continue;
    }

    createdServices.push(
      await prisma.service.create({
        data: {
          category,
          name,
          description,
          durationMinutes,
          basePrice,
          isActive: true,
        },
        select: { id: true, name: true, basePrice: true },
      }),
    );
  }

  const createdPromotions: Array<{ id: string }> = [];
  for (const promotion of promotions) {
    createdPromotions.push(
      await prisma.promotion.upsert({
        where: { code: promotion.code },
        update: promotion,
        create: promotion,
        select: { id: true },
      }),
    );
  }

  return {
    adminUser: adminAndReception.get('ADMIN')!,
    receptionistUser: adminAndReception.get('RECEPTIONIST')!,
    patients,
    doctors,
    services: createdServices,
    promotions: createdPromotions,
  };
}

async function cleanGeneratedSampleData() {
  await prisma.notification.deleteMany({
    where: { type: 'MARKETING', title: { startsWith: 'Seed Marketing' } },
  });
  await prisma.notification.deleteMany({
    where: { type: { startsWith: 'SEED_' } },
  });
  await prisma.review.deleteMany({
    where: { comment: { startsWith: 'Seed review' } },
  });
  await prisma.payment.deleteMany({
    where: { transactionRef: { startsWith: 'SEED-PAY-' } },
  });
  await prisma.invoice.deleteMany({
    where: { invoiceCode: { startsWith: 'INV-SEED-' } },
  });
  await prisma.medicalRecord.deleteMany({
    where: { chiefComplaint: { startsWith: 'Seed complaint' } },
  });
  await prisma.treatmentPlan.deleteMany({
    where: { title: { startsWith: 'Seed Treatment Plan' } },
  });
  await prisma.chatbotConversation.deleteMany({
    where: { sessionId: { startsWith: 'seed-session-' } },
  });
  await prisma.videoConsultation.deleteMany({
    where: { notes: { startsWith: 'Seed video consultation' } },
  });
  await prisma.doctorAvailability.deleteMany({
    where: { reason: { startsWith: 'Seed availability' } },
  });
  await prisma.appointment.deleteMany({
    where: { appointmentCode: { startsWith: 'APT-SEED-' } },
  });
}

async function seedRelatedData(
  context: Awaited<ReturnType<typeof seedBaseData>>,
) {
  await cleanGeneratedSampleData();

  for (let index = 0; index < 10; index += 1) {
    await prisma.doctorAvailability.create({
      data: {
        doctorId: context.doctors[index].id,
        recordType: 'WEEKLY',
        dayOfWeek: (index % 6) + 1,
        startTime: index % 2 === 0 ? '08:00' : '13:30',
        endTime: index % 2 === 0 ? '12:00' : '17:30',
        reason: `Seed availability ${index + 1}`,
        isActive: true,
      },
    });
  }
  await prisma.doctorAvailability.create({
    data: {
      doctorId: context.doctors[0].id,
      recordType: 'DATE_OVERRIDE',
      specificDate: addDays(7),
      startTime: '09:00',
      endTime: '15:00',
      reason: 'Seed availability date override',
      isActive: true,
    },
  });
  await prisma.doctorAvailability.create({
    data: {
      doctorId: context.doctors[1].id,
      recordType: 'TIME_OFF',
      specificDate: addDays(10),
      startTime: '00:00',
      endTime: '23:59',
      reason: 'Seed availability time off',
      isActive: false,
    },
  });

  const appointments: Array<{
    id: string;
    patientId: string;
    doctorId: string;
    serviceId: string;
    scheduledAt: Date;
  }> = [];
  const appointmentDayOffsets = [-6, -5, -4, -3, -2, -1, 0, 0, 1, 2];
  const appointmentStatuses = [
    'COMPLETED',
    'CONFIRMED',
    'CHECKED_IN',
    'IN_PROGRESS',
    'CANCELLED',
    'NO_SHOW',
    'PENDING',
    'RESCHEDULED',
    'COMPLETED',
    'CONFIRMED',
  ] as const;
  const bookingSources = [
    'PATIENT_APP',
    'WEBSITE',
    'RECEPTIONIST',
    'AI',
    'OTHER',
  ] as const;
  for (let index = 0; index < 10; index += 1) {
    const scheduledAt = addDays(appointmentDayOffsets[index]);
    scheduledAt.setHours(8 + (index % 6), index % 2 === 0 ? 0 : 30, 0, 0);
    const service = context.services[index];
    const appointmentStatus = appointmentStatuses[index];

    appointments.push(
      await prisma.appointment.create({
        data: {
          appointmentCode: `APT-SEED-${String(index + 1).padStart(3, '0')}`,
          patientId: context.patients[index].id,
          doctorId: context.doctors[index].id,
          serviceId: service.id,
          scheduledAt,
          endAt: new Date(scheduledAt.getTime() + (30 + index * 5) * 60 * 1000),
          status: appointmentStatus,
          bookingSource: bookingSources[index % bookingSources.length],
          aiSuggestedTime:
            index % 3 === 0 ? addDays(appointmentDayOffsets[index] + 1) : null,
          notes: `Seed appointment note ${index + 1}`,
          rescheduleHistory:
            index === 8
              ? [
                  {
                    from: addDays(
                      appointmentDayOffsets[index] - 1,
                    ).toISOString(),
                    to: scheduledAt.toISOString(),
                  },
                ]
              : undefined,
          cancellationReason:
            appointmentStatus === 'CANCELLED'
              ? 'Patient requested cancellation.'
              : appointmentStatus === 'NO_SHOW'
                ? 'Patient did not arrive.'
                : null,
          cancelledAt:
            index === 4 ? addDays(appointmentDayOffsets[index]) : null,
          checkedInAt:
            appointmentStatus === 'CHECKED_IN' ||
            appointmentStatus === 'IN_PROGRESS' ||
            appointmentStatus === 'COMPLETED'
              ? scheduledAt
              : null,
          completedAt: appointmentStatus === 'COMPLETED' ? scheduledAt : null,
          createdBy: context.receptionistUser.id,
        },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          serviceId: true,
          scheduledAt: true,
        },
      }),
    );
  }

  const treatmentPlans: Array<{ id: string }> = [];
  for (let index = 0; index < 10; index += 1) {
    treatmentPlans.push(
      await prisma.treatmentPlan.create({
        data: {
          patientId: context.patients[index].id,
          doctorId: context.doctors[index].id,
          title: `Seed Treatment Plan ${index + 1}`,
          description: `Sample dental treatment plan ${index + 1}`,
          status:
            index % 4 === 0
              ? 'PLANNED'
              : index % 4 === 1
                ? 'IN_PROGRESS'
                : index % 4 === 2
                  ? 'COMPLETED'
                  : 'CANCELLED',
          startDate: addDays(index),
          expectedEndDate: addDays(index + 30),
          items: [
            {
              service: context.services[index].name,
              tooth: `${11 + index}`,
              estimatedCost: context.services[index].basePrice.toString(),
            },
          ],
        },
        select: { id: true },
      }),
    );
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.medicalRecord.create({
      data: {
        patientId: context.patients[index].id,
        appointmentId: appointments[index].id,
        doctorId: context.doctors[index].id,
        chiefComplaint: `Seed complaint ${index + 1}`,
        diagnosis: `Seed diagnosis ${index + 1}`,
        treatmentNotes: `Treatment completed for sample case ${index + 1}.`,
        internalNotes: `Internal seed note ${index + 1}.`,
        followUpDate: addDays(index + 14),
        dentalChart: {
          teeth: [
            {
              number: 11 + index,
              status: index % 2 === 0 ? 'healthy' : 'treated',
            },
          ],
        },
        images: [],
        prescriptions: [
          {
            name: 'Paracetamol',
            dosage: '500mg',
            instruction: 'Use when needed after meal.',
          },
        ],
      },
    });
  }

  const invoices: Array<{ id: string; finalAmount: any }> = [];
  const invoiceStatuses = [
    'PAID',
    'PAID',
    'ISSUED',
    'PAID',
    'REFUNDED',
    'PAID',
    'DRAFT',
    'PAID',
    'PARTIALLY_PAID',
    'CANCELLED',
  ] as const;
  for (let index = 0; index < 10; index += 1) {
    const subtotal = Number(context.services[index].basePrice.toString());
    const discountAmount = index % 2 === 0 ? Math.round(subtotal * 0.05) : 0;
    invoices.push(
      await prisma.invoice.create({
        data: {
          invoiceCode: `INV-SEED-${String(index + 1).padStart(3, '0')}`,
          patientId: context.patients[index].id,
          appointmentId: appointments[index].id,
          promotionId: index % 2 === 0 ? context.promotions[index].id : null,
          items: [
            {
              serviceId: context.services[index].id,
              name: context.services[index].name,
              quantity: 1,
              unitPrice: subtotal,
            },
          ],
          subtotal: String(subtotal),
          discountAmount: String(discountAmount),
          finalAmount: String(subtotal - discountAmount),
          status: invoiceStatuses[index],
          exportFileUrl: `https://files.smartdental.test/invoices/INV-SEED-${index + 1}.pdf`,
          issuedAt: appointments[index].scheduledAt,
          createdBy: context.receptionistUser.id,
        },
        select: { id: true, finalAmount: true },
      }),
    );
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.payment.create({
      data: {
        invoiceId: invoices[index].id,
        amount: invoices[index].finalAmount,
        paymentMethod:
          index % 5 === 0
            ? 'CASH'
            : index % 5 === 1
              ? 'CARD'
              : index % 5 === 2
                ? 'BANK_TRANSFER'
                : index % 5 === 3
                  ? 'E_WALLET'
                  : 'ONLINE_GATEWAY',
        transactionRef: `SEED-PAY-${String(index + 1).padStart(3, '0')}`,
        status:
          index % 4 === 0
            ? 'PENDING'
            : index % 4 === 1
              ? 'SUCCESS'
              : index % 4 === 2
                ? 'FAILED'
                : 'REFUNDED',
        paidAt:
          invoiceStatuses[index] === 'PAID'
            ? appointments[index].scheduledAt
            : null,
        receivedBy: context.receptionistUser.id,
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.review.create({
      data: {
        patientId: context.patients[index].id,
        doctorId: context.doctors[index].id,
        appointmentId: appointments[index].id,
        rating: (index % 5) + 1,
        comment: `Seed review ${index + 1}: friendly doctor and clear explanation.`,
        isVisible: index !== 9,
        createdAt: appointments[index].scheduledAt,
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    const isClosed = index % 3 === 0;
    await prisma.chatbotConversation.create({
      data: {
        sessionId: `seed-session-${String(index + 1).padStart(3, '0')}`,
        patientId: context.patients[index].id,
        status: isClosed ? 'CLOSED' : index % 3 === 1 ? 'ACTIVE' : 'ESCALATED',
        messages: [
          { role: 'patient', content: 'I need advice about tooth pain.' },
          {
            role: 'assistant',
            content: 'Please book a checkup if pain persists.',
          },
        ],
        startedAt: addDays(-index),
        endedAt: isClosed ? addDays(-index + 1) : null,
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.videoConsultation.create({
      data: {
        patientId: context.patients[index].id,
        doctorId: context.doctors[index].id,
        scheduledAt: addDays(index + 3),
        durationMinutes: 20 + index * 5,
        status:
          index % 4 === 0
            ? 'SCHEDULED'
            : index % 4 === 1
              ? 'IN_PROGRESS'
              : index % 4 === 2
                ? 'COMPLETED'
                : 'CANCELLED',
        meetingUrl: `https://meet.smartdental.test/seed-${index + 1}`,
        fee: String(200000 + index * 50000),
        isPaid: index % 2 === 0,
        notes: `Seed video consultation ${index + 1}`,
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.notification.create({
      data: {
        userId: context.patients[index].userId,
        type: `SEED_REMINDER_${index + 1}`,
        title: `Seed notification ${index + 1}`,
        content: `This is sample notification content ${index + 1}.`,
        channel:
          index % 4 === 0
            ? 'IN_APP'
            : index % 4 === 1
              ? 'EMAIL'
              : index % 4 === 2
                ? 'SMS'
                : 'PUSH',
        status:
          index % 5 === 0
            ? 'PENDING'
            : index % 5 === 1
              ? 'SENT'
              : index % 5 === 2
                ? 'FAILED'
                : index % 5 === 3
                  ? 'READ'
                  : 'CANCELLED',
        scheduledAt: addDays(index + 1),
        appointmentId: appointments[index].id,
        treatmentPlanId: treatmentPlans[index].id,
        isManual: index % 2 === 0,
        sentAt: index % 5 === 1 || index % 5 === 3 ? addDays(index) : null,
        readAt: index % 5 === 3 ? addDays(index + 1) : null,
      },
    });
  }

  const marketingCampaigns = [
    {
      title: 'Seed Marketing - Summer Smile Voucher',
      content:
        'Nhan uu dai cham soc rang mieng mua he tai Smart Dental Clinic.',
      channel: 'EMAIL' as const,
      scheduledAt: addDays(-3),
    },
    {
      title: 'Seed Marketing - Tai kham dinh ky',
      content:
        'Da den luc dat lich tai kham dinh ky de duy tri suc khoe rang mieng.',
      channel: 'IN_APP' as const,
      scheduledAt: addDays(-1),
    },
    {
      title: 'Seed Marketing - Implant Consultation',
      content:
        'Tu van Implant cung bac si chuyen khoa voi uu dai trong thang nay.',
      channel: 'EMAIL' as const,
      scheduledAt: addDays(2),
    },
  ];

  for (const [campaignIndex, campaign] of marketingCampaigns.entries()) {
    for (
      let patientIndex = 0;
      patientIndex < context.patients.length;
      patientIndex += 1
    ) {
      const status =
        campaignIndex === 2
          ? 'PENDING'
          : patientIndex % 5 === 0
            ? 'FAILED'
            : patientIndex % 3 === 0
              ? 'READ'
              : 'SENT';

      await prisma.notification.create({
        data: {
          userId: context.patients[patientIndex].userId,
          type: 'MARKETING',
          title: campaign.title,
          content: campaign.content,
          channel: campaign.channel,
          status,
          scheduledAt: campaign.scheduledAt,
          isManual: true,
          sentAt:
            status === 'SENT' || status === 'READ'
              ? campaign.scheduledAt
              : null,
          readAt: status === 'READ' ? addDays(-1 + patientIndex) : null,
        },
      });
    }
  }
}

async function main() {
  const context = await seedBaseData();
  await seedRelatedData(context);

  console.log('Seed completed.');
  console.table([
    { role: 'ADMIN', email: 'admin@smartdental.test', password: TEST_PASSWORD },
    {
      role: 'RECEPTIONIST',
      email: 'receptionist@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'MANAGER',
      email: 'manager@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'ACCOUNTANT',
      email: 'accountant@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'ASSISTANT',
      email: 'assistant@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'SUPPORT',
      email: 'support@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'MARKETING',
      email: 'marketing@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'VIEWER',
      email: 'viewer@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'DOCTOR',
      email: 'doctor@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'PATIENT',
      email: 'patient01@smartdental.test',
      password: TEST_PASSWORD,
    },
  ]);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
