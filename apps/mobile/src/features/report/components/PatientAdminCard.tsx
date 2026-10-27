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
  recordDate?: string;
};

function InfoChip({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.chip, highlight && styles.chipHighlight]}>
      <View style={[styles.chipIcon, highlight && styles.chipIconHighlight]}>
        <FontAwesome6 color="#0863c5" iconStyle="solid" name={icon as any} size={12} />
      </View>
      <View style={styles.chipBody}>
        <Text numberOfLines={1} style={[styles.chipLabel, highlight && styles.chipLabelHighlight]}>
          {label}
        </Text>
        <Text numberOfLines={1} style={[styles.chipValue, highlight && styles.chipValueHighlight]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function PatientAdminCard({ patient, recordDate }: PatientAdminCardProps) {
  const formattedDob = useMemo(() => {
    if (!patient?.dateOfBirth) return 'Chưa cập nhật';
    const dob = new Date(patient.dateOfBirth);
    if (isNaN(dob.getTime())) return 'Chưa cập nhật';
    const day = String(dob.getDate()).padStart(2, '0');
    const month = String(dob.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${dob.getFullYear()}`;
  }, [patient]);

  const genderText =
    patient?.gender === 'MALE'
      ? 'Nam'
      : patient?.gender === 'FEMALE'
      ? 'Nữ'
      : 'Khác';

  const initials = getInitials(patient?.fullName || '');

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

      {/* 2. Key Info Chips */}
      <View style={styles.chipsGrid}>
        <View style={styles.chipsRow}>
          <InfoChip icon="calendar" label="NGÀY SINH" value={formattedDob} />
          <InfoChip icon="phone" label="SỐ ĐIỆN THOẠI" value={patient?.phone || 'Chưa cập nhật'} />
        </View>
        <View style={styles.chipsRow}>
          <InfoChip icon="user" label="GIỚI TÍNH" value={genderText} />
          {recordDate ? (
            <InfoChip highlight icon="clock" label="NGÀY LẬP HỒ SƠ" value={recordDate} />
          ) : (
            <View style={styles.chipSpacer} />
          )}
        </View>
      </View>
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
  chipsGrid: {
    gap: 8,
    marginTop: 12,
  },
  chipsRow: {
    flexWrap: 'wrap',
    rowGap: 8,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#F8FBFE',
    borderColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  chipHighlight: {
    backgroundColor: 'rgba(239, 246, 255, 0.6)',
    borderColor: '#DBEAFE',
  },
  chipSpacer: {
    flex: 1,
  },
  chipIcon: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  chipIconHighlight: {
    backgroundColor: '#DBEAFE',
  },
  chipBody: {
    flex: 1,
    minWidth: 0,
  },
  chipLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chipLabelHighlight: {
    color: '#0058bc',
  },
  chipValue: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  chipValueHighlight: {
    color: '#07366f',
  },
});
