import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CACHE_TIMES, queryKeys } from '~src/config/queryClient';
import { getClinicConfigInfo } from '~src/features/home/api';

const clinicLogo = require('~src/assets/home/clinic-logo.png');

// Pill thương hiệu phòng khám trên màn hình xác thực (đồng bộ với frontend-patient)
const AuthBrandBadge = () => {
  const { data: clinic } = useQuery({
    queryKey: queryKeys.clinicConfig,
    queryFn: getClinicConfigInfo,
    staleTime: CACHE_TIMES.CLINIC_CONFIG.staleTime,
    gcTime: CACHE_TIMES.CLINIC_CONFIG.gcTime,
  });
  const clinicName = clinic?.name || 'Smart Dental Clinic';
  const logoSource = clinic?.logoUrl?.trim() ? { uri: clinic.logoUrl } : clinicLogo;

  return (
    <View style={styles.pill}>
      <View style={styles.logoBox}>
        <Image
          accessibilityLabel={`Logo ${clinicName}`}
          source={logoSource}
          style={styles.logo}
        />
      </View>
      <Text numberOfLines={1} style={styles.name}>
        {clinicName}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logo: { height: 18, resizeMode: 'contain', width: 18 },
  logoBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 24,
  },
  name: { color: '#0863c5', fontSize: 12, fontWeight: '700' },
  pill: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(239, 246, 255, 0.9)',
    borderColor: '#DBEAFE',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
});

export default AuthBrandBadge;
