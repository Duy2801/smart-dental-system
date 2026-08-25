import { registerAs } from '@nestjs/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export default registerAs('mail', () => {
  const systemUser = required('EMAIL_EMAIL_PASSUSER');
  const systemPass = required('EMAIL_EMAIL_PASSWORD');

  const staffUser = process.env.STAFF_MAIL_USER?.trim() || 'duchaunguyen131@gmail.com';
  const staffPass = process.env.STAFF_MAIL_PASSWORD?.trim() || systemPass;

  const frontendUrl = required('FRONTEND_URL');
  const parsedUrl = new URL(frontendUrl);

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('FRONTEND_URL must use http or https');
  }

  return {
    systemTransport: {
      service: 'gmail',
      auth: {
        user: systemUser,
        pass: systemPass,
      },
    },
    staffTransport: {
      service: 'gmail',
      auth: {
        user: staffUser,
        pass: staffPass,
      },
    },
    systemFrom: `Smart Dental System <${systemUser}>`,
    receptionistFrom: `Lễ Tân Smart Dental - Nguyễn Đức Hậu <${staffUser}>`,
    doctorFrom: `BS. Nguyễn Đức Hậu - Smart Dental <${staffUser}>`,
    frontendUrl: frontendUrl.replace(/\/$/, ''),
  };
});
