import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailService } from './mail.service';

type MailJob = {
  name: string;
  email: string;
  locale: 'en' | 'vi';
  otp?: string;
  token?: string;
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
}
