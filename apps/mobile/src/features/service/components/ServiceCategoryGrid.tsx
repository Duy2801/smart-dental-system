import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { DentalService } from '../types';

type ServiceCategoryGridProps = {
  services: DentalService[];
  selectedServiceId: string;
  onSelectService: (id: string) => void;
};

const getServiceIconName = (slug?: string | null, category?: string) => {
  const key = (slug || category || '').toLowerCase();
  if (key.includes('implant')) return 'tooth';
  if (key.includes('boc-rang') || key.includes('su')) return 'teeth';
  if (key.includes('veneer')) return 'teeth-open';
  if (key.includes('nieng') || key.includes('chinh-nha')) return 'wand-magic-sparkles';
  if (key.includes('nho-rang') || key.includes('khon')) return 'hand-holding-medical';
  if (key.includes('tre-em') || key.includes('pediatric')) return 'face-smile';
  if (key.includes('tong-quat') || key.includes('kham')) return 'shield-halved';
  return 'tooth';
};

export function ServiceCategoryGrid({
  services,
  selectedServiceId,
  onSelectService,
}: ServiceCategoryGridProps) {
  if (!services.length) return null;

  return (
    <View style={styles.grid}>
      {services.map(service => {
        const isSelected = service.id === selectedServiceId;
        const iconName = getServiceIconName(service.slug, service.category);

        return (
          <TouchableOpacity
            key={service.id}
            activeOpacity={0.8}
            onPress={() => onSelectService(service.id)}
            style={[styles.card, isSelected ? styles.cardSelected : styles.cardDefault]}
          >
            {/* Icon Container */}
            <View
              style={[
                styles.iconBox,
                isSelected ? styles.iconBoxSelected : styles.iconBoxDefault,
              ]}
            >
              {service.icon && service.icon.startsWith('http') ? (
                <Image
                  source={{ uri: service.icon }}
                  style={styles.serviceIconImage}
                  resizeMode="contain"
                />
              ) : (
                <FontAwesome6
                  color={isSelected ? '#0863c5' : '#475569'}
                  iconStyle="solid"
                  name={iconName}
                  size={24}
                />
              )}
            </View>

            {/* Title */}
            <Text
              numberOfLines={2}
              style={[styles.title, isSelected ? styles.titleSelected : styles.titleDefault]}
            >
              {service.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 125,
    paddingHorizontal: 10,
    paddingVertical: 14,
    width: '48.5%',
  },
  cardDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  cardSelected: {
    backgroundColor: '#F4F9FF',
    borderColor: '#0863c5',
    elevation: 2,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  iconBoxDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  iconBoxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  serviceIconImage: {
    height: 42,
    width: 42,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  titleDefault: {
    color: '#334155',
  },
  titleSelected: {
    color: '#0863c5',
  },
});

