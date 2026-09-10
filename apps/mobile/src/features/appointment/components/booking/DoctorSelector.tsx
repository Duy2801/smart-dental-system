import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from '~src/components/ui';
import type { Dentist } from '../../types';

type DoctorSelectorProps = {
  doctors: Dentist[];
  selectedId: string;
  isCheckingAvailability?: boolean;
  canReview: boolean;
  onSelect: (id: string) => void;
  onBack: () => void;
  onOpenReview: () => void;
};

const DOCTOR_TONES = {
  blue: { bg: '#EFF6FF', text: '#1D4ED8' },
  cyan: { bg: '#ECFEFF', text: '#0E7490' },
  violet: { bg: '#F5F3FF', text: '#6D28D9' },
};

export function DoctorSelector({
  doctors = [],
  selectedId,
  isCheckingAvailability,
  canReview,
  onSelect,
  onBack,
  onOpenReview,
}: DoctorSelectorProps) {
  const safeDoctors = Array.isArray(doctors) ? doctors : [];

  return (
    <View className="space-y-5">
      {/* Header */}
      <View className="border-b border-slate-100 pb-3">
        <Text className="text-base font-black text-slate-900">
          4. Chọn bác sĩ phụ trách
        </Text>
        <Text className="mt-0.5 text-xs text-slate-500">
          Chọn bác sĩ chuyên khoa phụ trách khám và tư vấn trực tiếp.
        </Text>
      </View>

      {/* Doctor Cards */}
      {safeDoctors.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 items-center justify-center">
          <FontAwesome6 color="#94A3B8" iconStyle="solid" name="user-doctor" size={24} />
          <Text className="mt-2 text-xs font-bold text-slate-600 text-center">
            Không có bác sĩ trong khung giờ này.
          </Text>
          <Text className="mt-1 text-[11px] text-slate-400 text-center">
            Vui lòng quay lại chọn ngày hoặc khung giờ khác.
          </Text>
        </View>
      ) : (
        <View className="gap-2.5">
          {safeDoctors.map(doctor => {
            const isSelected = selectedId === doctor.id;
            const tone = DOCTOR_TONES[doctor.tone] || DOCTOR_TONES.blue;

            return (
              <TouchableOpacity
                key={doctor.id}
                activeOpacity={0.85}
                onPress={() => onSelect(doctor.id)}
                style={[
                  styles.doctorCard,
                  isSelected && styles.doctorCardSelected,
                ]}
              >
                <View className="flex-row items-center gap-3 min-w-0 flex-1">
                  <View
                    style={[
                      styles.avatarBadge,
                      { backgroundColor: tone.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        { color: tone.text },
                      ]}
                    >
                      {doctor.initials}
                    </Text>
                  </View>

                  <View className="min-w-0 flex-1">
                    <Text
                      numberOfLines={1}
                      className={`text-sm font-black ${
                        isSelected ? 'text-[#0058bc]' : 'text-slate-900'
                      }`}
                    >
                      BS. {doctor.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="mt-0.5 text-xs text-slate-500"
                    >
                      {doctor.specialty}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      <FontAwesome6 color="#F59E0B" iconStyle="solid" name="award" size={10} />
                      <Text className="text-[10px] font-extrabold text-amber-600">
                        {doctor.experience} kinh nghiệm
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Radio Selection Indicator */}
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Action Buttons: Back + Review */}
      <View className="flex-row gap-2.5 pt-3 border-t border-slate-100">
        <Button
          variant="outline"
          onPress={onBack}
          className="flex-1"
        >
          Quay lại
        </Button>
        <Button
          disabled={!canReview || Boolean(isCheckingAvailability)}
          onPress={onOpenReview}
          className="flex-1"
        >
          {isCheckingAvailability ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text className="text-white text-xs font-bold">Kiểm tra...</Text>
            </View>
          ) : (
            'Đến bước xác nhận'
          )}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarBadge: {
    alignItems: 'center',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  doctorCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  doctorCardSelected: {
    backgroundColor: '#F8FAFC',
    borderColor: '#0058bc',
    elevation: 2,
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  radioInner: {
    backgroundColor: '#0058bc',
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    marginLeft: 10,
    width: 20,
  },
  radioOuterSelected: {
    borderColor: '#0058bc',
  },
});
