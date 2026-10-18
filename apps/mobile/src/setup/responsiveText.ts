/**
 * Co giãn cỡ chữ toàn app theo màn hình — chạy MỘT LẦN, trước khi bất kỳ màn hình nào được nạp
 * (được import ở dòng đầu tiên của index.js).
 *
 * Toàn bộ giao diện được thiết kế theo điện thoại rộng ~390dp với cỡ chữ cố định (fontSize: 12, 13…).
 * Trên máy hẹp hơn hoặc khi người dùng bật cỡ chữ hệ thống lớn, chữ bị tràn khỏi nút / thẻ.
 * File này:
 *  1. Thu nhỏ nhẹ fontSize & lineHeight trên máy hẹp (tối đa còn 86%), giữ nguyên trên máy ≥ 390dp.
 *  2. Giảm bớt mức phóng to theo cài đặt "Cỡ chữ" của hệ thống: chữ vẫn to hơn (≈ căn bậc hai của
 *     mức người dùng chọn) để hỗ trợ người cần chữ lớn, nhưng không phình gấp đôi làm vỡ bố cục.
 *  3. Áp dụng cùng tỉ lệ cho các lớp Tailwind/NativeWind (text-xs, text-sm…) qua `rem`.
 */
import { rem } from 'nativewind';
import { Dimensions, PixelRatio, StyleSheet } from 'react-native';

/** Chiều rộng thiết kế gốc */
const BASE_WIDTH = 390;
/** Không thu nhỏ chữ quá mức này để vẫn dễ đọc */
const MIN_WIDTH_FACTOR = 0.86;
/** rem mặc định của NativeWind */
const BASE_REM = 14;

function computeTextScale() {
  const { width, height } = Dimensions.get('screen');
  // App khoá màn hình dọc → cạnh ngắn chính là chiều rộng khi dùng
  const shortSide = Math.min(width, height);
  const widthFactor = Math.min(1, Math.max(MIN_WIDTH_FACTOR, shortSide / BASE_WIDTH));

  // React Native sẽ tự nhân cỡ chữ với fontScale; bù lại một phần để mức tăng thực tế là √fontScale
  const fontScale = PixelRatio.getFontScale();
  const fontScaleCompensation = fontScale > 1 ? 1 / Math.sqrt(fontScale) : 1;

  return widthFactor * fontScaleCompensation;
}

export const TEXT_SCALE = computeTextScale();

const roundHalf = (value: number) => Math.round(value * 2) / 2;

type AnyStyle = Record<string, unknown>;

function scaleStyle(style: AnyStyle): AnyStyle {
  if (!style || typeof style !== 'object') return style;
  const hasFont = typeof style.fontSize === 'number';
  const hasLineHeight = typeof style.lineHeight === 'number';
  if (!hasFont && !hasLineHeight) return style;

  const next: AnyStyle = { ...style };
  if (hasFont) next.fontSize = roundHalf((style.fontSize as number) * TEXT_SCALE);
  if (hasLineHeight) next.lineHeight = Math.round((style.lineHeight as number) * TEXT_SCALE);
  return next;
}

/** Chỉ cài đặt khi thực sự cần thu nhỏ (máy hẹp hoặc cỡ chữ hệ thống lớn) */
if (TEXT_SCALE < 0.999) {
  const originalCreate = StyleSheet.create.bind(StyleSheet) as (styles: AnyStyle) => AnyStyle;

  // StyleSheet.create của React Native chỉ trả lại chính object style → bọc lại để co cỡ chữ
  (StyleSheet as unknown as { create: (styles: AnyStyle) => AnyStyle }).create = (styles: AnyStyle) => {
    const scaled: AnyStyle = {};
    for (const key of Object.keys(styles)) {
      scaled[key] = scaleStyle(styles[key] as AnyStyle);
    }
    return originalCreate(scaled);
  };

  rem.set(roundHalf(BASE_REM * TEXT_SCALE));
}
