import { registerAs } from '@nestjs/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export default registerAs('mail', () => {
  const user = required('EMAIL_EMAIL_PASSUSER');
  const frontendUrl = required('FRONTEND_URL');
  const parsedUrl = new URL(frontendUrl);

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('FRONTEND_URL must use http or https');
  }

  return {
    transport: {
      service: 'gmail',
      auth: {
        user,
        pass: required('EMAIL_EMAIL_PASSWORD'),
      },
    },
    from: process.env.MAIL_FROM?.trim() || user,
    frontendUrl: frontendUrl.replace(/\/$/, ''),
  };
});
