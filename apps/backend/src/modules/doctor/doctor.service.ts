import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor-dto';
import { UpdateDoctorDto } from './dto/update-doctor-dto';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  private includeDoctorRelations() {
    return {
      user: {
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
      educations: {
        orderBy: { sortOrder: 'asc' as const },
      },
      certificates: {
        orderBy: { sortOrder: 'asc' as const },
      },
      media: {
        orderBy: { sortOrder: 'asc' as const },
      },
      reviews: {
        where: { isVisible: true },
        include: {
          patient: { include: { user: true } },
          appointment: { include: { service: true } },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 8,
      },
    };
  }

  async createDoctor(dto: CreateDoctorDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim();

    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: {
          OR: [{ email }, ...(phone ? [{ phone }] : [])],
        },
      });

      if (existingUser) {
        throw new ConflictException('user.email_or_phone_exists');
      }

      const existingDoctor = await tx.doctor.findFirst({
        where: {
          OR: [
            { doctorCode: dto.doctorCode.trim() },
            { licenseNumber: dto.licenseNumber.trim() },
          ],
        },
      });

      if (existingDoctor) {
        throw new ConflictException('doctor.code_or_license_exists');
      }

      const role = await tx.role.findUnique({
        where: { code: 'DOCTOR' },
      });

      if (!role) {
        throw new BadRequestException('role.doctor_not_found');
      }

      const user = await tx.user.create({
        data: {
          email,
          phone,
          fullName: dto.fullName.trim(),
          passwordHash: await bcrypt.hash(dto.password, 10),
          emailVerified: true,
          status: 'ACTIVE',
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      return tx.doctor.create({
        data: {
          userId: user.id,
          doctorCode: dto.doctorCode.trim(),
          specialization: dto.specialization.trim(),
          licenseNumber: dto.licenseNumber.trim(),
          avatarUrl: dto.avatarUrl?.trim() || undefined,
          bio: dto.bio?.trim() || undefined,
          position: dto.position?.trim() || undefined,
          workplace: dto.workplace?.trim() || undefined,
          yearsExperience: dto.yearsExperience ?? 0,
          isActive: true,
        },
        include: this.includeDoctorRelations(),
      });
    });
  }

  async getAllDoctors() {
    return this.prisma.doctor.findMany({
      include: this.includeDoctorRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDoctorById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: this.includeDoctorRelations(),
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }

    return doctor;
  }

  async updateDoctor(id: string, dto: UpdateDoctorDto) {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();

    return this.prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!doctor) {
        throw new NotFoundException(`Doctor with id ${id} not found`);
      }

      if (email || phone) {
        const duplicateUser = await tx.user.findFirst({
          where: {
            id: { not: doctor.userId },
            OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
          },
        });

        if (duplicateUser) {
          throw new ConflictException('user.email_or_phone_exists');
        }
      }

      if (dto.doctorCode || dto.licenseNumber) {
        const duplicateDoctor = await tx.doctor.findFirst({
          where: {
            id: { not: id },
            OR: [
              ...(dto.doctorCode
                ? [{ doctorCode: dto.doctorCode.trim() }]
                : []),
              ...(dto.licenseNumber
                ? [{ licenseNumber: dto.licenseNumber.trim() }]
                : []),
            ],
          },
        });

        if (duplicateDoctor) {
          throw new ConflictException('doctor.code_or_license_exists');
        }
      }

      await tx.user.update({
        where: { id: doctor.userId },
        data: {
          email,
          phone,
          fullName: dto.fullName?.trim(),
          status: dto.status,
          passwordHash: dto.password
            ? await bcrypt.hash(dto.password, 10)
            : undefined,
        },
      });

      return tx.doctor.update({
        where: { id },
        data: {
          doctorCode: dto.doctorCode?.trim(),
          specialization: dto.specialization?.trim(),
          licenseNumber: dto.licenseNumber?.trim(),
          avatarUrl:
            dto.avatarUrl === undefined
              ? undefined
              : dto.avatarUrl.trim() || null,
          bio: dto.bio === undefined ? undefined : dto.bio.trim() || null,
          position:
            dto.position === undefined
              ? undefined
              : dto.position.trim() || null,
          workplace:
            dto.workplace === undefined
              ? undefined
              : dto.workplace.trim() || null,
          yearsExperience: dto.yearsExperience,
          isActive:
            dto.isActive ?? (dto.status ? dto.status === 'ACTIVE' : undefined),
        },
        include: this.includeDoctorRelations(),
      });
    });
  }

  async deleteDoctor(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: doctor.userId },
        data: { status: 'INACTIVE' },
      }),
      this.prisma.doctor.update({
        where: { id },
        data: { isActive: false },
      }),
    ]);

    return { message: 'doctor.deactivated' };
  }
}
