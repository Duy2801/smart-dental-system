import type { DentalFinding } from "./dental-xray-analyzer";

export const MAX_XRAY_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_XRAY_PIXELS = 25_000_000;
export const ACCEPTED_XRAY_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateXrayFile(file: File): string | null {
  if (!(ACCEPTED_XRAY_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.";
  }

  if (file.size > MAX_XRAY_FILE_BYTES) {
    return "Ảnh X-quang không được vượt quá 10 MB.";
  }

  return null;
}

export function validateXraySignature(bytes: Uint8Array, declaredType: string): string | null {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const signatureMatches =
    (declaredType === "image/jpeg" && isJpeg) ||
    (declaredType === "image/png" && isPng) ||
    (declaredType === "image/webp" && isWebp);

  return signatureMatches ? null : "Nội dung tệp không khớp với định dạng ảnh đã khai báo.";
}

export function validateXrayDimensions(width: number, height: number): string | null {
  if (width < 256 || height < 128) {
    return "Ảnh có kích thước pixel quá nhỏ để phân tích an toàn.";
  }

  if (width * height > MAX_XRAY_PIXELS) {
    return "Ảnh không được vượt quá 25 triệu pixel.";
  }

  return null;
}

export async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Không thể đọc nội dung ảnh."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function getVisibleFindings(
  findings: DentalFinding[],
  selectedTypes: Record<string, boolean>,
): Array<{ finding: DentalFinding; originalIndex: number }> {
  return findings
    .map((finding, originalIndex) => ({ finding, originalIndex }))
    .filter(({ finding }) => selectedTypes[finding.findingType] !== false);
}
