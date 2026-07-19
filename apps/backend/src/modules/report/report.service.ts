import { Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  BookingSource,
  InvoiceStatus,
} from '../../../prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { ReportTimeFilter } from './dto/report-query.dto';

type DateRange = {
  end: Date;
  start: Date;
};

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const today = this.getDayRange(new Date());
    const yesterday = this.shiftRange(today, -1);
    const month = this.getDateRange('this_month');
    const previousMonth = this.getPreviousRange(month);
    const lastSevenDays = this.getLastSevenDayRanges(new Date());
    const lastSixMonths = {
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    };

    const [
      todayRevenue,
      yesterdayRevenue,
      todayAppointments,
      yesterdayAppointments,
      newPatientsToday,
      newPatientsYesterday,
      activeDoctors,
      averageRatingToday,
      averageRatingYesterday,
      appointmentsLast7Days,
      recentActivities,
      actionItems,
      todaySchedule,
      popularServices,
      reexamRate,
    ] = await Promise.all([
      this.getPaidRevenue(today),
      this.getPaidRevenue(yesterday),
      this.getAppointmentCount(today),
      this.getAppointmentCount(yesterday),
      this.getPatientCount(today),
      this.getPatientCount(yesterday),
      this.prisma.doctor.count({ where: { isActive: true } }),
      this.getAverageRating(today),
      this.getAverageRating(yesterday),
      this.getAppointmentsChart(lastSevenDays),
      this.getRecentActivities(),
      this.getActionItems(),
      this.getTodaySchedule(today),
      this.getPopularServices(month),
      this.getReexamRate(lastSixMonths),
    ]);

    return {
      statCards: [
        {
          label: 'Doanh thu hom nay',
          value: todayRevenue,
          suffix: 'd',
          trend: this.getTrendPercent(todayRevenue, yesterdayRevenue),
          trendLabel: 'so voi hom qua',
          type: 'currency',
        },
        {
          label: 'Lich kham hom nay',
          value: todayAppointments,
          suffix: 'ca',
          trend: this.getTrendPercent(todayAppointments, yesterdayAppointments),
          trendLabel: 'so voi hom qua',
          type: 'number',
        },
        {
          label: 'Benh nhan moi',
          value: newPatientsToday,
          suffix: 'nguoi',
          trend: this.getTrendPercent(newPatientsToday, newPatientsYesterday),
          trendLabel: 'so voi hom qua',
          type: 'number',
        },
        {
          label: 'Bac si hoat dong',
          value: activeDoctors,
          suffix: 'nguoi',
          trend: 0,
          trendLabel: 'dang hoat dong',
          type: 'number',
        },
        {
          label: 'Danh gia trung binh',
          value: averageRatingToday,
          suffix: '*',
          trend: Math.round((averageRatingToday - averageRatingYesterday) * 10),
          trendLabel: 'diem thang 10',
          type: 'decimal',
          isStar: true,
        },
      ],
      appointmentsLast7Days,
      recentActivities,
      actionItems,
      todayAppointments: todaySchedule,
      popularServices,
      reexamRate: {
        rate: reexamRate,
        change: reexamRate - (await this.getReexamRate(previousMonth)),
      },
    };
  }

  async getOverview(timeFilter: ReportTimeFilter) {
    const range = this.getDateRange(timeFilter);
    const previousRange = this.getPreviousRange(range);
    const chartRanges = this.getLastSixMonthRanges(range.start);

    const [
      revenue,
      previousRevenue,
      visits,
      previousVisits,
      reviewStats,
      previousReviewStats,
      reexamRate,
      previousReexamRate,
      revenueChartData,
      topServices,
      bookingSources,
    ] = await Promise.all([
      this.getPaidRevenue(range),
      this.getPaidRevenue(previousRange),
      this.getVisitCount(range),
      this.getVisitCount(previousRange),
      this.getReviewStats(range),
      this.getReviewStats(previousRange),
      this.getReexamRate(range),
      this.getReexamRate(previousRange),
      this.getRevenueChartData(chartRanges),
      this.getTopServices(range),
      this.getBookingSources(range),
    ]);

    return {
      statCards: [
        {
          label: 'Tong Doanh Thu',
          value: revenue,
          type: 'currency',
          trend: this.getTrendPercent(revenue, previousRevenue),
          trendLabel: 'so voi ky truoc',
        },
        {
          label: 'Luot Kham Moi',
          value: visits,
          type: 'number',
          trend: this.getTrendPercent(visits, previousVisits),
          trendLabel: 'so voi ky truoc',
        },
        {
          label: 'Ty Le Tai Kham',
          value: reexamRate,
          type: 'percentage',
          trend: reexamRate - previousReexamRate,
          trendLabel: 'diem % so voi ky truoc',
        },
        {
          label: 'Danh Gia (TB)',
          value: reviewStats.averageRating,
          type: 'decimal',
          trend: Math.round(
            (reviewStats.averageRating - previousReviewStats.averageRating) *
              10,
          ),
          trendLabel: 'diem thang 10',
        },
      ],
      revenueChartData,
      topServices,
      bookingSources,
      period: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
    };
  }

  private async getPaidRevenue(range: DateRange) {
    const result = await this.prisma.invoice.aggregate({
      where: {
        status: InvoiceStatus.PAID,
        issuedAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      _sum: {
        finalAmount: true,
      },
    });

    return Number(result._sum.finalAmount ?? 0);
  }

  private async getVisitCount(range: DateRange) {
    return this.prisma.appointment.count({
      where: {
        scheduledAt: {
          gte: range.start,
          lt: range.end,
        },
        status: {
          in: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.COMPLETED,
          ],
        },
      },
    });
  }

  private async getAppointmentCount(range: DateRange) {
    return this.prisma.appointment.count({
      where: {
        scheduledAt: {
          gte: range.start,
          lt: range.end,
        },
      },
    });
  }

  private async getPatientCount(range: DateRange) {
    return this.prisma.patient.count({
      where: {
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
      },
    });
  }

  private async getAverageRating(range: DateRange) {
    const result = await this.prisma.review.aggregate({
      where: {
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
        isVisible: true,
      },
      _avg: { rating: true },
    });

    return Number((result._avg.rating ?? 0).toFixed(1));
  }

  private async getAppointmentsChart(ranges: DateRange[]) {
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    return Promise.all(
      ranges.map(async (range) => ({
        day: dayLabels[range.start.getDay()],
        count: await this.getAppointmentCount(range),
      })),
    );
  }

  private async getRecentActivities() {
    const [appointments, patients, payments] = await Promise.all([
      this.prisma.appointment.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: true } },
          creator: true,
          service: true,
        },
      }),
      this.prisma.patient.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      }),
      this.prisma.payment.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { invoice: true },
      }),
    ]);

    return [
      ...appointments.map((appointment) => ({
        id: appointment.id,
        type: 'appointment',
        title: 'Dat lich moi',
        description: `${appointment.patient?.user.fullName ?? appointment.creator.fullName} - ${appointment.service.name}`,
        time: appointment.createdAt.toISOString(),
      })),
      ...patients.map((patient) => ({
        id: patient.id,
        type: 'patient',
        title: 'Benh nhan moi',
        description: `${patient.user.fullName} da dang ky ho so`,
        time: patient.createdAt.toISOString(),
      })),
      ...payments.map((payment) => ({
        id: payment.id,
        type: 'payment',
        title: 'Thanh toan',
        description: `${payment.invoice.invoiceCode} - ${Number(payment.amount).toLocaleString('vi-VN')}d`,
        time: payment.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }

  private async getActionItems() {
    const [pendingAppointments, unpaidInvoices] = await Promise.all([
      this.prisma.appointment.findMany({
        take: 3,
        where: { status: AppointmentStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: true } },
          creator: true,
        },
      }),
      this.prisma.invoice.findMany({
        take: 3,
        where: {
          status: {
            in: [
              InvoiceStatus.DRAFT,
              InvoiceStatus.ISSUED,
              InvoiceStatus.PARTIALLY_PAID,
            ],
          },
        },
        orderBy: [{ issuedAt: 'desc' }, { invoiceCode: 'desc' }],
      }),
    ]);

    return [
      ...pendingAppointments.map((appointment) => ({
        id: appointment.id,
        title: 'Lich hen can theo doi',
        desc: `${appointment.patient?.user.fullName ?? appointment.creator.fullName} dat lich (${appointment.status}).`,
        time: appointment.createdAt.toISOString(),
        action: 'Xem lich hen',
        href: '/admin/schedules',
      })),
      ...unpaidInvoices.map((invoice) => ({
        id: invoice.id,
        title: 'Hoa don can theo doi',
        desc: `${invoice.invoiceCode} tri gia ${Number(invoice.finalAmount).toLocaleString('vi-VN')}d.`,
        time: (invoice.issuedAt ?? new Date()).toISOString(),
        action: 'Xem tai chinh',
        href: '/admin/finance',
      })),
    ].slice(0, 5);
  }

  private async getTodaySchedule(range: DateRange) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      take: 8,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { include: { user: true } },
        creator: true,
        doctor: { include: { user: true } },
        service: true,
      },
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      start_time: this.formatTime(appointment.scheduledAt),
      end_time: this.formatTime(appointment.endAt),
      patient_name: appointment.patient?.user.fullName ?? appointment.creator.fullName,
      service_name: appointment.service.name,
      doctor_name: appointment.doctor.user.fullName,
      status: appointment.status,
    }));
  }

  private async getPopularServices(range: DateRange) {
    const grouped = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        scheduledAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      _count: { serviceId: true },
    });

    const total = grouped.reduce((sum, item) => sum + item._count.serviceId, 0);
    const services = await this.prisma.service.findMany({
      where: { id: { in: grouped.map((item) => item.serviceId) } },
      select: { id: true, name: true },
    });
    const serviceNameById = new Map(services.map((service) => [service.id, service.name]));

    return grouped
      .map((item) => ({
        name: serviceNameById.get(item.serviceId) ?? 'Dich vu',
        count: item._count.serviceId,
        percent: total ? Math.round((item._count.serviceId / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  private async getReviewStats(range: DateRange) {
    const result = await this.prisma.review.aggregate({
      where: {
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
        isVisible: true,
      },
      _avg: {
        rating: true,
      },
    });

    return {
      averageRating: Number((result._avg.rating ?? 0).toFixed(1)),
    };
  }

  private async getReexamRate(range: DateRange) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: range.start,
          lt: range.end,
        },
        status: AppointmentStatus.COMPLETED,
      },
      select: {
        patientId: true,
      },
    });

    if (appointments.length === 0) {
      return 0;
    }

    const visitByPatient = new Map<string, number>();
    appointments.forEach((appointment) => {
      if (!appointment.patientId) return;
      visitByPatient.set(
        appointment.patientId,
        (visitByPatient.get(appointment.patientId) ?? 0) + 1,
      );
    });

    const reexamPatients = Array.from(visitByPatient.values()).filter(
      (visitCount) => visitCount > 1,
    ).length;

    if (visitByPatient.size === 0) return 0;

    return Math.round((reexamPatients / visitByPatient.size) * 100);
  }

  private async getRevenueChartData(ranges: DateRange[]) {
    return Promise.all(
      ranges.map(async (range) => ({
        label: `T${range.start.getMonth() + 1}`,
        value: Math.round(((await this.getPaidRevenue(range)) / 1_000_000) * 10) / 10,
      })),
    );
  }

  private async getTopServices(range: DateRange) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        issuedAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      select: {
        finalAmount: true,
        appointment: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const serviceRevenue = new Map<string, { name: string; revenue: number }>();

    invoices.forEach((invoice) => {
      const service = invoice.appointment.service;
      const current = serviceRevenue.get(service.id) ?? {
        name: service.name,
        revenue: 0,
      };
      current.revenue += Number(invoice.finalAmount);
      serviceRevenue.set(service.id, current);
    });

    return Array.from(serviceRevenue.values())
      .sort((a, b) => b.revenue - a.revenue);
  }

  private async getBookingSources(range: DateRange) {
    const grouped = await this.prisma.appointment.groupBy({
      by: ['bookingSource'],
      where: {
        scheduledAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      _count: {
        bookingSource: true,
      },
    });

    const total = grouped.reduce(
      (sum, item) => sum + item._count.bookingSource,
      0,
    );
    const sourceCount = (sources: BookingSource[]) =>
      grouped
        .filter((item) => sources.includes(item.bookingSource))
        .reduce((sum, item) => sum + item._count.bookingSource, 0);
    const toSource = (count: number) => ({
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    });

    return {
      total,
      online: toSource(
        sourceCount([BookingSource.PATIENT_APP, BookingSource.WEBSITE]),
      ),
      walkIn: toSource(sourceCount([BookingSource.RECEPTIONIST])),
      aiChatbot: toSource(sourceCount([BookingSource.AI])),
    };
  }

  private getDateRange(timeFilter: ReportTimeFilter): DateRange {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (timeFilter === 'last_month') {
      return {
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 1),
      };
    }

    if (timeFilter === 'this_quarter') {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      return {
        start: new Date(year, quarterStartMonth, 1),
        end: new Date(year, quarterStartMonth + 3, 1),
      };
    }

    if (timeFilter === 'this_year') {
      return {
        start: new Date(year, 0, 1),
        end: new Date(year + 1, 0, 1),
      };
    }

    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 1),
    };
  }

  private getDayRange(date: Date): DateRange {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return {
      start,
      end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1),
    };
  }

  private shiftRange(range: DateRange, days: number): DateRange {
    const duration = days * 24 * 60 * 60 * 1000;
    return {
      start: new Date(range.start.getTime() + duration),
      end: new Date(range.end.getTime() + duration),
    };
  }

  private getLastSevenDayRanges(date: Date): DateRange[] {
    const today = this.getDayRange(date);
    return Array.from({ length: 7 }).map((_, index) =>
      this.shiftRange(today, index - 6),
    );
  }

  private formatTime(date: Date) {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getPreviousRange(range: DateRange): DateRange {
    const duration = range.end.getTime() - range.start.getTime();

    return {
      start: new Date(range.start.getTime() - duration),
      end: range.start,
    };
  }

  private getLastSixMonthRanges(end: Date): DateRange[] {
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    return Array.from({ length: 6 }).map((_, index) => {
      const start = new Date(
        endMonth.getFullYear(),
        endMonth.getMonth() - (5 - index),
        1,
      );

      return {
        start,
        end: new Date(start.getFullYear(), start.getMonth() + 1, 1),
      };
    });
  }

  private getTrendPercent(current: number, previous: number) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Math.round(((current - previous) / previous) * 100);
  }
}
