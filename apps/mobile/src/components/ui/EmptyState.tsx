import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from './Button';

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  actionLabel,
  description,
  icon = 'circle-info',
  onAction,
  title,
}: EmptyStateProps) {
  return (
    <View className="items-center rounded-2xl border border-border bg-surface p-7">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
        <FontAwesome6 color="#0875D1" iconStyle="solid" name={icon as never} size={25} />
      </View>
      <Text className="mt-4 text-center text-base font-black text-slate-950">{title}</Text>
      {description ? (
        <Text className="mt-2 text-center text-[13px] leading-5 text-muted">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button onPress={onAction} className="mt-5 self-stretch">
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
