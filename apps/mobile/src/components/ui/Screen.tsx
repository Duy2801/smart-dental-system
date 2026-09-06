import React from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  StatusBar,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: React.ReactNode;
  className?: string;
};

export function Screen({ children, className = '' }: ScreenProps) {
  return (
    <SafeAreaView edges={['top']} className={`flex-1 bg-background ${className}`}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FC" />
      {children}
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
  return (
    <FlatList
      contentContainerStyle={[{ padding: 18, paddingBottom: 120, gap: 14 }, contentContainerStyle]}
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
  return <View className={`px-[18px] pt-3 ${className}`}>{children}</View>;
}
