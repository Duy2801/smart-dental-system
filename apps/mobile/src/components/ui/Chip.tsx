import React from 'react';
import { Chip as PaperChip } from 'react-native-paper';

type ChipStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'warning' | 'neutral';

type ChipProps = {
  label: string;
  status?: ChipStatus;
  icon?: string;
  className?: string;
  onPress?: () => void;
};

const chipClassName: Record<ChipStatus, string> = {
  confirmed: 'bg-emerald-50 border-emerald-200',
  pending: 'bg-amber-50 border-amber-200',
  cancelled: 'bg-red-50 border-red-200',
  completed: 'bg-sky-50 border-sky-200',
  warning: 'bg-orange-50 border-orange-200',
  neutral: 'bg-slate-100 border-slate-200',
};

export function Chip({
  className = '',
  icon,
  label,
  onPress,
  status = 'neutral',
}: ChipProps) {
  return (
    <PaperChip
      compact
      icon={icon}
      mode="outlined"
      onPress={onPress}
      className={`self-start rounded-full ${chipClassName[status]} ${className}`}
      textStyle={{ fontSize: 11, fontWeight: '800' }}
    >
      {label}
    </PaperChip>
  );
}
