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

  @Process('send-request-reschedule-approved')
  sendRequestRescheduleApproved(job: Job<any>) {
    return this.mailService.sendRequestRescheduleApproved({
      name: job.data.name,
      email: job.data.email,
      requestCode: job.data.requestCode,
      serviceName: job.data.serviceName,
      doctorName: job.data.doctorName,
      newScheduledAt: job.data.newScheduledAt,
      note: job.data.note,
    });
  }

  @Process('send-request-refund-approved')
  sendRequestRefundApproved(job: Job<any>) {
    return this.mailService.sendRequestRefundApproved({
      name: job.data.name,
      email: job.data.email,
      requestCode: job.data.requestCode,
      serviceName: job.data.serviceName,
      refundAmount: job.data.refundAmount,
      refundPercent: job.data.refundPercent,
      note: job.data.note,
    });
  }

  @Process('send-request-rejected')
  sendRequestRejected(job: Job<any>) {
    return this.mailService.sendRequestRejected({
      name: job.data.name,
      email: job.data.email,
      requestCode: job.data.requestCode,
      requestTypeLabel: job.data.requestTypeLabel,
      reason: job.data.reason,
    });
  }

  @Process('send-check-in-welcome')
  sendCheckInWelcome(job: Job<any>) {
    return this.mailService.sendCheckInWelcome({
      name: job.data.name,
      email: job.data.email,
      appointmentCode: job.data.appointmentCode,
      queueNumber: job.data.queueNumber,
      doctorName: job.data.doctorName,
      roomName: job.data.roomName,
      serviceName: job.data.serviceName,
      checkedInAt: job.data.checkedInAt,
    });
  }

  @Process('send-patient-welcome')
  sendPatientWelcome(job: Job<any>) {
    return this.mailService.sendPatientWelcome({
      name: job.data.name,
      email: job.data.email,
      patientCode: job.data.patientCode,
      phone: job.data.phone,
    });
  }

  @Process('send-periodic-checkup-reminder')
  sendPeriodicCheckupReminder(job: Job<any>) {
    return this.mailService.sendPeriodicCheckupReminder({
      name: job.data.name,
      email: job.data.email,
      patientCode: job.data.patientCode,
      lastVisitDate: job.data.lastVisitDate,
    });
  }

  @Process('send-prescription')
  sendPrescription(job: Job<any>) {
    return this.mailService.sendPrescription({
      name: job.data.name,
      email: job.data.email,
      patientCode: job.data.patientCode,
      doctorName: job.data.doctorName,
      diagnosis: job.data.diagnosis,
      notes: job.data.notes,
      items: job.data.items,
      createdAt: job.data.createdAt,
    });
  }

  @Process('send-consultation-reminder')
  sendConsultationReminder(job: Job<any>) {
    return this.mailService.sendConsultationReminder({
      name: job.data.name,
      email: job.data.email,
      patientCode: job.data.patientCode,
      doctorName: job.data.doctorName,
      scheduledAt: job.data.scheduledAt,
      durationMinutes: job.data.durationMinutes,
      meetingUrl: job.data.meetingUrl,
      roomPin: job.data.roomPin,
    });
  }

  @Process('send-treatment-plan')
  sendTreatmentPlan(job: Job<any>) {
    return this.mailService.sendTreatmentPlan({
      name: job.data.name,
      email: job.data.email,
      patientCode: job.data.patientCode,
      doctorName: job.data.doctorName,
      title: job.data.title,
      description: job.data.description,
      status: job.data.status,
      startDate: job.data.startDate,
      expectedEndDate: job.data.expectedEndDate,
      totalEstimatedCost: job.data.totalEstimatedCost,
      steps: job.data.steps,
    });
  }

  @Process('send-aftercare')
  sendAftercare(job: Job<any>) {
    return this.mailService.sendAftercare({
      name: job.data.name,
      email: job.data.email,
      patientCode: job.data.patientCode,
      doctorName: job.data.doctorName,
      diagnosis: job.data.diagnosis,
      serviceName: job.data.serviceName,
      content: job.data.content,
    });
  }
}
