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

const testAccounts = [
  {
    roleCode: 'ADMIN',
    roleName: 'Administrator',
    roleDescription: 'Quản trị toàn bộ hệ thống',
    email: 'admin@smartdental.test',
    fullName: 'Quản trị viên',
  },
  {
    roleCode: 'DOCTOR',
    roleName: 'Doctor',
    roleDescription: 'Bác sĩ nha khoa',
    email: 'doctor@smartdental.test',
    fullName: 'Bác sĩ Test',
  },
  {
    roleCode: 'RECEPTIONIST',
    roleName: 'Receptionist',
    roleDescription: 'Nhân viên lễ tân',
    email: 'receptionist@smartdental.test',
    fullName: 'Lễ tân Test',
  },
  {
    roleCode: 'PATIENT',
    roleName: 'Patient',
    roleDescription: 'Bệnh nhân sử dụng hệ thống',
    email: 'patient@smartdental.test',
    fullName: 'Bệnh nhân Test',
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const account of testAccounts) {
    const role = await prisma.role.upsert({
      where: { code: account.roleCode },
      update: {
        name: account.roleName,
        description: account.roleDescription,
        isActive: true,
      },
      create: {
        code: account.roleCode,
        name: account.roleName,
        description: account.roleDescription,
      },
    });

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        fullName: account.fullName,
        passwordHash,
        status: 'ACTIVE',
        emailVerified: true,
      },
      create: {
        email: account.email,
        fullName: account.fullName,
        passwordHash,
        emailVerified: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }

  console.log('Seed completed.');
  console.table(
    testAccounts.map(({ roleCode, email }) => ({
      role: roleCode,
      email,
      password: TEST_PASSWORD,
    })),
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
