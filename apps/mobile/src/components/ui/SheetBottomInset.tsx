import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Đặt ở cuối các bảng trượt từ dưới lên (bottom sheet) để nội dung và nút bấm
 * không bị thanh vuốt Home (iPhone) hoặc thanh điều hướng cử chỉ (Android) che mất.
 * Nền của bảng vẫn kéo dài xuống sát mép màn hình.
 */
export function SheetBottomInset({ extra = 0 }: { extra?: number }) {
  const insets = useSafeAreaInsets();
  const height = insets.bottom + extra;
  if (height <= 0) return null;
  return <View pointerEvents="none" style={{ height }} />;
}
