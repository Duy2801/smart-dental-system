import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from '~src/components/ui';
import { formatCurrency } from '../../api';
import type { AppointmentService } from '../../types';

type ServiceSelectorProps = {
  services: AppointmentService[];
  selectedServiceId: string;
  selectedMethodId: string;
  onSelectService: (serviceId: string) => void;
  onSelectMethod: (methodId: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

const getServiceIconName = (icon: string) => {
  const map: Record<string, string> = {
    braces: 'wand-magic-sparkles',
    cleaning: 'shield-halved',
    extraction: 'tooth',
    implant: 'gem',
    rootCanal: 'kit-medical',
    sparkles: 'wand-magic-sparkles',
  };
  return map[icon] || 'tooth';
};

export function ServiceSelector({
  services = [],
  selectedServiceId,
  selectedMethodId,
  onSelectService,
  onSelectMethod,
  onBack,
  onContinue,
}: ServiceSelectorProps) {
  const safeServices = Array.isArray(services) ? services : [];
  const currentService = safeServices.find(s => s.id === selectedServiceId);
  const treatmentMethods = Array.isArray(currentService?.treatmentMethods)
    ? currentService.treatmentMethods
    : [];
  const isStepComplete = Boolean(selectedServiceId) && Boolean(selectedMethodId);

  return (
    <View className="space-y-5">
      <View className="border-b border-slate-100 pb-3">
        <Text className="text-base font-black text-slate-900">
          2. Chọn dịch vụ & điều trị
        </Text>
        <Text className="mt-0.5 text-xs text-slate-500">
          Vui lòng chọn loại chuyên khoa và phương pháp điều trị mong muốn.
        </Text>
      </View>

      <View>
        <Text className="mb-2.5 text-xs font-black uppercase tracking-wider text-slate-500">
          1. Loại dịch vụ nha khoa
        </Text>
        <View className="flex-row flex-wrap gap-2.5">
          {safeServices.map(service => {
            const isSelected = selectedServiceId === service.id;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={service.id}
                onPress={() => onSelectService(service.id)}
                style={[
                  styles.serviceCategoryCard,
                  isSelected && styles.serviceCategoryCardSelected,
                ]}
              >
                <View
                  style={[
                    styles.serviceIconContainer,
                    isSelected && styles.serviceIconContainerSelected,
                  ]}
                >
                  <FontAwesome6
                    color={isSelected ? '#0058bc' : '#64748B'}
                    iconStyle="solid"
                    name={getServiceIconName(service.icon) as never}
                    size={16}
                  />
                </View>
                <Text
                  numberOfLines={2}
                  className={`mt-2 text-center text-xs font-black ${
                    isSelected ? 'text-[#0058bc]' : 'text-slate-800'
                  }`}
                >
                  {service.name}
                </Text>
                <Text className="mt-1 text-[10px] font-bold text-slate-400">
                  {service.treatmentMethods.length} phương pháp
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {currentService && treatmentMethods.length > 0 ? (
        <View className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3.5 mt-2">
          <Text className="mb-3 text-xs font-black uppercase tracking-wider text-[#0058bc]">
            Phương pháp điều trị ({currentService.name})
          </Text>

          <View className="gap-2.5">
            {treatmentMethods.map(method => {
              const isSelected = selectedMethodId === method.id;

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  key={method.id}
                  onPress={() => onSelectMethod(method.id)}
                  style={[
                    styles.methodCard,
                    isSelected && styles.methodCardSelected,
                  ]}
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="min-w-0 flex-1">
                      <Text
                        numberOfLines={1}
                        className={`text-sm font-black ${
                          isSelected ? 'text-[#0058bc]' : 'text-slate-900'
                        }`}
                      >
                        {method.name}
                      </Text>
                      {method.description ? (
                        <Text
                          numberOfLines={2}
                          className="mt-1 text-xs text-slate-500 leading-4"
                        >
                          {method.description}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <View className="flex-row items-center gap-1.5">
                      <FontAwesome6
                        color="#64748B"
                        iconStyle="solid"
                        name="clock"
                        size={11}
                      />
                      <Text className="text-xs font-bold text-slate-500">
                        {method.durationMinutes} phút
                      </Text>
                    </View>

                    <Text className="text-sm font-black text-[#0058bc]">
                      {formatCurrency(method.rawPrice ?? method.price)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View className="flex-row gap-2.5 pt-3 border-t border-slate-100">
        <Button variant="outline" onPress={onBack} className="flex-1">
          Quay lại
        </Button>
        <Button disabled={!isStepComplete} onPress={onContinue} className="flex-1">
          Tiếp tục: Chọn lịch
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  methodCardSelected: {
    borderColor: '#0058bc',
    elevation: 1,
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
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  radioOuterSelected: {
    borderColor: '#0058bc',
  },
  serviceCategoryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 110,
    padding: 10,
    width: '48%',
  },
  serviceCategoryCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0058bc',
  },
  serviceIconContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  serviceIconContainerSelected: {
    backgroundColor: '#FFFFFF',
  },
});
