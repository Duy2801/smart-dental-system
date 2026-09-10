import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { PatientRecordsResponse, TreatmentRecordView } from '../types';

function getInitials(name: string) {
  if (!name || !name.trim()) return 'BN';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type PatientAdminCardProps = {
  patient: PatientRecordsResponse['patient'];
  treatment: TreatmentRecordView;
};

export function PatientAdminCard({ patient, treatment }: PatientAdminCardProps) {
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

  return (
    <View style={styles.card}>
      {/* Top row with Avatar and Badges + Name (Image 2) */}
      <View style={styles.patientTopRow}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.patientMeta}>
          <View style={styles.headerBadges}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>
                MÃ BN: {patient?.patientCode || 'Chưa cấp mã'}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>● Hồ sơ đang hoạt động</Text>
            </View>
          </View>

          <Text numberOfLines={1} style={styles.fullName}>
            {patient?.fullName || 'Bệnh Nhân'}
          </Text>
        </View>
      </View>

      {/* 3 Rows Admin Info (Image 2) */}
      <View style={styles.infoCard}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>📅 NGÀY SINH / TUỔI</Text>
          <Text style={styles.infoValue}>{formattedDobAndAge}</Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>📞 SỐ ĐIỆN THOẠI</Text>
          <Text style={styles.infoValue}>{patient?.phone || 'Chưa cập nhật'}</Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>🚻 GIỚI TÍNH</Text>
          <Text style={styles.infoValue}>{genderText}</Text>
        </View>
      </View>

      {/* Safety & Medical History Box (Image 2) */}
      <View style={styles.allergyBox}>
        <Text style={styles.shieldIcon}>🛡️</Text>
        <View style={styles.allergyContent}>
          <Text style={styles.allergyLabel}>TIỀN SỬ Y KHOA & DỊ ỨNG</Text>
          <Text style={styles.allergyValue}>
            {patient?.medicalHistory || 'Không ghi nhận dị ứng thuốc - Sức khỏe bình thường'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  allergyBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 12,
    padding: 14,
  },
  allergyContent: {
    flex: 1,
    marginLeft: 10,
  },
  allergyLabel: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  allergyValue: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  avatarBox: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  codeBadgeText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fullName: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  headerBadges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoDivider: {
    backgroundColor: '#F1F5F9',
    height: 1,
    marginVertical: 8,
  },
  infoItem: {
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },
  patientMeta: {
    flex: 1,
    marginLeft: 12,
  },
  patientTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  shieldIcon: {
    fontSize: 22,
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusBadgeText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },
});
