import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from '~src/components/ui';
import {
  calculateDiscount,
  formatCurrency,
  formatTimeRange,
  isPromotionApplicable,
  pickBestPromotion,
} from '../../api';
import type {
  AppointmentService,
  BookingDate,
  Dentist,
  PatientProfile,
  PromotionDto,
  TreatmentMethodItem,
} from '../../types';

type BookingConfirmationViewProps = {
  acceptedTerms: boolean;
  isSubmitting: boolean;
  onBackToEdit: () => void;
  onConfirmBooking: (promotionCode?: string) => void;
  onSelectPromotionCode: (code: string) => void;
  onToggleTerms: (accepted: boolean) => void;
  promotions: PromotionDto[];
  selectedDate?: BookingDate;
  selectedDoctor?: Dentist;
  selectedPatient?: PatientProfile;
  selectedPromotionCode: string;
  selectedService?: AppointmentService;
  selectedTime: string;
  selectedTreatmentMethod?: TreatmentMethodItem;
};

export function BookingConfirmationView({
  selectedPatient,
  selectedService,
  selectedTreatmentMethod,
  selectedDoctor,
  selectedDate,
  selectedTime,
  promotions,
  selectedPromotionCode,
  onSelectPromotionCode,
  acceptedTerms,
  onToggleTerms,
  isSubmitting,
  onConfirmBooking,
  onBackToEdit,
}: BookingConfirmationViewProps) {
  const [showPromoModal, setShowPromoModal] = useState(false);
  const basePrice = selectedTreatmentMethod?.rawPrice ?? 0;

  const availablePromotions = useMemo(
    () =>
      (Array.isArray(promotions) ? promotions : []).filter(promotion =>
        isPromotionApplicable(promotion, {
          basePrice,
          serviceId: selectedService?.id,
          treatmentMethodId: selectedTreatmentMethod?.id,
        }),
      ),
    [basePrice, promotions, selectedService?.id, selectedTreatmentMethod?.id],
  );

  const autoPromotion = useMemo(
    () => pickBestPromotion(availablePromotions, basePrice),
    [availablePromotions, basePrice],
  );

  const manualCode = selectedPromotionCode.trim();
  const manualPromotion = manualCode
    ? availablePromotions.find(
        promotion => promotion.code.toLowerCase() === manualCode.toLowerCase(),
      ) ?? null
    : null;
  const appliedPromotion = manualCode ? manualPromotion : autoPromotion;
  const discountResult = appliedPromotion
    ? calculateDiscount(appliedPromotion, basePrice)
    : { discountAmount: 0, finalPrice: basePrice };
  const timeRangeString = formatTimeRange(
    selectedTime,
    selectedTreatmentMethod?.durationMinutes || 30,
  );

  return (
    <View className="space-y-3">
      <View style={styles.serviceBanner}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <View className="self-start rounded-md bg-white/15 px-2.5 py-1">
              <Text className="text-[10px] font-black uppercase tracking-wider text-blue-100">
                Dịch vụ đã chọn
              </Text>
            </View>
            <Text numberOfLines={2} className="mt-2 text-lg font-black text-white">
              {selectedService?.name || 'Chưa chọn dịch vụ'}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-base font-black text-white">
              {formatCurrency(basePrice)}
            </Text>
            {selectedTreatmentMethod?.durationMinutes ? (
              <Text className="mt-1 text-[11px] font-bold text-blue-100">
                {selectedTreatmentMethod.durationMinutes} phút
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mt-3 border-t border-white/20 pt-2">
          <Text numberOfLines={1} className="text-xs text-blue-100 font-medium">
            Phương pháp:{' '}
            <Text className="font-bold text-white">
              {selectedTreatmentMethod?.name || '--'}
            </Text>
          </Text>
        </View>
      </View>

      <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-xs font-black uppercase tracking-wider text-slate-700">
              Ưu đãi áp dụng
            </Text>
            <Text className="mt-1 text-[11px] text-slate-500">
              Hệ thống tự chọn mã tốt nhất, bạn vẫn có thể đổi mã.
            </Text>
          </View>
          {appliedPromotion ? (
            <View className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
              <Text className="text-[11px] font-black text-emerald-700">
                {appliedPromotion.code}
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="mt-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
          onPress={() => setShowPromoModal(true)}
        >
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <FontAwesome6
              color="#0058bc"
              iconStyle="solid"
              name="ticket"
              size={13}
            />
            <Text numberOfLines={1} className="text-xs font-bold text-slate-800">
              {appliedPromotion
                ? `${appliedPromotion.code} - ${appliedPromotion.name}`
                : 'Chọn hoặc đổi mã giảm giá'}
            </Text>
          </View>
          <FontAwesome6
            color="#94A3B8"
            iconStyle="solid"
            name="chevron-right"
            size={11}
          />
        </TouchableOpacity>

        {appliedPromotion ? (
          <Text className="mt-2 text-xs font-bold text-emerald-700">
            Đã áp dụng: Giảm {formatCurrency(discountResult.discountAmount)}
          </Text>
        ) : null}

        <View className="mt-3 gap-2 rounded-xl bg-slate-50 p-3">
          <View className="flex-row justify-between gap-3">
            <Text className="text-xs text-slate-500">Giá dịch vụ</Text>
            <Text className="text-xs font-bold text-slate-900">
              {formatCurrency(basePrice)}
            </Text>
          </View>
          <View className="flex-row justify-between gap-3">
            <Text className="text-xs text-slate-500">Giảm giá</Text>
            <Text className="text-xs font-bold text-emerald-600">
              -{formatCurrency(discountResult.discountAmount)}
            </Text>
          </View>
          <View className="flex-row justify-between gap-3 border-t border-slate-200 pt-2">
            <Text className="text-sm font-black text-slate-900">
              Thanh toán tại quầy
            </Text>
            <Text className="text-base font-black text-[#0058bc]">
              {formatCurrency(discountResult.finalPrice)}
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-2.5">
        <SummaryCard
          icon="user"
          iconColor="#0058bc"
          iconTone="sky"
          label="Người khám"
          title={selectedPatient?.fullName || 'Chưa chọn'}
          subtitle={`Quan hệ: ${selectedPatient?.relationship || 'PATIENT'}`}
        />
        <SummaryCard
          icon="user-doctor"
          iconColor="#0058bc"
          iconTone="blue"
          label="Bác sĩ phụ trách"
          title={
            selectedDoctor ? `BS. ${selectedDoctor.name}` : 'BS phòng khám sắp xếp'
          }
          subtitle={selectedDoctor?.specialty || 'Chuyên khoa tổng quát'}
        />
        <SummaryCard
          icon="calendar-check"
          iconColor="#059669"
          iconTone="emerald"
          label="Thời gian khám"
          title={
            selectedDate
              ? `${selectedDate.weekday}, ${selectedDate.day}/${selectedDate.month}`
              : '--/--'
          }
          subtitle={`Khung giờ: ${timeRangeString}`}
          subtitleClassName="text-[11px] font-bold text-[#0058bc]"
        />
      </View>

      <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <View className="mb-2.5 flex-row items-center justify-between border-b border-slate-100 pb-2">
          <Text className="text-xs font-black uppercase tracking-wider text-[#0058bc]">
            Quy định đặt lịch
          </Text>
          <View className="rounded-full bg-blue-50 px-2 py-0.5">
            <Text className="text-[10px] font-black text-[#0058bc]">Lưu ý</Text>
          </View>
        </View>

        <View className="gap-2">
          <RuleText
            label="Giữ lịch:"
            text="Lịch hẹn được ghi nhận ngay sau khi xác nhận."
          />
          <RuleText
            label="Thanh toán:"
            text="Thanh toán tại quầy lễ tân khi đến khám."
          />
          <RuleText
            label="Hóa đơn:"
            text="Lễ tân lập hóa đơn dịch vụ sau khi hoàn tất khám."
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="mt-3 flex-row items-center gap-3 border-t border-slate-100 pt-3"
          onPress={() => onToggleTerms(!acceptedTerms)}
        >
          <View
            style={[
              styles.checkBox,
              acceptedTerms && styles.checkBoxChecked,
            ]}
          >
            {acceptedTerms ? (
              <FontAwesome6
                color="#FFFFFF"
                iconStyle="solid"
                name="check"
                size={11}
              />
            ) : null}
          </View>
          <Text className="flex-1 text-xs leading-4 text-slate-700">
            Tôi đã kiểm tra kỹ thông tin và đồng ý với quy định của phòng khám.
          </Text>
        </TouchableOpacity>
      </View>

      <View className="gap-2.5 pt-2">
        <Button
          className="w-full"
          disabled={!acceptedTerms || isSubmitting}
          onPress={() => onConfirmBooking(appliedPromotion?.code)}
        >
          {isSubmitting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text className="text-xs font-bold text-white">
                Đang xử lý đặt lịch...
              </Text>
            </View>
          ) : (
            'Xác nhận đặt lịch ngay'
          )}
        </Button>

        <Button className="w-full" onPress={onBackToEdit} variant="outline">
          Quay lại chỉnh sửa
        </Button>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setShowPromoModal(false)}
        transparent
        visible={showPromoModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-black text-slate-900">
                Chọn mã khuyến mãi
              </Text>
              <TouchableOpacity
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
                onPress={() => setShowPromoModal(false)}
              >
                <FontAwesome6
                  color="#64748B"
                  iconStyle="solid"
                  name="xmark"
                  size={14}
                />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-3 space-y-2" showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                className={`rounded-xl border p-3 ${
                  !selectedPromotionCode
                    ? 'border-[#0058bc] bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
                onPress={() => {
                  onSelectPromotionCode('');
                  setShowPromoModal(false);
                }}
              >
                <Text className="text-xs font-black text-[#0058bc]">
                  Tự động áp dụng mã tốt nhất
                </Text>
                {autoPromotion ? (
                  <Text className="mt-0.5 text-[11px] text-slate-500">
                    Mã gợi ý: {autoPromotion.code} - Giảm{' '}
                    {formatCurrency(
                      calculateDiscount(autoPromotion, basePrice).discountAmount,
                    )}
                  </Text>
                ) : null}
              </TouchableOpacity>

              {availablePromotions.map(promo => {
                const discount = calculateDiscount(promo, basePrice).discountAmount;
                const isSelected =
                  selectedPromotionCode.toLowerCase() === promo.code.toLowerCase();

                return (
                  <TouchableOpacity
                    className={`mt-2 rounded-xl border p-3 ${
                      isSelected
                        ? 'border-[#0058bc] bg-blue-50'
                        : 'border-slate-200 bg-white'
                    }`}
                    key={promo.id}
                    onPress={() => {
                      onSelectPromotionCode(promo.code);
                      setShowPromoModal(false);
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-black text-slate-900">
                        {promo.code}
                      </Text>
                      <Text className="text-xs font-bold text-emerald-600">
                        - {formatCurrency(discount)}
                      </Text>
                    </View>
                    <Text numberOfLines={1} className="mt-1 text-xs text-slate-600">
                      {promo.name}
                    </Text>
                    {promo.description ? (
                      <Text
                        numberOfLines={2}
                        className="mt-0.5 text-[11px] text-slate-400"
                      >
                        {promo.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type SummaryCardProps = {
  icon: string;
  iconColor: string;
  iconTone: 'blue' | 'emerald' | 'sky';
  label: string;
  subtitle: string;
  subtitleClassName?: string;
  title: string;
};

function SummaryCard({
  icon,
  iconColor,
  iconTone,
  label,
  title,
  subtitle,
  subtitleClassName = 'text-[11px] text-slate-500',
}: SummaryCardProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
      <View style={[styles.summaryIcon, styles[`${iconTone}Icon`]]}>
        <FontAwesome6
          color={iconColor}
          iconStyle="solid"
          name={icon as never}
          size={14}
        />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[10px] font-bold uppercase text-slate-400">
          {label}
        </Text>
        <Text numberOfLines={1} className="text-sm font-black text-slate-900">
          {title}
        </Text>
        <Text numberOfLines={1} className={subtitleClassName}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function RuleText({ label, text }: { label: string; text: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <Text className="text-xs font-black text-emerald-600">✓</Text>
      <Text className="flex-1 text-xs text-slate-600">
        <Text className="font-bold text-slate-900">{label}</Text> {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  blueIcon: {
    backgroundColor: '#EFF6FF',
  },
  checkBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkBoxChecked: {
    backgroundColor: '#0058bc',
    borderColor: '#0058bc',
  },
  emeraldIcon: {
    backgroundColor: '#ECFDF5',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    padding: 20,
    width: '100%',
  },
  modalOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  serviceBanner: {
    backgroundColor: '#0863c5',
    borderRadius: 18,
    elevation: 3,
    padding: 16,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  skyIcon: {
    backgroundColor: '#F0F9FF',
  },
  summaryIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
