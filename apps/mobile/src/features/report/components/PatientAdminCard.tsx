import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { PatientRecordsResponse } from '../types';

function getInitials(name: string) {
  if (!name || !name.trim()) return 'BN';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type PatientAdminCardProps = {
  patient: PatientRecordsResponse['patient'];
};

export function PatientAdminCard({ patient }: PatientAdminCardProps) {
  const formattedDobAndAge = useMemo(() => {
    if (!patient?.dateOfBirth) {
      if (patient?.age !== null && patient?.age !== undefined && patient.age > 0) {
        return `${patient.age} tuổi`;
      }
      return 'Chưa cập nhật';
    }

    const dob = new Date(patient.dateOfBirth);
    if (isNaN(dob.getTime())) {
      if (patient?.age !== null && patient?.age !== undefined && patient.age > 0) {
        return `${patient.age} tuổi`;
      }
      return 'Chưa cập nhật';
    }

    const birthYear = dob.getFullYear();
    const currentYear = new Date().getFullYear();
    const age = patient.age ?? currentYear - birthYear;

    const day = String(dob.getDate()).padStart(2, '0');
    const month = String(dob.getMonth() + 1).padStart(2, '0');
    const formattedDate = `${day}/${month}/${birthYear}`;

    return age > 0 ? `${formattedDate} (${age} tuổi)` : formattedDate;
  }, [patient]);

  const genderText =
    patient?.gender === 'MALE'
      ? 'Nam'
      : patient?.gender === 'FEMALE'
      ? 'Nữ'
      : 'Khác';

  const initials = getInitials(patient?.fullName || '');
  const hasAllergy = Boolean(
    patient?.medicalHistory &&
      /dị ứng|allergy|penicillin|kháng sinh/i.test(patient.medicalHistory),
  );

  return (
    <View style={styles.card}>
      {/* 1. Identity Row */}
      <View style={styles.topIdentityRow}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{initials}</Text>
          <View style={styles.activeDot} />
        </View>

        <View style={styles.identityMeta}>
          <Text numberOfLines={1} style={styles.fullName}>
            {patient?.fullName || 'Bệnh Nhân'}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>
                {patient?.patientCode || 'PAT-RECORD'}
              </Text>
            </View>

            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Hồ sơ chính</Text>
            </View>
          </View>

          <Text style={styles.statusSub}>
            Hồ sơ y tế SmartDental •{' '}
            <Text style={styles.statusActive}>Đồng bộ hoạt động</Text>
          </Text>
        </View>
      </View>

      {/* 2. Key Info Chips in 3 Columns */}
      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>NGÀY SINH / TUỔI</Text>
          <Text numberOfLines={1} style={styles.chipValue}>
            {formattedDobAndAge}
          </Text>
        </View>

        <View style={styles.chip}>
          <Text style={styles.chipLabel}>SỐ ĐIỆN THOẠI</Text>
          <Text numberOfLines={1} style={styles.chipValue}>
            {patient?.phone || 'Chưa cập nhật'}
          </Text>
        </View>

        <View style={styles.chip}>
          <Text style={styles.chipLabel}>GIỚI TÍNH</Text>
          <Text numberOfLines={1} style={styles.chipValue}>
            {genderText}
          </Text>
        </View>
      </View>

      {/* 3. Medical History & Allergy Alert */}
      {patient?.medicalHistory ? (
        <View style={[styles.historyBox, hasAllergy && styles.historyBoxAlert]}>
          <FontAwesome6
            color={hasAllergy ? '#DC2626' : '#0863c5'}
            iconStyle="solid"
            name={hasAllergy ? 'triangle-exclamation' : 'shield-halved'}
            size={14}
          />
          <View style={styles.historyContent}>
            <Text style={[styles.historyLabel, hasAllergy && styles.historyLabelAlert]}>
              {hasAllergy ? 'CẢNH BÁO TIỀN SỬ DỊ ỨNG THUỐC' : 'TIỀN SỬ Y KHOA & SỨC KHỎE'}
            </Text>
            <Text style={[styles.historyValue, hasAllergy && styles.historyValueAlert]}>
              {patient.medicalHistory}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  topIdentityRow: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 14,
  },
  avatarBox: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    position: 'relative',
    width: 52,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  activeDot: {
    backgroundColor: '#10B981',
    borderColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 2,
    bottom: -2,
    height: 12,
    position: 'absolute',
    right: -2,
    width: 12,
  },
  identityMeta: {
    flex: 1,
  },
  fullName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  codeBadgeText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '800',
  },
  primaryBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    color: '#0863c5',
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  statusActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  chipLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  chipValue: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  historyBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    padding: 12,
  },
  historyBoxAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  historyContent: {
    flex: 1,
  },
  historyLabel: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historyLabelAlert: {
    color: '#DC2626',
  },
  historyValue: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  historyValueAlert: {
    color: '#991B1B',
    fontWeight: '700',
  },
});
