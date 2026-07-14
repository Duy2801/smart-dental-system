import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { StaffRoleCode, UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(user: object) {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.findByEmail(email)) {
      throw new ConflictException('auth.email_exists');
    }
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        fullName: dto.fullName.trim(),
        phone: dto.phone,
        status: dto.status,
      },
    });
    return this.toResponse(user);
  }

  async createStaffUser(dto: CreateStaffUserDto, roleCode: StaffRoleCode) {
    if (roleCode === StaffRoleCode.DOCTOR) {
      throw new BadRequestException('doctor.use_doctor_endpoint');
    }

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

      const role = await tx.role.findUnique({
        where: { code: roleCode },
      });

      if (!role) {
        throw new BadRequestException('role.not_found');
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

      const staff = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          roles: { include: { role: true } },
          doctorProfile: true,
        },
      });

      return {
        id: staff!.id,
        doctorId: staff!.doctorProfile?.id ?? null,
        fullName: staff!.fullName,
        email: staff!.email,
        phone: staff!.phone,
        status: staff!.status,
        createdAt: staff!.createdAt,
        updatedAt: staff!.updatedAt,
        roles: staff!.roles.map(({ role }) => role.code),
        role: role.code,
        doctorProfile: staff!.doctorProfile,
      };
    });
  }

  async findAll(query: UserQueryDto) {
    const where = query.status ? { status: query.status } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { roles: { include: { role: true } } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      data: data.map((user) =>
        this.toResponse({
          ...user,
          roles: user.roles.map(({ role }) => role.code),
        }),
      ),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findStaff(query: UserQueryDto) {
    const staffRoles = [
      StaffRoleCode.ADMIN,
      StaffRoleCode.DOCTOR,
      StaffRoleCode.RECEPTIONIST,
    ];
    const search = query.search?.trim();
    const roleCodes = query.roleCode ? [query.roleCode] : staffRoles;

    const where = {
      status: query.status,
      roles: {
        some: {
          role: {
            code: {
              in: roleCodes,
            },
          },
        },
      },
      OR: search
        ? [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          roles: { include: { role: true } },
          doctorProfile: true,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((user) => ({
        id: user.id,
        doctorId: user.doctorProfile?.id ?? null,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.roles.map(({ role }) => role.code),
        role:
          user.roles.find(({ role }) =>
            staffRoles.includes(role.code as StaffRoleCode),
          )?.role.code ?? null,
        doctorProfile: user.doctorProfile,
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findStaffById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        doctorProfile: true,
      },
    });

    if (!user) throw new NotFoundException('user.not_found');

    return {
      id: user.id,
      doctorId: user.doctorProfile?.id ?? null,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(({ role }) => role.code),
      role:
        user.roles.find(({ role }) =>
          [
            StaffRoleCode.ADMIN,
            StaffRoleCode.DOCTOR,
            StaffRoleCode.RECEPTIONIST,
          ].includes(role.code as StaffRoleCode),
        )?.role.code ?? null,
      doctorProfile: user.doctorProfile,
    };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('user.not_found');
    return this.toResponse({
      ...user,
      roles: user.roles.map(({ role }) => role.code),
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const { password, roleCode, ...data } = dto;
    const email = data.email?.trim().toLowerCase();
    const phone = data.phone?.trim();

    const user = await this.prisma.$transaction(async (tx) => {
      if (email || phone) {
        const duplicateUser = await tx.user.findFirst({
          where: {
            id: { not: id },
            OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
          },
        });

        if (duplicateUser) {
          throw new ConflictException('user.email_or_phone_exists');
        }
      }

      if (roleCode) {
        if (roleCode === StaffRoleCode.DOCTOR) {
          throw new BadRequestException('doctor.use_doctor_endpoint');
        }

        const role = await tx.role.findUnique({
          where: { code: roleCode },
        });

        if (!role) {
          throw new BadRequestException('role.not_found');
        }

        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({
          data: {
            userId: id,
            roleId: role.id,
          },
        });
      }

      return tx.user.update({
        where: { id },
        data: {
          ...data,
          email,
          phone,
          fullName: data.fullName?.trim(),
          passwordHash: password ? await bcrypt.hash(password, 10) : undefined,
        },
      });
    });

    return this.toResponse(user);
  }

  async remove(id: string) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return this.toResponse(user);
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  markVerified(email: string) {
    return this.prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });
  }
}
