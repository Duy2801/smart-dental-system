import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BusinessHourDto,
  ClinicSpecialDateDto,
  UpdateClinicConfigDto,
} from './dto/update-clinic-config.dto';
import { DepositCalculationMode } from '../../../prisma/generated/enums';

const defaultSlotIntervalMinutes = 30;

@Injectable()
export class ClinicConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getClinicConfig() {
    const rows = await this.prisma.clinicConfig.findMany({
      where: { configType: 'CLINIC_PROFILE' },
    });

    const values = rows.reduce<Record<string, string>>((acc, row) => {
      acc[row.configKey] = row.configValue;
      return acc;
    }, {});

    const businessHours = this.parseBusinessHours(
      values['clinic.businessHours'],
    );
    const slotIntervalMinutes = this.parseSlotInterval(
      values['clinic.slotIntervalMinutes'],
    );
    const specialDates = this.parseSpecialDates(values['clinic.specialDates']);
    const bookingDepositEnabled =
      values['booking.deposit.enabled'] === undefined ||
      values['booking.deposit.enabled'] === null ||
      values['booking.deposit.enabled'] === ''
        ? true
        : values['booking.deposit.enabled'] === 'true';
    const bookingDepositCalculationMode =
      this.parseDepositCalculationMode(values['booking.deposit.mode']);
    const bookingDepositValue = this.parseDecimal(values['booking.deposit.value']);

