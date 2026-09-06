import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { PatientProfile } from '~src/features/appointment/types';

const relationshipLabels: Record<string, string> = {
  SELF: 'Tôi',
  CHILD: 'Con',
  FATHER: 'Bố',
  MOTHER: 'Mẹ',
  OTHER: 'Người thân',
};

function getInitials(name: string) {
  if (!name || !name.trim()) return 'BN';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type RecordPatientHeaderProps = {
  profiles: PatientProfile[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
};

export function RecordPatientHeader({
  profiles,
  selectedPatientId,
  onSelectPatient,
}: RecordPatientHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Eyebrow badge */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <FontAwesome6 color="#0863c5" iconStyle="solid" name="wand-magic-sparkles" size={11} />
          <Text style={styles.badgeText}>Hồ Sơ Y Khoa Gia Đình & Phác Đồ</Text>
        </View>
      </View>

      {/* Main Title & Subtitle */}
      <Text style={styles.title}>Danh Sách Phác Đồ & Hồ Sơ Bệnh Nhân</Text>
      <Text style={styles.subtitle}>
        Chọn người khám trong gia đình và xem chi tiết phác đồ điều trị, đơn thuốc và tiến trình y khoa.
      </Text>

      {/* Family Profile Picker */}
      {profiles.length > 0 ? (
        <View style={styles.profilesSection}>
          <View style={styles.profilesHeaderRow}>
            <FontAwesome6 color="#0863c5" iconStyle="solid" name="users" size={13} />
            <Text style={styles.profilesLabel}>
              Hồ Sơ Người Khám ({profiles.length}):
            </Text>
          </View>

          <View style={styles.profilesList}>
            {profiles.map(profile => {
              const isSelected = profile.id === selectedPatientId;
              const relLabel = relationshipLabels[profile.relationship] ?? 'Người thân';

              return (
                <TouchableOpacity
                  key={profile.id}
                  activeOpacity={0.8}
                  onPress={() => onSelectPatient(profile.id)}
                  style={[
                    styles.profileCard,
                    isSelected ? styles.profileCardSelected : styles.profileCardDefault,
                  ]}
                >
                  <View style={styles.profileLeft}>
                    <View
                      style={[
                        styles.avatarBox,
                        isSelected ? styles.avatarBoxSelected : styles.avatarBoxDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          isSelected ? styles.avatarTextSelected : styles.avatarTextDefault,
                        ]}
                      >
                        {getInitials(profile.fullName)}
                      </Text>
                    </View>

                    <View style={styles.profileInfo}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.profileName,
                          isSelected ? styles.profileNameSelected : styles.profileNameDefault,
                        ]}
                      >
                        {profile.fullName}
                      </Text>
                      <Text
                        style={[
                          styles.profileRel,
                          isSelected ? styles.profileRelSelected : styles.profileRelDefault,
                        ]}
                      >
                        {relLabel} {profile.isPrimary ? '• (Hồ sơ chính)' : ''}
                      </Text>
                    </View>
                  </View>

                  {isSelected ? (
                    <View style={styles.checkCircle}>
                      <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="check" size={10} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarBox: {
    alignItems: 'center',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  avatarBoxDefault: {
    backgroundColor: '#EFF6FF',
  },
  avatarBoxSelected: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '900',
  },
  avatarTextDefault: {
    color: '#0863c5',
  },
  avatarTextSelected: {
    color: '#0863c5',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeRow: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  checkCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  container: {
    marginBottom: 16,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
  },
  profileCardDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  profileCardSelected: {
    backgroundColor: '#0863c5',
    borderColor: '#0863c5',
    elevation: 3,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '900',
  },
  profileNameDefault: {
    color: '#0F172A',
  },
  profileNameSelected: {
    color: '#FFFFFF',
  },
  profileRel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  profileRelDefault: {
    color: '#64748B',
  },
  profileRelSelected: {
    color: '#DBEAFE',
  },
  profilesHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  profilesLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  profilesList: {
    gap: 8,
    width: '100%',
  },
  profilesSection: {
    marginTop: 16,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
});

