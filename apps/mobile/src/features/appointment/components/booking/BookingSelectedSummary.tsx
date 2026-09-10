import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import type {
  AppointmentService,
  BookingDate,
  Dentist,
  PatientProfile,
  TreatmentMethodItem,
} from '../../types';

type BookingSelectedSummaryProps = {
  selectedPatient?: PatientProfile;
  selectedService?: AppointmentService;
  selectedMethod?: TreatmentMethodItem;
  selectedDate?: BookingDate;
  selectedTime?: string;
  selectedDoctor?: Dentist;
};

export function BookingSelectedSummary({
  selectedPatient,
  selectedService,
  selectedMethod,
  selectedDate,
  selectedTime,
  selectedDoctor,
}: BookingSelectedSummaryProps) {
  const hasAnySelection =
    Boolean(selectedPatient) ||
    Boolean(selectedService) ||
    Boolean(selectedDate && selectedTime) ||
    Boolean(selectedDoctor);

  if (!hasAnySelection) return null;

  return (
    <View className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
      <View className="flex-row items-center gap-1.5 mb-2">
        <FontAwesome6 color="#0058bc" iconStyle="solid" name="circle-info" size={12} />
        <Text className="text-xs font-black text-[#0058bc]">
          Thông tin đã chọn:
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {selectedPatient ? (
          <View className="flex-row items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs">
            <FontAwesome6 color="#64748B" iconStyle="solid" name="user" size={11} />
            <Text className="text-xs font-bold text-slate-800">
              {selectedPatient.fullName}
            </Text>
          </View>
        ) : null}

        {selectedService ? (
          <View className="flex-row items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs">
            <FontAwesome6 color="#64748B" iconStyle="solid" name="stethoscope" size={11} />
            <Text className="text-xs font-bold text-slate-800">
              {selectedService.name}
              {selectedMethod ? ` (${selectedMethod.name})` : ''}
            </Text>
          </View>
        ) : null}

        {selectedDate && selectedTime ? (
          <View className="flex-row items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs">
            <FontAwesome6 color="#64748B" iconStyle="solid" name="calendar-days" size={11} />
            <Text className="text-xs font-bold text-slate-800">
              {selectedDate.weekday}, {selectedDate.day}/{selectedDate.month} lúc {selectedTime}
            </Text>
          </View>
        ) : null}

        {selectedDoctor ? (
          <View className="flex-row items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs">
            <FontAwesome6 color="#64748B" iconStyle="solid" name="user-doctor" size={11} />
            <Text className="text-xs font-bold text-slate-800">
              BS. {selectedDoctor.name}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
