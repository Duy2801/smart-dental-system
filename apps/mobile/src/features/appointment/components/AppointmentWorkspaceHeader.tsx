import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

export type AppointmentWorkspaceMode = 'booking' | 'manage';

type AppointmentWorkspaceHeaderProps = {
  mode: AppointmentWorkspaceMode;
  title: string;
  subtitle?: string;
  onSelectBooking: () => void;
  onSelectManage: () => void;
};

export function AppointmentWorkspaceHeader({
  mode,
  title,
  subtitle,
  onSelectBooking,
  onSelectManage,
}: AppointmentWorkspaceHeaderProps) {
  return (
    <View className="mb-4">
      {/* Eyebrow Badge */}
      <View className="flex-row items-center">
        <View className="flex-row items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
          <FontAwesome6 color="#0058bc" iconStyle="solid" name="tooth" size={12} />
          <Text className="text-[11px] font-extrabold uppercase tracking-wider text-[#0058bc]">
            Đặt lịch khám nha khoa
          </Text>
        </View>
      </View>

      {/* Main Title & Subtitle */}
      <Text className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-xs text-slate-500 leading-4">
          {subtitle}
        </Text>
      ) : null}

      {/* Mode Switcher Tabs */}
      <View className="mt-4 flex-row rounded-2xl border border-slate-200 bg-white p-1 shadow-xs">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={mode === 'booking' ? undefined : onSelectBooking}
          style={[
            styles.tabButton,
            mode === 'booking' && styles.tabButtonActive,
          ]}
        >
          <FontAwesome6
            color={mode === 'booking' ? '#FFFFFF' : '#64748B'}
            iconStyle="solid"
            name="calendar-plus"
            size={13}
          />
          <Text
            style={[
              styles.tabText,
              mode === 'booking' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Đặt lịch mới
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={mode === 'manage' ? undefined : onSelectManage}
          style={[
            styles.tabButton,
            mode === 'manage' && styles.tabButtonActive,
          ]}
        >
          <FontAwesome6
            color={mode === 'manage' ? '#FFFFFF' : '#64748B'}
            iconStyle="solid"
            name="calendar-check"
            size={13}
          />
          <Text
            style={[
              styles.tabText,
              mode === 'manage' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Lịch khám của tôi
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 40,
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#0058bc',
    elevation: 2,
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    color: '#64748B',
  },
});
