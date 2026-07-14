import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BusinessHourDto,
  UpdateClinicConfigDto,
} from './dto/update-clinic-config.dto';

@Injectable()
export class ClinicConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultConfig = {
    name: 'Smart Dental Clinic',
    phone: '1900 1234',
    email: 'contact@smartdental.com',
    address: '123 Nguyen Van Linh, Da Nang',
    logoUrl: '',
    businessHours: [
      { id: 1, label: 'Thu Hai', isOpen: true, start: '08:00', end: '17:00' },
      { id: 2, label: 'Thu Ba', isOpen: true, start: '08:00', end: '17:00' },
      { id: 3, label: 'Thu Tu', isOpen: true, start: '08:00', end: '17:00' },
      { id: 4, label: 'Thu Nam', isOpen: true, start: '08:00', end: '17:00' },
      { id: 5, label: 'Thu Sau', isOpen: true, start: '08:00', end: '17:00' },
      { id: 6, label: 'Thu Bay', isOpen: true, start: '08:00', end: '12:00' },
      { id: 0, label: 'Chu Nhat', isOpen: false, start: '08:00', end: '12:00' },
    ],
  };

  async getClinicConfig() {
    const rows = await this.prisma.clinicConfig.findMany({
      where: { configType: 'CLINIC_PROFILE' },
    });

    const values = rows.reduce<Record<string, string>>((acc, row) => {
      acc[row.configKey] = row.configValue;
      return acc;
    }, {});

    return {
      name: values['clinic.name'] ?? this.defaultConfig.name,
      phone: values['clinic.phone'] ?? this.defaultConfig.phone,
      email: values['clinic.email'] ?? this.defaultConfig.email,
      address: values['clinic.address'] ?? this.defaultConfig.address,
      logoUrl: values['clinic.logoUrl'] ?? this.defaultConfig.logoUrl,
      businessHours: this.parseBusinessHours(values['clinic.businessHours']),
    };
  }

  async updateClinicConfig(dto: UpdateClinicConfigDto) {
    const current = await this.getClinicConfig();
    const next = {
      ...current,
      ...dto,
      businessHours: dto.businessHours ?? current.businessHours,
    };

    await this.upsertConfig('clinic.name', next.name);
    await this.upsertConfig('clinic.phone', next.phone);
    await this.upsertConfig('clinic.email', next.email);
    await this.upsertConfig('clinic.address', next.address);
    await this.upsertConfig('clinic.logoUrl', next.logoUrl);
    await this.upsertConfig(
      'clinic.businessHours',
      JSON.stringify(next.businessHours),
    );

    return next;
  }

  private parseBusinessHours(value?: string): BusinessHourDto[] {
    if (!value) return this.defaultConfig.businessHours;

    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return this.defaultConfig.businessHours;

      return parsed.every((item) => this.isBusinessHour(item))
        ? parsed
        : this.defaultConfig.businessHours;
    } catch {
      return this.defaultConfig.businessHours;
    }
  }

  private isBusinessHour(value: unknown): value is BusinessHourDto {
    if (!value || typeof value !== 'object') return false;

    const item = value as Record<string, unknown>;
    return (
      typeof item.id === 'number' &&
      typeof item.label === 'string' &&
      typeof item.isOpen === 'boolean' &&
      typeof item.start === 'string' &&
      typeof item.end === 'string'
    );
  }

  private upsertConfig(configKey: string, configValue: string) {
    return this.prisma.clinicConfig.upsert({
      where: { configKey },
      update: {
        configValue,
        configType: 'CLINIC_PROFILE',
      },
      create: {
        configType: 'CLINIC_PROFILE',
        configKey,
        configValue,
      },
    });
  }
}
