import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
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

export function TreatmentMethodCard({
  service,
  method,
  onOpenDetail,
  onBook,
}: TreatmentMethodCardProps) {
  const imageUrl = method.imageUrl || method.media?.[0]?.url;

  return (
    <View style={styles.card}>
      {/* Top Banner Image or Fallback */}
      {imageUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={styles.fallbackHeader}>
          <View style={styles.fallbackIconBox}>
            <FontAwesome6 color="#0863c5" iconStyle="solid" name="tooth" size={20} />
          </View>
          <Text style={styles.fallbackServiceTitle}>{service.title}</Text>
        </View>
      )}

      {/* Card Body */}
      <View style={styles.body}>
        {/* Uppercase Service Category */}
        <Text style={styles.serviceTitle}>
          {service.title}
        </Text>

        {/* Method Name */}
        <Text numberOfLines={2} style={styles.methodName}>
          {method.name}
        </Text>

        {/* Method Description */}
        <Text numberOfLines={2} style={styles.description}>
          {method.description || service.shortDescription}
        </Text>

        {/* Price & Badge row (Image 2) */}
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

        {/* Action Buttons Row (Image 2: Full-width row with Chi tiết & Đặt lịch) */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  body: {
    padding: 16,
  },
  bookButton: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  detailButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  detailButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackHeader: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    height: 100,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fallbackIconBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    marginRight: 10,
    width: 44,
  },
  fallbackServiceTitle: {
    color: '#0863c5',
    fontSize: 14,
    fontWeight: '800',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageContainer: {
    aspectRatio: 4 / 3,
    backgroundColor: '#F1F5F9',
    maxHeight: 220,
    width: '100%',
  },
  methodName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 4,
  },
  pricePill: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pricePillText: {
    color: '#0863c5',
    fontSize: 13,
    fontWeight: '800',
  },
  serviceTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  specialtyBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  specialtyBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
});

