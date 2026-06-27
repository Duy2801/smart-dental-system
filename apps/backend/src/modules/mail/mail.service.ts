import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import mailConfig from './mail.config';

type MailLocale = 'en' | 'vi';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;

  constructor(
    @Inject(mailConfig.KEY)
    private readonly config: ConfigType<typeof mailConfig>,
  ) {
    this.transporter = nodemailer.createTransport(this.config.transport);
  }

  sendOtp(data: {
    name: string;
    email: string;
    otp: string;
    locale: MailLocale;
  }) {
    const vietnamese = data.locale === 'vi';
    return this.transporter.sendMail({
      from: this.config.from,
      to: data.email,
      subject: vietnamese
        ? 'Mã xác thực tài khoản'
        : 'Account verification code',
      text: vietnamese
        ? `Xin chào ${data.name}, mã OTP của bạn là ${data.otp}. Mã có hiệu lực trong 3 phút.`
        : `Hello ${data.name}, your OTP is ${data.otp}. It expires in 3 minutes.`,
    });
  }

  sendPasswordReset(data: {
    name: string;
    email: string;
    token: string;
    locale: MailLocale;
  }) {
    const resetUrl = `${this.config.frontendUrl}/reset-password?token=${encodeURIComponent(data.token)}`;
    const vietnamese = data.locale === 'vi';
    return this.transporter.sendMail({
      from: this.config.from,
      to: data.email,
      subject: vietnamese ? 'Đặt lại mật khẩu' : 'Reset your password',
      text: vietnamese
        ? `Xin chào ${data.name}, mở liên kết sau để đặt lại mật khẩu: ${resetUrl}. Liên kết có hiệu lực trong 15 phút.`
        : `Hello ${data.name}, reset your password here: ${resetUrl}. The link expires in 15 minutes.`,
    });
  }
}
