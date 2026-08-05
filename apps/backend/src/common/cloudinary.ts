import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

function cloudCreds(config: ConfigService) {
  const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
  const apiKey = config.get<string>('CLOUDINARY_API_KEY');
  const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
  if (!cloudName || !apiKey || !apiSecret) {
    throw new BadRequestException(
      'Chưa cấu hình Cloudinary (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).',
    );
  }
  return { cloudName, apiKey, apiSecret };
}

function sign(params: Record<string, string>, apiSecret: string) {
  const payload =
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&') + apiSecret;
  return createHash('sha1').update(payload).digest('hex');
}

/** Upload buffer ảnh lên Cloudinary (REST, không cần SDK). */
export async function uploadImageBuffer(
  config: ConfigService,
  buffer: Buffer,
  opts: { folder: string; publicId?: string },
): Promise<string> {
  const { cloudName, apiKey, apiSecret } = cloudCreds(config);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const toSign: Record<string, string> = {
    folder: opts.folder,
    timestamp,
  };
  if (opts.publicId) toSign.public_id = opts.publicId;

  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' }),
    `${opts.publicId || 'upload'}.jpg`,
  );
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('folder', opts.folder);
  if (opts.publicId) form.append('public_id', opts.publicId);
  form.append('signature', sign(toSign, apiSecret));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  const data = (await res.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.secure_url) {
    throw new BadRequestException(
      data.error?.message || `Upload Cloudinary thất bại (HTTP ${res.status})`,
    );
  }
  return data.secure_url;
}
