import React from 'react';
import { View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function ScreenHeader({
  eyebrow,
  onBack,
  right,
  subtitle,
  title,
}: ScreenHeaderProps) {
  return (
    <View className="bg-background px-[18px] pb-2 pt-2">
      <View className="min-h-11 flex-row items-center">
        {onBack ? <Appbar.BackAction onPress={onBack} /> : null}
        <View className="min-w-0 flex-1">
          {eyebrow ? (
            <Text className="text-xs font-extrabold uppercase text-primary">
              {eyebrow}
            </Text>
          ) : null}
          <Text numberOfLines={2} className="text-[26px] font-black text-slate-950">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[13px] leading-5 text-muted">{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}
