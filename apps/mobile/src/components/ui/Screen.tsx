import React from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  StatusBar,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TABLET_CONTENT_MAX_WIDTH, useResponsive } from '~src/hooks/useResponsive';

type ScreenProps = {
  children: React.ReactNode;
  className?: string;
};

export function Screen({ children, className = '' }: ScreenProps) {
  const { isTablet } = useResponsive();

  return (
    // left/right: tránh tai thỏ / camera đục lỗ khi máy nằm ngang (tablet, máy gập)
    <SafeAreaView edges={['top', 'left', 'right']} className={`flex-1 bg-background ${className}`}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FC" />
      {/* Trên tablet, giữ nội dung ở một cột giữa màn hình để không bị kéo giãn quá rộng */}
      <View
        style={
          isTablet
            ? { alignSelf: 'center', flex: 1, maxWidth: TABLET_CONTENT_MAX_WIDTH, width: '100%' }
            : { flex: 1 }
        }
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

type ScreenListProps<T> = FlatListProps<T> & {
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function ScreenList<T>({
  contentContainerStyle,
  onRefresh,
  refreshing,
  ...props
}: ScreenListProps<T>) {
  const { gutter } = useResponsive();

  return (
    <FlatList
      contentContainerStyle={[
        { padding: gutter + 2, paddingBottom: 120, gap: 14 },
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            colors={['#0875D1']}
            onRefresh={onRefresh}
            refreshing={Boolean(refreshing)}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}

export function ScreenContent({ children, className = '' }: ScreenProps) {
  const { gutter } = useResponsive();

  return (
    <View className={`pt-3 ${className}`} style={{ paddingHorizontal: gutter + 2 }}>
      {children}
    </View>
  );
}
