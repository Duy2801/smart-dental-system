import { useMemo } from 'react';
import { PixelRatio, useWindowDimensions } from 'react-native';

/**
 * Các mốc chiều rộng màn hình (đơn vị dp):
 * - small  : < 360  → máy nhỏ (iPhone SE 1, Android 5"), cần thu gọn khoảng cách & chữ
 * - medium : 360–413 → phần lớn điện thoại phổ thông (thiết kế chuẩn theo 375)
 * - large  : 414–599 → máy lớn (Pro Max, Ultra, Plus)
 * - tablet : ≥ 600   → máy tính bảng / máy gập mở ra
 */
export const BREAKPOINTS = {
  small: 360,
  large: 414,
  tablet: 600,
} as const;

/** Chiều rộng thiết kế gốc của giao diện */
const BASE_WIDTH = 375;

/** Nội dung không giãn quá rộng trên máy tính bảng để vẫn dễ đọc */
export const TABLET_CONTENT_MAX_WIDTH = 720;

export type ScreenSize = 'small' | 'medium' | 'large' | 'tablet';

export function getScreenSize(width: number): ScreenSize {
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  if (width >= BREAKPOINTS.large) return 'large';
  if (width < BREAKPOINTS.small) return 'small';
  return 'medium';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Thông tin kích thước màn hình hiện tại + các hàm co giãn.
 * Tự cập nhật khi xoay máy, chia đôi màn hình hoặc mở/gập máy gập.
 */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();

  return useMemo(() => {
    const size = getScreenSize(width);
    const isSmall = size === 'small';
    const isTablet = size === 'tablet';
    // Màn hình thấp (máy nhỏ hoặc có thanh điều hướng lớn): nên giảm chiều cao ảnh/khối trang trí
    const isShort = height < 680;

    // Chiều rộng thực sự dùng để bày nội dung (trên tablet bị giới hạn ở giữa)
    const contentWidth = isTablet ? Math.min(width, TABLET_CONTENT_MAX_WIDTH) : width;
    const ratio = clamp(contentWidth / BASE_WIDTH, 0.86, 1.15);

    /** Co giãn kích thước (khoảng cách, icon, ảnh) theo chiều rộng màn hình */
    const scale = (value: number) => PixelRatio.roundToNearestPixel(value * ratio);
    /** Co giãn cỡ chữ nhẹ hơn để chữ không quá to trên máy lớn */
    const fontSize = (value: number) =>
      PixelRatio.roundToNearestPixel(value * clamp(ratio, 0.92, 1.08));

    return {
      width,
      height,
      fontScale,
      size,
      isSmall,
      isLarge: size === 'large',
      isTablet,
      isShort,
      contentWidth,
      /** Lề ngang chuẩn của màn hình */
      gutter: isSmall ? 12 : isTablet ? 24 : 16,
      /** Số cột cho lưới thẻ (dịch vụ, bác sĩ…) */
      columns: isTablet ? 3 : 2,
      scale,
      fontSize,
    };
  }, [width, height, fontScale]);
}
