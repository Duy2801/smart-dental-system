import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import mailConfig from './mail.config';

type MailLocale = 'en' | 'vi';

@Injectable()
export class MailService {
  private readonly systemTransporter: Transporter;
  private readonly staffTransporter: Transporter;

  constructor(
    @Inject(mailConfig.KEY)
    private readonly config: ConfigType<typeof mailConfig>,
  ) {
    this.systemTransporter = nodemailer.createTransport(this.config.systemTransport);
    this.staffTransporter = nodemailer.createTransport(this.config.staffTransport);
  }

  private wrapHtmlTemplate(title: string, bodyContent: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 32px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                      🦷 SMART DENTAL CLINIC
                    </h1>
                    <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px; font-weight: 500;">
                      Hệ Thống Nha Khoa Thông Minh Chuẩn Quốc Tế
                    </p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 32px;">
                    ${bodyContent}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
                      📍 Hotline: <strong>1900 8888</strong> • Email: hotro@smartdental.com
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
                      Địa chỉ: Tòa nhà Y khoa Smart Dental, 123 Đường Sức Khỏe, TP. Hồ Chí Minh
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  sendOtp(data: {
    name: string;
    email: string;
    otp: string;
    locale: MailLocale;
  }) {
    const vietnamese = data.locale === 'vi';
    return this.systemTransporter.sendMail({
      from: this.config.systemFrom,
      to: data.email,
      subject: vietnamese
        ? 'Mã xác thực tài khoản Smart Dental'
        : 'Smart Dental account verification code',
      text: vietnamese
        ? `Xin chào ${data.name}, mã OTP của bạn là ${data.otp}. Mã có hiệu lực trong 3 phút.`
        : `Hello ${data.name}, your OTP is ${data.otp}. It expires in 3 minutes.`,
      html: this.wrapHtmlTemplate(
        'Mã xác thực tài khoản',
        `
          <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Mã xác thực tài khoản (OTP)</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Xin chào <strong>${data.name}</strong>, bạn đang thực hiện thao tác xác thực trên hệ thống Smart Dental.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 12px 28px; border-radius: 12px; border: 1px dashed #0284c7;">
              ${data.otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #64748b; text-align: center;">
            Mã xác thực có hiệu lực trong vòng <strong>3 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.
          </p>
        `,
      ),
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
    return this.systemTransporter.sendMail({
      from: this.config.systemFrom,
      to: data.email,
      subject: vietnamese ? 'Yêu cầu đặt lại mật khẩu' : 'Reset your password',
      text: vietnamese
        ? `Xin chào ${data.name}, mở liên kết sau để đặt lại mật khẩu: ${resetUrl}. Liên kết có hiệu lực trong 15 phút.`
        : `Hello ${data.name}, reset your password here: ${resetUrl}. The link expires in 15 minutes.`,
      html: this.wrapHtmlTemplate(
        'Đặt lại mật khẩu',
        `
          <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Yêu cầu đặt lại mật khẩu</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Xin chào <strong>${data.name}</strong>, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.3);">
              Đặt Lại Mật Khẩu
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; word-break: break-all;">
            Nếu nút trên không hoạt động, bạn hãy sao chép liên kết sau vào trình duyệt: <br>
            <a href="${resetUrl}" style="color: #0284c7;">${resetUrl}</a>
          </p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
            Liên kết này chỉ có hiệu lực trong vòng 15 phút.
          </p>
        `,
      ),
    });
  }

  sendAppointmentConfirmation(data: {
    name: string;
    email: string;
    appointmentCode?: string;
    serviceName: string;
    doctorName: string;
    scheduledAt: string;
    paymentLabel?: string;
    depositAmount?: number;
    locale?: MailLocale;
  }) {
    const vietnamese = (data.locale ?? 'vi') === 'vi';
    const timeFormatted = new Intl.DateTimeFormat(vietnamese ? 'vi-VN' : 'en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(data.scheduledAt));

    const code = data.appointmentCode || 'SD-' + Math.floor(100000 + Math.random() * 900000);

    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Xác nhận Lịch hẹn khám #${code}`,
      text: `Xin chào ${data.name}, lịch hẹn khám ${data.serviceName} với ${data.doctorName} vào lúc ${timeFormatted} đã được xác nhận thành công. Mã lịch hẹn: ${code}.`,
      html: this.wrapHtmlTemplate(
        'Xác nhận lịch hẹn khám',
        `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #047857; margin: 0; font-size: 18px;">✅ LỊCH HẸN ĐÃ ĐƯỢC XÁC NHẬN THÀNH CÔNG</h2>
            <p style="margin: 4px 0 0 0; color: #065f46; font-size: 13px;">Mã cuộc hẹn: <strong>${code}</strong></p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính gửi <strong>${data.name}</strong>, Smart Dental Clinic xin trân trọng thông báo lịch hẹn khám của Quý khách đã được tiếp nhận và xác nhận chính thức.
          </p>

          <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">🩺 Dịch vụ khám:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.serviceName}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">👨‍⚕️ Bác sĩ phụ trách:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.doctorName}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">⏰ Thời gian hẹn:</td>
              <td style="color: #0284c7; font-weight: 800; font-size: 14px;">${timeFormatted}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">📍 Địa điểm khám:</td>
              <td style="color: #0f172a;">Smart Dental Center, 123 Đường Sức Khỏe, Q.1, TP.HCM</td>
            </tr>
          </table>

          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; margin: 20px 0; font-size: 12px; color: #166534;">
            💡 <strong>Lưu ý:</strong> Quý khách vui lòng có mặt trước giờ hẹn <strong>10-15 phút</strong> để hoàn tất thủ tục check-in tiếp đón tại quầy lễ tân.
          </div>
        `,
      ),
    });
  }

  sendAppointmentReminder(data: {
    name: string;
    email: string;
    appointmentCode?: string;
    serviceName: string;
    doctorName: string;
    scheduledAt: string;
  }) {
    const timeFormatted = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(data.scheduledAt));

    const code = data.appointmentCode || 'SD-APT';

    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Nhắc Lịch Khám] Quý khách có lịch hẹn tại Smart Dental #${code}`,
      text: `Xin chào ${data.name}, Smart Dental xin nhắc nhở lịch hẹn khám ${data.serviceName} với ${data.doctorName} vào lúc ${timeFormatted}.`,
      html: this.wrapHtmlTemplate(
        'Nhắc lịch khám sắp tới',
        `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #1d4ed8; margin: 0; font-size: 18px;">⏰ NHẮC HẸN KHÁM NHA KHOA SẮP TỚI</h2>
            <p style="margin: 4px 0 0 0; color: #1e40af; font-size: 13px;">Mã hẹn: <strong>${code}</strong></p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Xin chào <strong>${data.name}</strong>, Smart Dental xin gửi lời nhắc về cuộc hẹn khám nha khoa sắp tới của Quý khách:
          </p>

          <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">🩺 Dịch vụ:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.serviceName}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">👨‍⚕️ Bác sĩ:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.doctorName}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">⏰ Giờ khám:</td>
              <td style="color: #2563eb; font-weight: 800; font-size: 15px;">${timeFormatted}</td>
            </tr>
          </table>

          <p style="font-size: 13px; color: #475569;">
            Nếu cần dời lịch hoặc hỗ trợ khẩn cấp, vui lòng liên hệ hotline <strong>1900 8888</strong>.
          </p>
        `,
      ),
    });
  }

  sendAppointmentRescheduled(data: {
    name: string;
    email: string;
    appointmentCode?: string;
    serviceName: string;
    doctorName: string;
    oldScheduledAt: string;
    newScheduledAt: string;
  }) {
    const oldTime = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(data.oldScheduledAt));

    const newTime = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(data.newScheduledAt));

    const code = data.appointmentCode || 'SD-APT';

    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Thông báo Đổi Lịch Hẹn Khám #${code}`,
      text: `Xin chào ${data.name}, lịch hẹn khám của bạn đã được dời từ ${oldTime} sang thời gian mới: ${newTime}.`,
      html: this.wrapHtmlTemplate(
        'Thông báo đổi lịch hẹn',
        `
          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #a16207; margin: 0; font-size: 18px;">🔄 THÔNG BÁO THAY ĐỔI LỊCH HẸN KHÁM</h2>
            <p style="margin: 4px 0 0 0; color: #854d0e; font-size: 13px;">Mã hẹn: <strong>${code}</strong></p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính gửi <strong>${data.name}</strong>, lịch hẹn khám nha khoa của Quý khách đã được cập nhật sang khung giờ mới thành công:
          </p>

          <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">🩺 Dịch vụ:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.serviceName} (${data.doctorName})</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #dc2626;">❌ Giờ hẹn cũ:</td>
              <td style="color: #dc2626; text-decoration: line-through;">${oldTime}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #16a34a; font-weight: bold;">✅ GIỜ HẸN MỚI:</td>
              <td style="color: #16a34a; font-weight: 800; font-size: 14px;">${newTime}</td>
            </tr>
          </table>
        `,
      ),
    });
  }

  sendAppointmentCancelled(data: {
    name: string;
    email: string;
    appointmentCode?: string;
    serviceName: string;
    doctorName: string;
    scheduledAt: string;
    reason?: string;
  }) {
    const timeFormatted = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(data.scheduledAt));

    const code = data.appointmentCode || 'SD-APT';

    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Xác nhận Hủy Lịch Hẹn #${code}`,
      text: `Xin chào ${data.name}, lịch hẹn khám vào lúc ${timeFormatted} đã được hủy. Lý do: ${data.reason || 'Theo yêu cầu'}.`,
      html: this.wrapHtmlTemplate(
        'Xác nhận hủy lịch hẹn',
        `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #b91c1c; margin: 0; font-size: 18px;">❌ LỊCH HẸN ĐÃ ĐƯỢC HỦY</h2>
            <p style="margin: 4px 0 0 0; color: #991b1b; font-size: 13px;">Mã hẹn: <strong>${code}</strong></p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính gửi <strong>${data.name}</strong>, lịch hẹn khám ${data.serviceName} vào lúc <strong>${timeFormatted}</strong> đã được hủy trên hệ thống.
          </p>

          ${
            data.reason
              ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #475569; margin: 16px 0;">
                  <strong>Lý do hủy:</strong> <em>"${data.reason}"</em>
                </div>`
              : ''
          }

          <p style="font-size: 13px; color: #475569;">
            Nếu Quý khách muốn đặt lại lịch hẹn mới, xin vui lòng truy cập website hoặc liên hệ hotline <strong>1900 8888</strong> để được hỗ trợ.
          </p>
        `,
      ),
    });
  }

  sendPaymentReceipt(data: {
    name: string;
    email: string;
    invoiceCode: string;
    amountPaid: number;
    totalAmount: number;
    remainingAmount: number;
    paymentMethod: string;
    items?: { name: string; qty: number; price: number }[];
    paidAt?: string;
  }) {
    const timeFormatted = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(data.paidAt ? new Date(data.paidAt) : new Date());

    const methodLabel =
      data.paymentMethod === 'BANK_TRANSFER'
        ? 'Chuyển khoản SePay VietQR'
        : 'Tiền mặt tại quầy';

    const itemsHtml =
      data.items && data.items.length > 0
        ? data.items
            .map(
              (it) => `
            <tr style="border-top: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${it.name}</td>
              <td style="padding: 8px 0; text-align: center; color: #64748b;">x${it.qty}</td>
              <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700;">
                ${new Intl.NumberFormat('vi-VN').format(it.price * it.qty)}đ
              </td>
            </tr>
          `,
            )
            .join('')
        : `
          <tr style="border-top: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">Dịch vụ nha khoa</td>
            <td style="padding: 8px 0; text-align: center; color: #64748b;">x1</td>
            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700;">
              ${new Intl.NumberFormat('vi-VN').format(data.amountPaid)}đ
            </td>
          </tr>
        `;

    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Biên lai thu tiền điện tử #${data.invoiceCode}`,
      text: `Xin chào ${data.name}, bạn đã thanh toán thành công ${new Intl.NumberFormat('vi-VN').format(data.amountPaid)}đ cho hóa đơn #${data.invoiceCode}.`,
      html: this.wrapHtmlTemplate(
        'Biên lai thu tiền điện tử',
        `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #047857; margin: 0; font-size: 18px;">🧾 BIÊN LAI THU TIỀN ĐIỆN TỬ (E-RECEIPT)</h2>
            <p style="margin: 4px 0 0 0; color: #065f46; font-size: 13px;">Hóa đơn số: <strong>#${data.invoiceCode}</strong> • ${timeFormatted}</p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính gửi <strong>${data.name}</strong>, Smart Dental Clinic xác nhận đã nhận khoản thanh toán của Quý khách với chi tiết như sau:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 13px; padding: 16px;">
            <thead>
              <tr style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">
                <th style="text-align: left; padding-bottom: 8px;">Dịch vụ / Thủ thuật</th>
                <th style="text-align: center; padding-bottom: 8px;">SL</th>
                <th style="text-align: right; padding-bottom: 8px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #cbd5e1;">
                <td colspan="2" style="padding-top: 12px; color: #475569; font-weight: 600;">Tổng giá trị hóa đơn:</td>
                <td style="padding-top: 12px; text-align: right; font-weight: 700; color: #0f172a;">
                  ${new Intl.NumberFormat('vi-VN').format(data.totalAmount)}đ
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 6px; color: #059669; font-weight: 700; font-size: 14px;">ĐÃ THANH TOÁN (KỲ NÀY):</td>
                <td style="padding-top: 6px; text-align: right; font-weight: 800; color: #059669; font-size: 15px;">
                  ${new Intl.NumberFormat('vi-VN').format(data.amountPaid)}đ
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 4px; color: #64748b; font-size: 12px;">Hình thức thanh toán:</td>
                <td style="padding-top: 4px; text-align: right; color: #475569; font-weight: 600; font-size: 12px;">
                  ${methodLabel}
                </td>
              </tr>
              ${
                data.remainingAmount > 0
                  ? `
                  <tr style="border-top: 1px dashed #cbd5e1;">
                    <td colspan="2" style="padding-top: 8px; color: #d97706; font-weight: 700;">Số tiền còn lại cần thanh toán:</td>
                    <td style="padding-top: 8px; text-align: right; font-weight: 800; color: #d97706;">
                      ${new Intl.NumberFormat('vi-VN').format(data.remainingAmount)}đ
                    </td>
                  </tr>
                  `
                  : `
                  <tr>
                    <td colspan="2" style="padding-top: 4px; color: #047857; font-size: 12px; font-weight: 600;">Trạng thái hóa đơn:</td>
                    <td style="padding-top: 4px; text-align: right; color: #047857; font-weight: 700; font-size: 12px;">
                      ĐÃ THANH TOÁN ĐỦ (100%)
                    </td>
                  </tr>
                  `
              }
            </tfoot>
          </table>

          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475569;">
            💡 Quý khách có thể sử dụng email biên lai này để đối chiếu thanh toán bảo hiểm sức khỏe tư nhân hoặc tra cứu lịch sử khám trên ứng dụng.
          </div>
        `,
      ),
    });
  }

  sendPaymentReminder(data: {
    name: string;
    email: string;
    invoiceCode: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    qrImageUrl?: string;
    transferContent?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
    bankName?: string;
  }) {
    const formattedRemaining = new Intl.NumberFormat('vi-VN').format(data.remainingAmount);

    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Thông báo Thanh toán & Hướng dẫn chuyển khoản #${data.invoiceCode}`,
      text: `Xin chào ${data.name}, hóa đơn #${data.invoiceCode} của bạn còn số dư nợ ${formattedRemaining}đ. Vui lòng thanh toán theo hướng dẫn.`,
      html: this.wrapHtmlTemplate(
        'Thông báo thanh toán',
        `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #1d4ed8; margin: 0; font-size: 18px;">💳 THÔNG BÁO THANH TOÁN DỊCH VỤ NHA KHOA</h2>
            <p style="margin: 4px 0 0 0; color: #1e40af; font-size: 13px;">Hóa đơn: <strong>#${data.invoiceCode}</strong></p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính gửi <strong>${data.name}</strong>, Smart Dental xin gửi thông báo chi tiết số dư thanh toán đợt khám của Quý khách:
          </p>

          <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 45%;">Tổng giá trị điều trị:</td>
              <td style="color: #0f172a; font-weight: 700; text-align: right;">${new Intl.NumberFormat('vi-VN').format(data.totalAmount)}đ</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">Đã thanh toán trước đó:</td>
              <td style="color: #059669; font-weight: 700; text-align: right;">${new Intl.NumberFormat('vi-VN').format(data.paidAmount)}đ</td>
            </tr>
            <tr style="border-top: 2px solid #cbd5e1;">
              <td style="color: #dc2626; font-weight: bold; font-size: 14px;">SỐ TIỀN CẦN THANH TOÁN:</td>
              <td style="color: #dc2626; font-weight: 800; font-size: 16px; text-align: right;">${formattedRemaining}đ</td>
            </tr>
          </table>

          ${
            data.qrImageUrl
              ? `
              <div style="text-align: center; margin: 24px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px dashed #0284c7;">
                <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #0369a1;">
                  Quét mã VietQR để thanh toán trực tuyến từ xa:
                </p>
                <img src="${data.qrImageUrl}" alt="Mã VietQR Thanh Toán" style="max-width: 220px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                <div style="margin-top: 12px; font-size: 12px; color: #475569; text-align: left; display: inline-block;">
                  <p style="margin: 2px 0;"><strong>Ngân hàng:</strong> ${data.bankName || 'MB Bank'}</p>
                  <p style="margin: 2px 0;"><strong>Số tài khoản:</strong> <span style="font-family: monospace; font-weight: bold;">${data.bankAccountNo || '123456789'}</span></p>
                  <p style="margin: 2px 0;"><strong>Chủ tài khoản:</strong> ${data.bankAccountName || 'SMART DENTAL CLINIC'}</p>
                  <p style="margin: 2px 0;"><strong>Nội dung:</strong> <span style="font-family: monospace; color: #0284c7; font-weight: bold;">${data.transferContent || data.invoiceCode}</span></p>
                </div>
              </div>
              `
              : ''
          }

          <p style="font-size: 13px; color: #64748b;">
            Hệ thống sẽ tự động cập nhật biên lai thanh toán ngay khi giao dịch chuyển khoản thành công.
          </p>
        `,
      ),
    });
  }

  sendRequestRescheduleApproved(data: {
    name: string;
    email: string;
    requestCode: string;
    serviceName: string;
    doctorName: string;
    newScheduledAt: string;
    note?: string;
  }) {
    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Yêu Cầu Đổi Lịch #${data.requestCode} Đã Được Duyệt`,
      text: `Xin chào ${data.name}, yêu cầu đổi lịch #${data.requestCode} đã được phê duyệt. Thời gian mới: ${data.newScheduledAt}.`,
      html: this.wrapHtmlTemplate(
        'Phê duyệt đổi lịch hẹn',
        `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #047857; margin: 0; font-size: 18px;">✅ YÊU CẦU ĐỔI LỊCH ĐÃ ĐƯỢC PHÊ DUYỆT</h2>
            <p style="margin: 4px 0 0 0; color: #065f46; font-size: 13px;">Mã yêu cầu: <strong>#${data.requestCode}</strong></p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính gửi <strong>${data.name}</strong>, Lễ tân Smart Dental đã xử lý và chấp thuận yêu cầu thay đổi lịch khám của Quý khách:
          </p>

          <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">🩺 Dịch vụ:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.serviceName}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">👨‍⚕️ Bác sĩ:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.doctorName}</td>
            </tr>
            <tr style="border-top: 2px solid #cbd5e1;">
              <td style="color: #059669; font-weight: bold;">⏰ THỜI GIAN MỚI:</td>
              <td style="color: #059669; font-weight: 800; font-size: 15px;">${data.newScheduledAt}</td>
            </tr>
          </table>

          ${
            data.note
              ? `
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #166534;">
                <strong>Ghi chú lễ tân:</strong> ${data.note}
              </div>
              `
              : ''
          }

          <p style="font-size: 13px; color: #64748b;">
            Quý khách vui lòng đến trước giờ khám 10-15 phút để làm thủ tục tiếp đón.
          </p>
        `,
      ),
    });
  }

  sendRequestRefundApproved(data: {
    name: string;
    email: string;
    requestCode: string;
    serviceName: string;
    refundAmount: number;
    refundPercent: number;
    note?: string;
  }) {
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(data.refundAmount);

    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Xác Nhận Hoàn Phí #${data.requestCode}`,
      text: `Xin chào ${data.name}, yêu cầu hoàn phí #${data.requestCode} (${formattedAmount}đ) đã được phê duyệt.`,
      html: this.wrapHtmlTemplate(
        'Phê duyệt hoàn phí',
        `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #047857; margin: 0; font-size: 18px;">💰 YÊU CẦU HOÀN TIỀN ĐÃ ĐƯỢC CHẤP THUẬN</h2>
            <p style="margin: 4px 0 0 0; color: #065f46; font-size: 13px;">Mã yêu cầu: <strong>#${data.requestCode}</strong></p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính gửi <strong>${data.name}</strong>, Smart Dental xin thông báo yêu cầu hoàn tiền phí tư vấn/đặt cọc của Quý khách đã được duyệt:
          </p>

          <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 45%;">Dịch vụ:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.serviceName}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">Mức hoàn theo chính sách:</td>
              <td style="color: #059669; font-weight: 700;">${data.refundPercent}%</td>
            </tr>
            <tr style="border-top: 2px solid #cbd5e1;">
              <td style="color: #059669; font-weight: bold; font-size: 14px;">SỐ TIỀN HOÀN LẠI:</td>
              <td style="color: #059669; font-weight: 800; font-size: 16px;">${formattedAmount}đ</td>
            </tr>
          </table>

          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #1e40af; margin: 16px 0;">
            ℹ️ Khoản tiền hoàn sẽ được chuyển về tài khoản ngân hàng của Quý khách trong vòng <strong>1-3 ngày làm việc</strong>.
          </div>

          ${
            data.note
              ? `
              <p style="font-size: 12px; color: #475569;">
                <strong>Ghi chú xử lý:</strong> ${data.note}
              </p>
              `
              : ''
          }
        `,
      ),
    });
  }

  sendRequestRejected(data: {
    name: string;
    email: string;
    requestCode: string;
    requestTypeLabel: string;
    reason: string;
  }) {
    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Thông Báo Xử Lý Yêu Cầu #${data.requestCode}`,
      text: `Xin chào ${data.name}, yêu cầu ${data.requestTypeLabel} #${data.requestCode} chưa được chấp thuận. Lý do: ${data.reason}.`,
      html: this.wrapHtmlTemplate(
        'Thông báo xử lý yêu cầu',
        `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="color: #b91c1c; margin: 0; font-size: 18px;">❌ YÊU CẦU CHƯA ĐƯỢC CHẤP THUẬN</h2>
            <p style="margin: 4px 0 0 0; color: #991b1b; font-size: 13px;">Mã yêu cầu: <strong>#${data.requestCode}</strong></p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính gửi <strong>${data.name}</strong>, Smart Dental rất tiếc phải thông báo yêu cầu <em>"${data.requestTypeLabel}"</em> của Quý khách không thể phê duyệt tại thời điểm này.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 16px 0; font-size: 13px; color: #475569;">
            <strong style="color: #0f172a;">Lý do phản hồi từ phòng khám:</strong><br />
            <span style="color: #b91c1c; font-style: italic; margin-top: 4px; display: inline-block;">"${data.reason}"</span>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Nếu có bất kỳ thắc mắc hoặc cần giải trình thêm, Quý khách vui lòng liên hệ hotline <strong>1900 8888</strong> để được bộ phận chăm sóc khách hàng hỗ trợ trực tiếp.
          </p>
        `,
      ),
    });
  }

  sendCheckInWelcome(data: {
    name: string;
    email: string;
    appointmentCode: string;
    queueNumber?: string;
    doctorName: string;
    roomName?: string;
    serviceName: string;
    checkedInAt?: string;
  }) {
    const timeFormatted = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(data.checkedInAt ? new Date(data.checkedInAt) : new Date());

    const queueNum = data.queueNumber || `#${data.appointmentCode.slice(-4)}`;
    const room = data.roomName || 'Phòng khám Chuyên khoa Nha';

    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Tiếp Nhận Thành Công - Số Thứ Tự ${queueNum}`,
      text: `Xin chào ${data.name}, bạn đã check-in thành công tại quầy tiếp đón. Số thứ tự: ${queueNum}. Bác sĩ: ${data.doctorName}.`,
      html: this.wrapHtmlTemplate(
        'Phiếu tiếp đón khám bệnh',
        `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0; color: #065f46; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">SỐ THỨ TỰ LƯỢT KHÁM</p>
            <h1 style="color: #047857; margin: 6px 0; font-size: 36px; font-family: monospace; font-weight: 900;">${queueNum}</h1>
            <p style="margin: 0; color: #065f46; font-size: 13px;">Mã hẹn: <strong>#${data.appointmentCode}</strong> • ${timeFormatted}</p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính chào <strong>${data.name}</strong>, quý khách đã hoàn tất thủ tục check-in tiếp đón tại quầy lễ tân:
          </p>

          <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">🩺 Dịch vụ khám:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.serviceName}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">👨‍⚕️ Bác sĩ điều trị:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.doctorName}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">📍 Khu vực khám:</td>
              <td style="color: #2563eb; font-weight: 700;">${room}</td>
            </tr>
          </table>

          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #1e40af;">
            🪑 <strong>Hướng dẫn:</strong> Quý khách vui lòng nghỉ ngơi tại sảnh chờ tầng 1. Điều dưỡng sẽ gọi tên hoặc số thứ tự khi ghế nha khoa đã sẵn sàng.
          </div>
        `,
      ),
    });
  }

  sendPatientWelcome(data: {
    name: string;
    email: string;
    patientCode: string;
    phone: string;
  }) {
    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Chào Mừng Thành Viên Mới - Mã Hồ Sơ Y Tế ${data.patientCode}`,
      text: `Xin chào ${data.name}, chào mừng bạn đến với Nha khoa Smart Dental! Mã hồ sơ bệnh nhân của bạn là ${data.patientCode}.`,
      html: this.wrapHtmlTemplate(
        'Chào mừng thành viên mới',
        `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0; color: #166534; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">HỒ SƠ Y TẾ KỸ THUẬT SỐ</p>
            <h1 style="color: #15803d; margin: 6px 0; font-size: 32px; font-family: monospace; font-weight: 900;">${data.patientCode}</h1>
            <p style="margin: 0; color: #166534; font-size: 13px;">Chủ hồ sơ: <strong>${data.name}</strong> • SĐT: ${data.phone}</p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính chào <strong>${data.name}</strong>, bộ phận Lễ tân xin chào mừng Quý khách gia nhập hệ thống chăm sóc sức khỏe răng miệng chất lượng cao tại <strong>Smart Dental</strong>.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0; font-size: 13px;">
            <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px;">🎁 Quyền lợi dành riêng cho bạn:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
              <li><strong>Khám tổng quát & Chụp X-quang:</strong> Miễn phí kiểm tra răng miệng định kỳ.</li>
              <li><strong>Lưu trữ bệnh án số trọn đời:</strong> Dễ dàng theo dõi tiến trình điều trị và đơn thuốc online.</li>
              <li><strong>Đặt lịch thông minh 24/7:</strong> Đặt hẹn và nhận nhắc lịch tự động trước giờ khám.</li>
            </ul>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Mọi thắc mắc hoặc cần tư vấn đặt lịch hẹn, Quý khách có thể liên hệ trực tiếp hotline <strong>1900 8888</strong>. Lễ tân Smart Dental luôn sẵn sàng phục vụ!
          </p>
        `,
      ),
    });
  }

  sendPeriodicCheckupReminder(data: {
    name: string;
    email: string;
    patientCode: string;
    lastVisitDate?: string;
  }) {
    const lastVisitText = data.lastVisitDate
      ? `Lần khám gần nhất: ${new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(data.lastVisitDate))}`
      : 'Đã hơn 6 tháng kể từ lần khám gần nhất';

    return this.staffTransporter.sendMail({
      from: this.config.receptionistFrom,
      to: data.email,
      subject: `[Smart Dental] Nhắc Lịch Khám Răng & Cạo Vôi Định Kỳ 6 Tháng`,
      text: `Xin chào ${data.name}, đã đến lúc chăm sóc nụ cười của bạn! Hãy đặt lịch tái khám định kỳ 6 tháng tại Smart Dental.`,
      html: this.wrapHtmlTemplate(
        'Nhắc lịch chăm sóc răng miệng định kỳ',
        `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0; color: #1e40af; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">CHĂM SÓC NỤ CƯỜI ĐỊNH KỲ</p>
            <h2 style="color: #1d4ed8; margin: 8px 0; font-size: 22px; font-weight: 800;">Đến Hẹn Khám Răng & Cạo Vôi 6 Tháng</h2>
            <p style="margin: 0; color: #2563eb; font-size: 13px;">Mã bệnh nhân: <strong>${data.patientCode}</strong> • ${lastVisitText}</p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Kính gửi <strong>${data.name}</strong>, theo khuyến nghị từ Hiệp hội Nha khoa, việc thăm khám và làm sạch vôi răng định kỳ mỗi <strong>6 tháng/lần</strong> giúp phát hiện sớm sâu răng, loại bỏ mảng bám và bảo vệ nướu chắc khỏe.
          </p>

          <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">🦷 Hạng mục đề xuất:</td>
              <td style="color: #0f172a; font-weight: 700;">Kiểm tra tổng quát + Cạo vôi & Đánh bóng răng</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">⏱️ Thời gian thực hiện:</td>
              <td style="color: #0f172a; font-weight: 700;">30 - 45 phút</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 24px 0;">
            <a href="http://localhost:3000/booking" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
              📅 Đặt Lịch Hẹn Khám Ngay
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center;">
            Hoặc liên hệ Hotline tiếp đón: <strong>1900 8888</strong> (Hỗ trợ 24/7)
          </p>
        `,
      ),
    });
  }

  sendPrescription(data: {
    name: string;
    email: string;
    patientCode: string;
    doctorName: string;
    diagnosis?: string | null;
    notes?: string | null;
    items: Array<{
      medicineName: string;
      dosage: string;
      frequency?: string | null;
      duration?: string | null;
      instruction?: string | null;
    }>;
    createdAt?: string;
  }) {
    const dateFormatted = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
    }).format(data.createdAt ? new Date(data.createdAt) : new Date());

    const itemsRows = data.items
      .map(
        (item, idx) => `
        <tr style="border-top: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="padding: 10px 12px; font-weight: 700; color: #0f172a; font-size: 13px;">
            ${idx + 1}. ${item.medicineName}
            ${item.instruction ? `<div style="font-weight: normal; color: #64748b; font-size: 11px; margin-top: 2px;">💡 ${item.instruction}</div>` : ''}
          </td>
          <td style="padding: 10px 12px; font-family: monospace; font-weight: 600; color: #334155; font-size: 12px; text-align: center;">
            ${item.dosage}
          </td>
          <td style="padding: 10px 12px; color: #0369a1; font-size: 12px; text-align: center; font-weight: 600;">
            ${item.frequency || 'Theo chỉ định'}
          </td>
          <td style="padding: 10px 12px; color: #475569; font-size: 12px; text-align: center;">
            ${item.duration || '—'}
          </td>
        </tr>
      `,
      )
      .join('');

    return this.staffTransporter.sendMail({
      from: this.config.doctorFrom,
      to: data.email,
      subject: `[Smart Dental] Toa Thuốc Điện Tử & Hướng Dẫn Điều Trị - ${data.doctorName}`,
      text: `Xin chào ${data.name}, ${data.doctorName} gửi bạn toa thuốc điện tử kèm hướng dẫn sử dụng.`,
      html: this.wrapHtmlTemplate(
        'Đơn thuốc điện tử',
        `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #166534; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">ĐƠN THUỐC ĐIỆN TỬ CHÍNH THỨC</p>
            <h2 style="color: #15803d; margin: 6px 0; font-size: 22px; font-weight: 800;">Toa Thuốc Khám Nha Khoa</h2>
            <p style="margin: 0; color: #166534; font-size: 13px;">Bác sĩ kê đơn: <strong>${data.doctorName}</strong> • ${dateFormatted}</p>
          </div>

          <table width="100%" cellpadding="6" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 30%;">👤 Bệnh nhân:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.name} (${data.patientCode})</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">🩺 Chẩn đoán:</td>
              <td style="color: #0369a1; font-weight: 700;">${data.diagnosis || 'Khám & Điều trị nha khoa'}</td>
            </tr>
            ${data.notes ? `
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">📝 Lời dặn của BS:</td>
              <td style="color: #b91c1c; font-style: italic; font-weight: 600;">"${data.notes}"</td>
            </tr>` : ''}
          </table>

          <h3 style="color: #0f172a; font-size: 14px; margin: 0 0 10px 0;">💊 Danh mục thuốc chỉ định:</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; font-weight: 700;">
                <th style="padding: 10px 12px; text-align: left;">Tên thuốc & Cách dùng</th>
                <th style="padding: 10px 12px; text-align: center; width: 80px;">Số lượng</th>
                <th style="padding: 10px 12px; text-align: center; width: 110px;">Liều dùng</th>
                <th style="padding: 10px 12px; text-align: center; width: 80px;">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 14px 16px; margin: 16px 0; font-size: 12px; color: #854d0e;">
            ⚠️ <strong>LƯU Ý AN TOÀN KHI DÙNG THUỐC:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 18px; line-height: 1.6;">
              <li>Uống thuốc đúng liều lượng, sau khi ăn no và uống cùng nhiều nước lọc.</li>
              <li>Nếu có kháng sinh, bắt buộc uống đủ số ngày, không tự ý ngưng khi vừa thấy giảm đau.</li>
              <li>Liên hệ ngay phòng khám hoặc hotline <strong>1900 8888</strong> nếu có triệu chứng dị ứng, nổi mẩn hoặc sưng đau bất thường.</li>
            </ul>
          </div>
        `,
      ),
    });
  }

  sendConsultationReminder(data: {
    name: string;
    email: string;
    patientCode: string;
    doctorName: string;
    scheduledAt: string;
    durationMinutes: number;
    meetingUrl: string;
    roomPin?: string | null;
  }) {
    const d = new Date(data.scheduledAt);
    const dateFormatted = new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
    const timeFormatted = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);

    return this.staffTransporter.sendMail({
      from: this.config.doctorFrom,
      to: data.email,
      subject: `[Smart Dental] Link Phòng Tư Vấn Video Call Trực Tuyến - ${data.doctorName}`,
      text: `Xin chào ${data.name}, ${data.doctorName} gửi bạn liên kết tham gia phòng tư vấn trực tuyến lúc ${timeFormatted}, ${dateFormatted}. Link: ${data.meetingUrl}`,
      html: this.wrapHtmlTemplate(
        'Phòng tư vấn trực tuyến',
        `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #1e40af; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">LỜI NHẮC BUỔI TƯ VẤN TRỰC TUYẾN</p>
            <h2 style="color: #1d4ed8; margin: 6px 0; font-size: 22px; font-weight: 800;">Phòng Khám Video Call 1-1</h2>
            <p style="margin: 0; color: #1e40af; font-size: 13px;">Bác sĩ phụ trách: <strong>${data.doctorName}</strong></p>
          </div>

          <table width="100%" cellpadding="6" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">👤 Bệnh nhân:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.name} (${data.patientCode})</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">⏰ Giờ tư vấn:</td>
              <td style="color: #0369a1; font-weight: 800; font-size: 14px;">${timeFormatted} - ${dateFormatted}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">⏱️ Thời lượng:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.durationMinutes} phút</td>
            </tr>
            ${data.roomPin ? `
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">🔒 Mã PIN phòng:</td>
              <td style="color: #b91c1c; font-weight: 800; font-family: monospace; font-size: 14px;">${data.roomPin}</td>
            </tr>` : ''}
          </table>

          <div style="text-align: center; margin: 26px 0;">
            <a href="${data.meetingUrl}" target="_blank" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(3, 105, 161, 0.25);">
              📹 Vào Phòng Tư Vấn Video Call
            </a>
          </div>

          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 14px 16px; margin: 16px 0; font-size: 12px; color: #854d0e;">
            💡 <strong>CHUẨN BỊ TRƯỚC BUỔI TƯ VẤN:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 18px; line-height: 1.6;">
              <li>Vui lòng kiểm tra quyền truy cập <strong>Camera và Micro</strong> trên trình duyệt của bạn.</li>
              <li>Chọn không gian đủ ánh sáng và yên tĩnh để bác sĩ quan sát rõ tình trạng răng miệng.</li>
              <li>Nên vào phòng sớm trước <strong>5 - 10 phút</strong> để đảm bảo đường truyền kết nối ổn định.</li>
            </ul>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center;">
            Nếu cần hỗ trợ kỹ thuật gấp, vui lòng gọi Hotline: <strong>1900 8888</strong>
          </p>
        `,
      ),
    });
  }

  sendTreatmentPlan(data: {
    name: string;
    email: string;
    patientCode: string;
    doctorName: string;
    title: string;
    description?: string | null;
    status: string;
    startDate?: string | null;
    expectedEndDate?: string | null;
    totalEstimatedCost: number;
    steps: {
      stepOrder: number;
      title: string;
      description?: string | null;
      targetTooth?: string | null;
      estimatedCost?: number | null;
      paymentAmount?: number | null;
      expectedDate?: string | null;
      status: string;
    }[];
  }) {
    const formattedTotalCost =
      Number(data.totalEstimatedCost || 0).toLocaleString('vi-VN') + ' đ';
    const startFormatted = data.startDate
      ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
          new Date(data.startDate),
        )
      : 'Chưa ấn định';
    const endFormatted = data.expectedEndDate
      ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
          new Date(data.expectedEndDate),
        )
      : 'Theo diễn tiến hồi phục';

    const stepsRows = (data.steps || [])
      .map((st) => {
        const stepCost =
          Number(st.estimatedCost || st.paymentAmount || 0).toLocaleString(
            'vi-VN',
          ) + ' đ';
        const stepDate = st.expectedDate
          ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(
              new Date(st.expectedDate),
            )
          : 'Theo lịch hẹn';
        const tooth = st.targetTooth
          ? `<span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 11px;">Răng: ${st.targetTooth}</span>`
          : '';

        return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 10px; font-weight: 800; color: #0284c7; font-size: 13px; text-align: center; width: 45px;">
            GĐ ${st.stepOrder}
          </td>
          <td style="padding: 12px 10px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${st.title}</div>
            ${tooth ? `<div style="margin-top: 4px;">${tooth}</div>` : ''}
            ${st.description ? `<div style="color: #64748b; font-size: 11px; margin-top: 3px;">${st.description}</div>` : ''}
          </td>
          <td style="padding: 12px 10px; text-align: center; font-size: 12px; color: #475569; width: 100px;">
            ${stepDate}
          </td>
          <td style="padding: 12px 10px; text-align: right; font-weight: 700; color: #0f172a; font-size: 13px; width: 120px;">
            ${stepCost}
          </td>
        </tr>
      `;
      })
      .join('');

    return this.staffTransporter.sendMail({
      from: this.config.doctorFrom,
      to: data.email,
      subject: `[Smart Dental] Kế Hoạch Điều Trị & Dự Toán Chi Phí - ${data.title}`,
      text: `Xin chào ${data.name}, Bác sĩ ${data.doctorName} gửi bạn Kế hoạch điều trị: ${data.title} với tổng dự toán chi phí: ${formattedTotalCost}. Vui lòng đăng nhập Cổng Bệnh Nhân để xem chi tiết lộ trình.`,
      html: this.wrapHtmlTemplate(
        'Kế hoạch điều trị & Dự toán chi phí',
        `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #15803d; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">KẾ HOẠCH ĐIỀU TRỊ CHUYÊN SÂU</p>
            <h2 style="color: #166534; margin: 6px 0; font-size: 20px; font-weight: 800;">${data.title}</h2>
            <p style="margin: 0; color: #166534; font-size: 13px;">Bác sĩ phụ trách: <strong>${data.doctorName}</strong></p>
          </div>

          <table width="100%" cellpadding="6" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">👤 Bệnh nhân:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.name} (${data.patientCode})</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">📅 Thời gian lộ trình:</td>
              <td style="color: #0f172a; font-weight: 600;">${startFormatted} ➔ ${endFormatted}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">💰 Tổng dự toán chi phí:</td>
              <td style="color: #0369a1; font-weight: 800; font-size: 15px;">${formattedTotalCost}</td>
            </tr>
            ${data.description ? `
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">📝 Mục tiêu & Chỉ định:</td>
              <td style="color: #334155; font-style: italic;">${data.description}</td>
            </tr>` : ''}
          </table>

          <p style="margin: 18px 0 8px 0; font-weight: 700; color: #0f172a; font-size: 14px;">
            📋 LỘ TRÌNH CÁC GIAI ĐOẠN ĐIỀU TRỊ (${data.steps.length} giai đoạn):
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; font-weight: 700;">
                <th style="padding: 10px; text-align: center; width: 45px;">GĐ</th>
                <th style="padding: 10px; text-align: left;">Nội dung thực hiện</th>
                <th style="padding: 10px; text-align: center; width: 100px;">Dự kiến</th>
                <th style="padding: 10px; text-align: right; width: 120px;">Chi phí ước tính</th>
              </tr>
            </thead>
            <tbody>
              ${stepsRows}
            </tbody>
          </table>

          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 14px 16px; margin: 16px 0; font-size: 12px; color: #854d0e;">
            💡 <strong>CHÍNH SÁCH THANH TOÁN & BẢO LÃNH VIỆN PHÍ:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 18px; line-height: 1.6;">
              <li>Chi phí trên là dự toán tiêu chuẩn, được thanh toán linh hoạt chia nhỏ theo từng giai đoạn thực hiện.</li>
              <li>Phòng khám hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng hoặc cọc trước theo phác đồ bác sĩ tư vấn.</li>
              <li>Mọi điều chỉnh về vật liệu sứ / trụ Implant / mắc cài sẽ được trao đổi và bệnh nhân đồng thuận trước khi thực hiện.</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 26px 0;">
            <a href="${this.config.frontendUrl}/dashboard/treatment-plans" target="_blank" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(3, 105, 161, 0.25);">
              📲 Xem Chi Tiết Trên Cổng Bệnh Nhân
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 16px;">
            Nếu bạn có bất kỳ thắc mắc nào về phác đồ, vui lòng liên hệ trực tiếp Bác sĩ hoặc Hotline CSKH: <strong>1900 8888</strong>.
          </p>
        `,
      ),
    });
  }

  sendAftercare(data: {
    name: string;
    email: string;
    patientCode: string;
    doctorName: string;
    diagnosis?: string | null;
    serviceName?: string | null;
    content: string;
  }) {
    return this.staffTransporter.sendMail({
      from: this.config.doctorFrom,
      to: data.email,
      subject: `[Smart Dental] Hướng Dẫn Chăm Sóc Răng Miệng Sau Điều Trị - ${data.doctorName}`,
      text: `Xin chào ${data.name}, Bác sĩ ${data.doctorName} gửi bạn hướng dẫn chăm sóc sau điều trị. Nội dung: ${data.content}`,
      html: this.wrapHtmlTemplate(
        'Hướng dẫn sau điều trị',
        `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #15803d; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">HƯỚNG DẪN CHĂM SÓC RĂNG MIỆNG</p>
            <h2 style="color: #166534; margin: 6px 0; font-size: 20px; font-weight: 800;">Chăm Sóc Sau Điều Trị</h2>
            <p style="margin: 0; color: #166534; font-size: 13px;">Bác sĩ phụ trách: <strong>${data.doctorName}</strong></p>
          </div>

          <table width="100%" cellpadding="6" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">👤 Bệnh nhân:</td>
              <td style="color: #0f172a; font-weight: 700;">${data.name} (${data.patientCode})</td>
            </tr>
            ${data.diagnosis ? `
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">🩺 Chuẩn đoán:</td>
              <td style="color: #0f172a; font-weight: 600;">${data.diagnosis}</td>
            </tr>` : ''}
            ${data.serviceName ? `
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: #64748b;">🦷 Dịch vụ thực hiện:</td>
              <td style="color: #0369a1; font-weight: 700;">${data.serviceName}</td>
            </tr>` : ''}
          </table>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; font-size: 13px; line-height: 1.7; color: #1e293b; white-space: pre-line;">
            ${data.content}
          </div>

          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 14px 16px; margin: 16px 0; font-size: 12px; color: #854d0e;">
            🚨 <strong>KHI NÀO CẦN TÁI KHÁM GẤP:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 18px; line-height: 1.6;">
              <li>Chảy máu kéo dài không cầm sau 2-3 giờ cắn gạc.</li>
              <li>Đau nhức dữ dội không giảm dù đã uống thuốc giảm đau theo đơn.</li>
              <li>Sốt cao trên 38.5°C hoặc sưng phù mặt bất thường.</li>
            </ul>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 16px;">
            Hotline cấp cứu & hỗ trợ nha khoa 24/7: <strong>1900 8888</strong>.
          </p>
        `,
      ),
    });
  }
}
