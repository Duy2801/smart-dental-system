import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatServicePrice } from '../api';
import type { DentalService, TreatmentMethod } from '../types';

type TreatmentMethodCardProps = {
  service: DentalService;
  method: TreatmentMethod;
  onOpenDetail: (service: DentalService, method: TreatmentMethod) => void;
  onBook: (service: DentalService, method: TreatmentMethod) => void;
};

const IMAGE_SIZE = 104;

export function TreatmentMethodCard({
  service,
  method,
  onOpenDetail,
  onBook,
}: TreatmentMethodCardProps) {
  const imageUrl = method.imageUrl || method.media?.[0]?.url;

  return (
    <View style={styles.card}>
      {/* Hàng trên: ảnh vuông nhỏ (hiện trọn ảnh) + tên, giá — giống bố cục desktop của web */}
      <View style={styles.topRow}>
        <View style={styles.imageFrame}>
          {imageUrl ? (
            <Image
              accessibilityLabel={method.name}
              resizeMode="cover"
              source={{ uri: imageUrl }}
              style={styles.image}
            />
          ) : (
            <View style={styles.fallbackBox}>
              <Text numberOfLines={4} style={styles.fallbackText}>
                {method.name}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.topInfo}>
          <Text numberOfLines={1} style={styles.serviceTitle}>
            {service.title}
          </Text>
          <Text numberOfLines={2} style={styles.methodName}>
            {method.name}
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>
                {formatServicePrice(method.basePrice)}
              </Text>
            </View>
            <View style={styles.specialtyBadge}>
              <Text style={styles.specialtyBadgeText}>Chuyên sâu</Text>
            </View>
          </View>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.description}>
        {method.description || service.shortDescription}
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onOpenDetail(service, method)}
          style={styles.detailButton}
        >
          <Text style={styles.detailButtonText}>Chi tiết</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onBook(service, method)}
          style={styles.bookButton}
        >
          <Text style={styles.bookButtonText}>Đặt lịch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexWrap: 'wrap',
    rowGap: 8,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  bookButton: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  detailButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  detailButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackBox: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    height: '100%',
    justifyContent: 'center',
    padding: 8,
    width: '100%',
  },
  fallbackText: {
    color: '#0863c5',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  // Ảnh vuông nhỏ: ảnh phương pháp là ảnh vuông nên hiện trọn vẹn, không bị cắt
  imageFrame: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: IMAGE_SIZE,
    overflow: 'hidden',
    width: IMAGE_SIZE,
  },
  methodName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
    marginTop: 2,
  },
  pricePill: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pricePillText: {
    color: '#0863c5',
    fontSize: 12,
    fontWeight: '800',
  },
  serviceTitle: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  specialtyBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  specialtyBadgeText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '700',
  },
  topInfo: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
