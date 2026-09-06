import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export function ServiceCatalogHeader() {
  return (
    <View className="space-y-3 pb-3">
      {/* Eyebrow badge */}
      <View className="flex-row items-center">
        <View className="flex-row items-center rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1">
          <FontAwesome6 color="#0058bc" iconStyle="solid" name="wand-magic-sparkles" size={12} />
          <Text className="ml-2 text-[11px] font-black uppercase tracking-wider text-[#0058bc]">
            Chăm Sóc Nụ Cười Toàn Diện
          </Text>
        </View>
      </View>

      {/* Main Title & Subtitle */}
      <View>
        <Text className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Danh Sách Dịch Vụ Nha Khoa
        </Text>
        <Text className="mt-1 text-sm leading-relaxed text-slate-600">
          Chọn nhóm dịch vụ bên dưới để xem các phương pháp điều trị, chi phí và quy trình chi tiết.
        </Text>
      </View>
    </View>
  );
}

