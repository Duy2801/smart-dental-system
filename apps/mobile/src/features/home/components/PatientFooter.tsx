import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  Linking,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import { getClinicConfigInfo, type ClinicConfigInfo } from '../api';

function getOpenHoursText(
  hours: { id?: number; label: string; isOpen: boolean; start: string; end: string }[] = [],
): string[] {
  const openDays = hours.filter(day => day.isOpen);
  if (!openDays.length) {
    return [
      'Thu Hai - Thu Sau: 08:00 - 17:00',
      'Thu Bay: 08:00 - 12:00',
    ];
  }

  const firstTime = `${openDays[0].start} - ${openDays[0].end}`;
  const allSameTime = openDays.every(
    day => `${day.start} - ${day.end}` === firstTime,
  );

  if (allSameTime && openDays.length > 1) {
    const firstDayLabel = openDays[0].label;
    const lastDayLabel = openDays[openDays.length - 1].label;
    if (openDays.length === 7) {
      return [`Thứ 2 - Chủ Nhật: ${firstTime}`];
    }
    return [`${firstDayLabel} - ${lastDayLabel}: ${firstTime}`];
  }

  const result: string[] = [];
  let currentGroup: typeof openDays = [];

  for (let i = 0; i < openDays.length; i++) {
    const day = openDays[i];
    if (currentGroup.length === 0) {
      currentGroup.push(day);
    } else {
      const prev = currentGroup[currentGroup.length - 1];
      if (prev.start === day.start && prev.end === day.end) {
        currentGroup.push(day);
      } else {
        const timeStr = `${currentGroup[0].start} - ${currentGroup[0].end}`;
        if (currentGroup.length === 1) {
          result.push(`${currentGroup[0].label}: ${timeStr}`);
        } else {
          result.push(
            `${currentGroup[0].label} - ${currentGroup[currentGroup.length - 1].label}: ${timeStr}`,
          );
        }
        currentGroup = [day];
      }
    }
  }

  if (currentGroup.length > 0) {
    const timeStr = `${currentGroup[0].start} - ${currentGroup[0].end}`;
    if (currentGroup.length === 1) {
      result.push(`${currentGroup[0].label}: ${timeStr}`);
    } else {
      result.push(
        `${currentGroup[0].label} - ${currentGroup[currentGroup.length - 1].label}: ${timeStr}`,
      );
    }
  }

  return result;
}

export type PatientFooterProps = {
  clinic?: ClinicConfigInfo;
  style?: StyleProp<ViewStyle>;
};

export function PatientFooter({ clinic: propClinic, style }: PatientFooterProps) {
  const clinicQuery = useQuery({
    enabled: !propClinic,
    queryFn: getClinicConfigInfo,
    queryKey: ['clinic-config'],
    staleTime: 5 * 60 * 1000,
  });

  const clinic = propClinic ?? clinicQuery.data;
  const openHours = getOpenHoursText(clinic?.businessHours ?? []);

  const handleCall = () => {
    const phone = clinic?.phone || '1900 1234';
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {});
  };

  const handleEmail = () => {
    const email = clinic?.email || 'contact@smartdental.com';
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  return (
    <View style={[styles.footerWrapper, style]}>
      {/* 1. Brand Section */}
      <View style={styles.footerBlock}>
        <Text style={styles.footerBrandName}>Smart Dental System</Text>
        <Text style={styles.footerBrandDesc}>
          Hệ thống nha khoa kỹ thuật số chuẩn quốc tế, ứng dụng AI chẩn đoán và điều trị chuyên sâu.
        </Text>
      </View>

      {/* 2. Địa chỉ phòng khám */}
      <View style={styles.footerBlock}>
        <Text style={styles.footerBlockHeading}>Địa chỉ phòng khám</Text>
        <Text style={styles.footerBlockBody}>
          {clinic?.address || 'Chưa cập nhật địa chỉ'}
        </Text>
      </View>

      {/* 3. Liên hệ & Hỗ trợ */}
      <View style={styles.footerBlock}>
        <Text style={styles.footerBlockHeading}>Liên hệ & Hỗ trợ</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={handleCall}>
          <Text style={styles.footerBlockBody}>
            Hotline:{' '}
            <Text style={styles.footerHotlineBlue}>
              {clinic?.phone || '1900 1234'}
            </Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={handleEmail}>
          <Text style={styles.footerBlockBody}>
            Email: {clinic?.email || 'contact@smartdental.com'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Giờ mở cửa */}
      <View style={styles.footerBlock}>
        <Text style={styles.footerBlockHeading}>Giờ mở cửa</Text>
        {openHours.map((item, idx) => (
          <Text key={`hour-${idx}`} style={styles.footerBlockBody}>
            {item}
          </Text>
        ))}
      </View>

      {/* Bottom Separator & Copyright */}
      <View style={styles.footerBottomDivider} />

      <View style={styles.footerBottomBlock}>
        <Text style={styles.footerCopyrightText}>
          © 2026 Smart Dental System. Chăm sóc nụ cười bằng công nghệ AI.
        </Text>

        <View style={styles.footerLinksRow}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLinkText}>Hỗ trợ</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLinkText}>Bảo mật</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLinkText}>Điều khoản</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerBlock: {
    marginBottom: 20,
  },
  footerBlockBody: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 19,
  },
  footerBlockHeading: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerBottomBlock: {
    gap: 10,
    paddingRight: 64,
  },
  footerBottomDivider: {
    backgroundColor: '#F1F5F9',
    height: 1,
    marginBottom: 18,
    marginTop: 6,
  },
  footerBrandDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 19,
  },
  footerBrandName: {
    color: '#0863C5',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  footerCopyrightText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  footerHotlineBlue: {
    color: '#0863C5',
    fontWeight: '800',
  },
  footerLinkText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '500',
  },
  footerLinksRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 2,
  },
  footerWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    marginTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 24,
    width: '100%',
  },
});
