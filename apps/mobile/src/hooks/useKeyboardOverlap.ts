import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, type View } from 'react-native';

/**
 * Khoảng bàn phím ảo đang che lên phần dưới của một khung (Android).
 *
 * Từ Android 15 app chạy tràn viền (edge-to-edge) nên `adjustResize` không còn thu nhỏ màn hình
 * và `KeyboardAvoidingView behavior="height"` tính sai → ô nhập bị bàn phím che.
 * Hook đo trực tiếp phần khung bị bàn phím đè lên để đệm đúng bằng khoảng đó; nếu hệ thống
 * đã tự thu nhỏ màn hình thì khoảng che bằng 0, không bị đệm thừa.
 *
 * Trên iOS trả về 0 — vẫn dùng KeyboardAvoidingView behavior="padding" như cũ.
 */
export function useKeyboardOverlap() {
  const containerRef = useRef<View>(null);
  const [overlap, setOverlap] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const show = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardVisible(true);
      const keyboardTop = event.endCoordinates.screenY;
      const node = containerRef.current;
      if (!node) {
        setOverlap(event.endCoordinates.height);
        return;
      }
      node.measureInWindow((_x, y, _width, height) => {
        setOverlap(Math.max(0, Math.round(y + height - keyboardTop)));
      });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setOverlap(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { containerRef, keyboardOverlap: overlap, keyboardVisible };
}
