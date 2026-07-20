import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailService } from './mail.service';

type MailJob = {
  name: string;
  email: string;
  locale: 'en' | 'vi';
  otp?: string;
  token?: string;
  serviceName?: string;
  doctorName?: string;
  scheduledAt?: string;
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
    });
  }

  @Process('send-password-reset')
  sendPasswordReset(job: Job<MailJob>) {
    return this.mailService.sendPasswordReset({
      ...job.data,
      token: job.data.token!,
    });
  }

  @Process('send-appointment-confirmation')
  sendAppointmentConfirmation(job: Job<MailJob>) {
    return this.mailService.sendAppointmentConfirmation({
      name: job.data.name,
      email: job.data.email,
      locale: job.data.locale,
      serviceName: job.data.serviceName!,
      doctorName: job.data.doctorName!,
      scheduledAt: job.data.scheduledAt!,
      paymentLabel: job.data.paymentLabel!,
      depositAmount: job.data.depositAmount,
    });
  }
}