    return {
      name: values['clinic.name'] ?? '',
      phone: values['clinic.phone'] ?? '',
      email: values['clinic.email'] ?? '',
      address: values['clinic.address'] ?? '',
      logoUrl: values['clinic.logoUrl'] ?? '',
      businessHours,
      slotIntervalMinutes,
      specialDates,
      bookingDepositEnabled,
      bookingDepositCalculationMode,
      bookingDepositValue,
      isBusinessHoursConfigured: businessHours.length === 7,
    };
  }

  async updateClinicConfig(dto: UpdateClinicConfigDto) {
    const current = await this.getClinicConfig();
    const next = {
      ...current,
      ...dto,
      businessHours: dto.businessHours ?? current.businessHours,
      slotIntervalMinutes:
        dto.slotIntervalMinutes ?? current.slotIntervalMinutes,
      specialDates: dto.specialDates ?? current.specialDates,
    };

    this.validateBusinessHours(next.businessHours);
    this.validateSlotInterval(next.slotIntervalMinutes);
    this.validateSpecialDates(next.specialDates);

    await this.upsertConfig('clinic.name', next.name);
    await this.upsertConfig('clinic.phone', next.phone);
    await this.upsertConfig('clinic.email', next.email);
    await this.upsertConfig('clinic.address', next.address);
    await this.upsertConfig('clinic.logoUrl', next.logoUrl);
    await this.upsertConfig(
      'clinic.businessHours',
      JSON.stringify(next.businessHours),
    );
    await this.upsertConfig(
      'clinic.slotIntervalMinutes',
      String(next.slotIntervalMinutes),
    );
    await this.upsertConfig(
      'clinic.specialDates',
      JSON.stringify(next.specialDates),
    );
    await this.upsertConfig(
      'booking.deposit.enabled',
      String(next.bookingDepositEnabled ?? false),
    );
    await this.upsertConfig(
      'booking.deposit.mode',
      next.bookingDepositCalculationMode ?? 'PERCENT',
    );
    await this.upsertConfig(
      'booking.deposit.value',
      String(next.bookingDepositValue ?? 30),
    );

    if (dto.businessHours) {
      try {
        await this.syncDoctorWeeklyAvailability(next.businessHours);
      } catch (err) {
        console.error('Error syncing doctor weekly availability:', err);
      }
    }

    return next;
  }

  private async syncDoctorWeeklyAvailability(businessHours: BusinessHourDto[]) {
    const doctors = await this.prisma.doctor.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (doctors.length === 0) return;

    for (const bh of businessHours) {
      if (bh.isOpen) {
        for (const doctor of doctors) {
          const existing = await this.prisma.doctorAvailability.findFirst({
            where: {
              doctorId: doctor.id,
              recordType: 'WEEKLY',
              dayOfWeek: bh.id,
            },
          });

          if (existing) {
            await this.prisma.doctorAvailability.update({
              where: { id: existing.id },
              data: {
                startTime: bh.start,
                endTime: bh.end,
                isActive: true,
              },
            });
          } else {
            await this.prisma.doctorAvailability.create({
              data: {
                doctorId: doctor.id,
                recordType: 'WEEKLY',
                dayOfWeek: bh.id,
                startTime: bh.start,
                endTime: bh.end,
                isActive: true,
              },
            });
          }
        }
      } else {
        await this.prisma.doctorAvailability.deleteMany({
          where: {
            recordType: 'WEEKLY',
            dayOfWeek: bh.id,
          },
        });
      }
    }
  }

  async getConfiguredBusinessHours() {
    const { businessHours, isBusinessHoursConfigured } =
      await this.getClinicConfig();

    if (!isBusinessHoursConfigured) {
      throw new BadRequestException('clinic.business_hours_not_configured');
    }

    return businessHours;
  }

  async getClinicScheduleConfig() {
    const { businessHours, isBusinessHoursConfigured, slotIntervalMinutes, specialDates } =
      await this.getClinicConfig();

    if (!isBusinessHoursConfigured) {
      throw new BadRequestException('clinic.business_hours_not_configured');
    }

    return {
      businessHours,
      slotIntervalMinutes,
      specialDates,
    };
  }

  private parseBusinessHours(value?: string): BusinessHourDto[] {
    if (!value) return [];

    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      if (!parsed.every((item) => this.isBusinessHour(item))) return [];

      const dayIds = new Set(parsed.map((item) => item.id));
      const complete = [0, 1, 2, 3, 4, 5, 6].every((dayId) =>
        dayIds.has(dayId),
      );

      return parsed.length === 7 && complete
        ? [...parsed].sort((a, b) => this.sortDay(a.id) - this.sortDay(b.id))
        : [];
    } catch {
      return [];
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

  private parseSlotInterval(value?: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return defaultSlotIntervalMinutes;
    }

    return parsed;
  }

  private parseSpecialDates(value?: string): ClinicSpecialDateDto[] {
    if (!value) return [];

    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      const valid = parsed.filter((item): item is ClinicSpecialDateDto =>
        this.isSpecialDate(item),
      );

      return valid.sort((left, right) => left.date.localeCompare(right.date));
    } catch {
      return [];
    }
  }

  private parseDepositCalculationMode(
    value?: string,
  ): DepositCalculationMode {
    return value === 'FIXED' ? DepositCalculationMode.FIXED : DepositCalculationMode.PERCENT;
  }

  private parseDecimal(value?: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 30;
  }

  private isSpecialDate(value: unknown): value is ClinicSpecialDateDto {
    if (!value || typeof value !== 'object') return false;

    const item = value as Record<string, unknown>;
    return (
      typeof item.date === 'string' &&
      typeof item.label === 'string' &&
      typeof item.isClosed === 'boolean' &&
      (item.start === undefined || typeof item.start === 'string') &&
      (item.end === undefined || typeof item.end === 'string')
    );
  }

  private validateBusinessHours(businessHours: BusinessHourDto[]) {
    if (businessHours.length !== 7) {
      throw new BadRequestException('clinic.business_hours_required');
    }

    const expectedDayIds = new Set([0, 1, 2, 3, 4, 5, 6]);
    const receivedDayIds = new Set(businessHours.map((hour) => hour.id));

    if (
      receivedDayIds.size !== expectedDayIds.size ||
      [...expectedDayIds].some((dayId) => !receivedDayIds.has(dayId))
    ) {
      throw new BadRequestException('clinic.business_hours_invalid_days');
    }

    const invalidTimeRange = businessHours.some(
      (hour) => hour.isOpen && hour.start >= hour.end,
    );
    if (invalidTimeRange) {
      throw new BadRequestException('clinic.business_hours_invalid_time_range');
    }
  }

  private validateSlotInterval(slotIntervalMinutes: number) {
    if (
      !Number.isInteger(slotIntervalMinutes) ||
      slotIntervalMinutes < 5 ||
      slotIntervalMinutes > 240
    ) {
      throw new BadRequestException('clinic.slot_interval_invalid');
    }
  }

  private validateSpecialDates(specialDates: ClinicSpecialDateDto[]) {
    const seenDates = new Set<string>();

    for (const specialDate of specialDates) {
      if (seenDates.has(specialDate.date)) {
        throw new BadRequestException('clinic.special_dates_duplicate');
      }
      seenDates.add(specialDate.date);

      if (
        !specialDate.isClosed &&
        (!specialDate.start || !specialDate.end || specialDate.start >= specialDate.end)
      ) {
        throw new BadRequestException('clinic.special_dates_invalid_time_range');
      }
    }
  }

  private sortDay(dayId: number) {
    return dayId === 0 ? 7 : dayId;
  }

  private upsertConfig(configKey: string, configValue?: string | null) {
    const value = configValue ?? '';
    return this.prisma.clinicConfig.upsert({
      where: { configKey },
      update: {
        configValue: value,
        configType: 'CLINIC_PROFILE',
      },
      create: {
        configType: 'CLINIC_PROFILE',
        configKey,
        configValue: value,
      },
    });
  }
}
