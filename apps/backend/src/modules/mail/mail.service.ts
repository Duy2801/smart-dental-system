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

  sendAppointmentConfirmation(data: {
    name: string;
    email: string;
    serviceName: string;
    doctorName: string;
    scheduledAt: string;
    paymentLabel: string;
    depositAmount?: number;
    locale: MailLocale;
  }) {
    const vietnamese = data.locale === 'vi';
    const time = new Intl.DateTimeFormat(vietnamese ? 'vi-VN' : 'en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(data.scheduledAt));
    const depositLine =
      data.depositAmount && data.depositAmount > 0
        ? vietnamese
          ? `So tien coc: ${new Intl.NumberFormat('vi-VN').format(data.depositAmount)} VND.`
          : `Deposit amount: ${new Intl.NumberFormat('en-US').format(data.depositAmount)} VND.`
        : '';

    return this.transporter.sendMail({
      from: this.config.from,
      to: data.email,
      subject: vietnamese
        ? 'Xac nhan yeu cau dat lich Smart Dental'
        : 'Smart Dental appointment request confirmation',
      text: vietnamese
        ? [
            `Xin chao ${data.name},`,
            `Smart Dental da nhan yeu cau dat lich cua ban.`,
            `Dich vu: ${data.serviceName}.`,
            `Bac si: ${data.doctorName}.`,
            `Thoi gian: ${time}.`,
            `Cach giu lich: ${data.paymentLabel}.`,
            depositLine,
            'Phong kham se tiep tuc xu ly va thong bao khi lich duoc xac nhan.',
          ]
            .filter(Boolean)
            .join('\n')
        : [
            `Hello ${data.name},`,
            'Smart Dental has received your appointment request.',
            `Service: ${data.serviceName}.`,
            `Doctor: ${data.doctorName}.`,
            `Time: ${time}.`,
            `Booking hold option: ${data.paymentLabel}.`,
            depositLine,
            'The clinic will continue processing and notify you when the appointment is confirmed.',
          ]
            .filter(Boolean)
            .join('\n'),
    });
  }
}
