import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailService } from './mail.service';

type MailJob = {
  name: string;
  email: string;
  locale?: 'en' | 'vi';
  otp?: string;
  token?: string;
  appointmentCode?: string;
  serviceName?: string;
  doctorName?: string;
  scheduledAt?: string;
  oldScheduledAt?: string;
  newScheduledAt?: string;
  reason?: string;
  paymentLabel?: string;
  depositAmount?: number;
};

@Processor('mail-queue')
export class MailProcessor {
  constructor(private readonly mailService: MailService) {}

  @Process('send-otp')
  sendOtp(job: Job<MailJob>) {
    return this.mailService.sendOtp({
      ...job.data,
      otp: job.data.otp!,
      locale: job.data.locale ?? 'vi',
    });
  }

  @Process('send-password-reset')
  sendPasswordReset(job: Job<MailJob>) {
    return this.mailService.sendPasswordReset({
      ...job.data,
      token: job.data.token!,
      locale: job.data.locale ?? 'vi',
    });
  }

  @Process('send-appointment-confirmation')
  sendAppointmentConfirmation(job: Job<MailJob>) {
    return this.mailService.sendAppointmentConfirmation({
      name: job.data.name,
      email: job.data.email,
      appointmentCode: job.data.appointmentCode,
      locale: job.data.locale ?? 'vi',
      serviceName: job.data.serviceName ?? 'Khám tổng quát',
      doctorName: job.data.doctorName ?? 'Bác sĩ phụ trách',
      scheduledAt: job.data.scheduledAt!,
      paymentLabel: job.data.paymentLabel,
      depositAmount: job.data.depositAmount,
    });
  }

  @Process('send-appointment-reminder')
  sendAppointmentReminder(job: Job<MailJob>) {
    return this.mailService.sendAppointmentReminder({
      name: job.data.name,
      email: job.data.email,
      appointmentCode: job.data.appointmentCode,
      serviceName: job.data.serviceName ?? 'Khám nha khoa',
      doctorName: job.data.doctorName ?? 'Bác sĩ phụ trách',
      scheduledAt: job.data.scheduledAt!,
    });
  }

  @Process('send-appointment-rescheduled')
  sendAppointmentRescheduled(job: Job<MailJob>) {
    return this.mailService.sendAppointmentRescheduled({
      name: job.data.name,
      email: job.data.email,
      appointmentCode: job.data.appointmentCode,
      serviceName: job.data.serviceName ?? 'Khám nha khoa',
      doctorName: job.data.doctorName ?? 'Bác sĩ phụ trách',
      oldScheduledAt: job.data.oldScheduledAt!,
      newScheduledAt: job.data.newScheduledAt!,
    });
  }

  @Process('send-appointment-cancelled')
  sendAppointmentCancelled(job: Job<MailJob>) {
    return this.mailService.sendAppointmentCancelled({
      name: job.data.name,
      email: job.data.email,
      appointmentCode: job.data.appointmentCode,
      serviceName: job.data.serviceName ?? 'Khám nha khoa',
      doctorName: job.data.doctorName ?? 'Bác sĩ phụ trách',
      scheduledAt: job.data.scheduledAt!,
      reason: job.data.reason,
    });
  }

  @Process('send-payment-receipt')
  sendPaymentReceipt(job: Job<any>) {
    return this.mailService.sendPaymentReceipt({
      name: job.data.name,
      email: job.data.email,
      invoiceCode: job.data.invoiceCode,
      amountPaid: job.data.amountPaid,
      totalAmount: job.data.totalAmount,
      remainingAmount: job.data.remainingAmount,
      paymentMethod: job.data.paymentMethod,
      items: job.data.items,
      paidAt: job.data.paidAt,
    });
  }

  @Process('send-payment-reminder')
  sendPaymentReminder(job: Job<any>) {
    return this.mailService.sendPaymentReminder({
      name: job.data.name,
      email: job.data.email,
      invoiceCode: job.data.invoiceCode,
      totalAmount: job.data.totalAmount,
      paidAmount: job.data.paidAmount,
      remainingAmount: job.data.remainingAmount,
      qrImageUrl: job.data.qrImageUrl,
      transferContent: job.data.transferContent,
      bankAccountNo: job.data.bankAccountNo,
      bankAccountName: job.data.bankAccountName,
      bankName: job.data.bankName,
    });
  }
}
