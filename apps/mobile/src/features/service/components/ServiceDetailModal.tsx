import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { formatServicePrice } from '../api';
import type { DentalService, TreatmentMethod } from '../types';

type ServiceDetailModalProps = {
  visible: boolean;
  service: DentalService | null;
  method: TreatmentMethod | null;
  onClose: () => void;
  onBook: (service: DentalService, method: TreatmentMethod) => void;
};

export function ServiceDetailModal({
  visible,
  service,
  method,
  onClose,
  onBook,
}: ServiceDetailModalProps) {
  if (!visible || !service || !method) return null;

  const imageUrl = method.imageUrl || method.media?.[0]?.url || service.image;
  const procedureSteps =
    method.procedureSteps && method.procedureSteps.length > 0
      ? method.procedureSteps
      : service.procedureSteps ?? [];

  const suitableFor = service.suitableFor ?? [];
  const includedItems = service.includedItems ?? [];
  const preparationNotes = service.preparationNotes ?? [];
  const aftercareNotes = service.aftercareNotes ?? [];

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header bar */}
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-[10px] font-black uppercase tracking-wider text-[#0863c5]">
                {service.title}
              </Text>
              <Text numberOfLines={1} className="text-base font-black text-slate-900">
                {method.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
            >
              <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={14} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, paddingTop: 12 }}
          >
            {/* Hero Image / Banner */}
            {imageUrl ? (
              <View className="h-44 w-full overflow-hidden rounded-2xl bg-slate-100 mb-3">
                <Image
                  source={{ uri: imageUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              </View>
            ) : null}

            {/* Price & Duration banner */}
            <View className="rounded-2xl bg-blue-50/80 p-4 border border-blue-100/80 mb-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[11px] font-bold text-slate-500 uppercase">
                    Chi phí trọn gói
                  </Text>
                  <Text className="mt-0.5 text-xl font-black text-[#0863c5]">
                    {formatServicePrice(method.basePrice)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[11px] font-bold text-slate-500 uppercase">
                    Thời lượng khám
                  </Text>
                  <View className="mt-1 flex-row items-center rounded-full bg-white px-2.5 py-1 border border-blue-200">
                    <FontAwesome6 color="#0863c5" iconStyle="solid" name="clock" size={11} />
                    <Text className="ml-1.5 text-xs font-black text-[#0863c5]">
                      {method.durationMinutes ?? 30} phút
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-xs font-black uppercase text-slate-400">
                Tổng quan phương pháp
              </Text>
              <Text className="mt-1.5 text-xs leading-5 text-slate-600">
                {method.description || service.description}
              </Text>
            </View>

            {/* Procedure Steps (Quy trình thực hiện) */}
            {procedureSteps.length > 0 ? (
              <View className="mb-4">
                <Text className="text-xs font-black uppercase text-slate-400 mb-2">
                  Quy trình thực hiện ({procedureSteps.length} bước)
                </Text>
                <View className="space-y-2.5">
                  {procedureSteps.map((step, idx) => (
                    <View
                      key={step.id || idx}
                      className="flex-row items-start rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                    >
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-[#0863c5] mr-3">
                        <Text className="text-[11px] font-black text-white">
                          {idx + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs font-black text-slate-900">
                            {step.title}
                          </Text>
                          {step.durationMinutes ? (
                            <Text className="text-[10px] font-semibold text-slate-400">
                              {step.durationMinutes}p
                            </Text>
                          ) : null}
                        </View>
                        {step.description ? (
                          <Text className="mt-1 text-[11px] leading-4 text-slate-500">
                            {step.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Suitable For */}
            {suitableFor.length > 0 ? (
              <View className="mb-4">
                <Text className="text-xs font-black uppercase text-slate-400 mb-1.5">
                  Đối tượng phù hợp
                </Text>
                {suitableFor.map((item, idx) => (
                  <View key={idx} className="flex-row items-center py-1">
                    <FontAwesome6 color="#10B981" iconStyle="solid" name="check" size={11} />
                    <Text className="ml-2 text-xs text-slate-600">{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Included Items */}
            {includedItems.length > 0 ? (
              <View className="mb-4">
                <Text className="text-xs font-black uppercase text-slate-400 mb-1.5">
                  Gói điều trị bao gồm
                </Text>
                {includedItems.map((item, idx) => (
                  <View key={idx} className="flex-row items-center py-1">
                    <FontAwesome6 color="#0863c5" iconStyle="solid" name="circle-check" size={11} />
                    <Text className="ml-2 text-xs text-slate-600">{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Preparation & Aftercare Notes */}
            {preparationNotes.length > 0 || aftercareNotes.length > 0 ? (
              <View className="mb-2 rounded-xl bg-amber-50/70 border border-amber-200/60 p-3">
                <View className="flex-row items-center mb-1">
                  <FontAwesome6 color="#D97706" iconStyle="solid" name="circle-info" size={12} />
                  <Text className="ml-1.5 text-xs font-black text-amber-900">
                    Lưu ý từ nha sĩ
                  </Text>
                </View>
                {preparationNotes.map((note, idx) => (
                  <Text key={`prep-${idx}`} className="text-[11px] leading-4 text-amber-800">
                    • Chuẩn bị: {note}
                  </Text>
                ))}
                {aftercareNotes.map((note, idx) => (
                  <Text key={`after-${idx}`} className="mt-1 text-[11px] leading-4 text-amber-800">
                    • Sau điều trị: {note}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>

          {/* Sticky CTA Bottom Button */}
          <View className="border-t border-slate-100 pt-3">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onBook(service, method);
              }}
              className="h-12 items-center justify-center rounded-xl bg-[#0863c5] shadow-md"
            >
              <Text className="text-sm font-black text-white">
                Đặt lịch khám ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
  },
  modalOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    flex: 1,
    justifyContent: 'flex-end',
  },
});
