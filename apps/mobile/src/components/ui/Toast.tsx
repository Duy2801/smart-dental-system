import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  duration: number;
  type: ToastType;
};

type ToastInput = {
  title: string;
  description?: string;
  duration?: number;
  type: ToastType;
};

type ToastListener = (toast: ToastItem) => void;

const listeners = new Set<ToastListener>();

function emitToast(input: ToastInput) {
  const item: ToastItem = {
    ...input,
    duration: input.duration ?? 3600,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };

  listeners.forEach(listener => listener(item));
}

export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    emitToast({ title, description, duration, type: 'success' }),
  error: (title: string, description?: string, duration?: number) =>
    emitToast({ title, description, duration, type: 'error' }),
  info: (title: string, description?: string, duration?: number) =>
    emitToast({ title, description, duration, type: 'info' }),
  warning: (title: string, description?: string, duration?: number) =>
    emitToast({ title, description, duration, type: 'warning' }),
};

const toastStyles: Record<
  ToastType,
  {
    accent: string;
    bg: string;
    border: string;
    icon: string;
    iconBg: string;
    iconName: string;
  }
> = {
  error: {
    accent: '#D92D20',
    bg: '#FFF7F6',
    border: '#FECDCA',
    icon: '#D92D20',
    iconBg: '#FEE4E2',
    iconName: 'triangle-exclamation',
  },
  info: {
    accent: '#0875D1',
    bg: '#F5FAFF',
    border: '#B9E6FE',
    icon: '#0875D1',
    iconBg: '#E0F2FE',
    iconName: 'circle-info',
  },
  success: {
    accent: '#0D9488',
    bg: '#F0FDFA',
    border: '#99F6E4',
    icon: '#0D9488',
    iconBg: '#CCFBF1',
    iconName: 'circle-check',
  },
  warning: {
    accent: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: '#D97706',
    iconBg: '#FEF3C7',
    iconName: 'bell',
  },
};

export function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const listener: ToastListener = item => {
      setItems(current => [item, ...current].slice(0, 3));
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const containerStyle = useMemo(
    () => [styles.container, { top: Math.max(insets.top + 10, 48) }],
    [insets.top],
  );

  return (
    <View pointerEvents="box-none" style={containerStyle}>
      {items.map(item => (
        <ToastCard
          item={item}
          key={item.id}
          onDone={() =>
            setItems(current =>
              current.filter(toastItem => toastItem.id !== item.id),
            )
          }
        />
      ))}
    </View>
  );
}

function ToastCard({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const translateX = useRef(new Animated.Value(340)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const closingRef = useRef(false);
  const palette = toastStyles[item.type];

  const close = useMemo(
    () => () => {
      if (closingRef.current) return;
      closingRef.current = true;

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 340,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(onDone);
    },
    [onDone, opacity, translateX],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 0,
        duration: item.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(close, item.duration);
    return () => clearTimeout(timer);
  }, [close, item.duration, opacity, progress, translateX]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: palette.accent }]} />
      <View style={[styles.iconBox, { backgroundColor: palette.iconBg }]}>
        <FontAwesome6
          color={palette.icon}
          iconStyle="solid"
          name={palette.iconName as never}
          size={15}
        />
      </View>

      <View style={styles.textCol}>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
        {item.description ? (
          <Text numberOfLines={2} style={styles.description}>
            {item.description}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
        onPress={close}
        style={styles.closeButton}
      >
        <FontAwesome6
          color="#64748B"
          iconStyle="solid"
          name="xmark"
          size={12}
        />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: palette.accent,
            transform: [{ scaleX: progress }],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  accent: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  card: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 8,
    flexDirection: 'row',
    marginBottom: 10,
    minHeight: 72,
    overflow: 'hidden',
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 10,
    paddingTop: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    width: 326,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginLeft: 8,
    width: 28,
  },
  container: {
    alignItems: 'flex-end',
    position: 'absolute',
    right: 12,
    zIndex: 1000,
  },
  description: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 13,
    height: 38,
    justifyContent: 'center',
    marginLeft: 2,
    width: 38,
  },
  progressBar: {
    bottom: 0,
    height: 3,
    left: 0,
    position: 'absolute',
    right: 0,
    transformOrigin: 'left',
  },
  textCol: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  title: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '900',
  },
});
