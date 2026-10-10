import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
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

export type HeaderRecordItem = {
  id: string;
  title: string;
  date: string;
  doctor: string;
  kind: string;
  completedSteps: number;
  stepCount: number;
  category: string;
};

type RecordPatientHeaderProps = {
  profiles: PatientProfile[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  recordItems?: HeaderRecordItem[];
  activeRecordId?: string;
  onSelectRecord?: (recordId: string) => void;
};

export function RecordPatientHeader({
  profiles,
  selectedPatientId,
  onSelectPatient,
  recordItems = [],
  activeRecordId,
  onSelectRecord,
}: RecordPatientHeaderProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);

  const activeProfile =
    profiles.find(p => p.id === selectedPatientId) ??
    profiles.find(p => p.isPrimary) ??
    profiles[0];

  const relLabel = activeProfile
    ? relationshipLabels[activeProfile.relationship] ?? 'Người thân'
    : '';

  const activeRecord =
    recordItems.find(r => r.id === activeRecordId) ?? recordItems[0];

  return (
    <View style={styles.container}>
      {/* Eyebrow badge */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <FontAwesome6
            color="#0863c5"
            iconStyle="solid"
            name="wand-magic-sparkles"
            size={11}
          />
          <Text style={styles.badgeText}>Hồ Sơ Bệnh Án Y Khoa</Text>
        </View>
      </View>

      {/* Main Title & Subtitle */}
      <Text style={styles.title}>Hồ Sơ Bệnh Án & Lịch Sử Điều Trị</Text>
      <Text style={styles.subtitle}>
        Chọn người khám trong gia đình và xem chi tiết hồ sơ bệnh án, đơn thuốc và tiến trình điều trị y khoa.
      </Text>

      {/* Consolidated Top Panel for Profile Selector & Record Selector */}
      {(profiles.length > 0 || recordItems.length > 0) && (
        <View style={styles.profilePickerSection}>
          <View style={styles.pickerHeaderRow}>
            <FontAwesome6 color="#1996E0" iconStyle="solid" name="user" size={12} />
            <Text style={styles.pickerLabel}>
              HỒ SƠ NGƯỜI KHÁM ({profiles.length}):
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
            style={styles.dropdownBtn}
          >
            <View style={styles.dropdownLeft}>
              <View style={styles.dropdownAvatar}>
                <Text style={styles.dropdownAvatarText}>
                  {getInitials(activeProfile?.fullName || '')}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.dropdownValue}>
                {activeProfile?.fullName} — {relLabel}
                {activeProfile?.isPrimary ? ' (Hồ sơ chính)' : ''}
              </Text>
            </View>
            <FontAwesome6 color="#64748B" iconStyle="solid" name="chevron-down" size={12} />
          </TouchableOpacity>

          {/* Modal to pick profile */}
          <Modal
            animationType="fade"
            hardwareAccelerated
            onRequestClose={() => setModalVisible(false)}
            statusBarTranslucent
            transparent
            visible={modalVisible}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                <View style={styles.modalBackdrop} />
              </TouchableWithoutFeedback>

              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleGroup}>
                    <FontAwesome6 color="#0863c5" iconStyle="solid" name="users" size={14} />
                    <Text style={styles.modalTitle}>Chọn hồ sơ người khám</Text>
                  </View>
                  <TouchableOpacity
                    hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                    onPress={() => setModalVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={14} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalList}>
                  {profiles.map(profile => {
                    const isSelected = profile.id === selectedPatientId;
                    const rLabel = relationshipLabels[profile.relationship] ?? 'Người thân';

                    return (
                      <TouchableOpacity
                        key={profile.id}
                        activeOpacity={0.75}
                        onPress={() => {
                          onSelectPatient(profile.id);
                          setModalVisible(false);
                        }}
                        style={[
                          styles.profileOptionCard,
                          isSelected && styles.profileOptionCardSelected,
                        ]}
                      >
                        <View style={styles.profileOptionLeft}>
                          <View
                            style={[
                              styles.optionAvatar,
                              isSelected && styles.optionAvatarSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.optionAvatarText,
                                isSelected && styles.optionAvatarTextSelected,
                              ]}
                            >
                              {getInitials(profile.fullName)}
                            </Text>
                          </View>
                          <View style={styles.optionInfo}>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.optionName,
                                isSelected && styles.optionNameSelected,
                              ]}
                            >
                              {profile.fullName}
                            </Text>
                            <Text style={styles.optionRel}>
                              {rLabel} {profile.isPrimary ? '• (Hồ sơ chính)' : ''}
                            </Text>
                          </View>
                        </View>

                        {isSelected && (
                          <View style={styles.optionCheck}>
                            <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="check" size={11} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Modal>

          {/* Section 2: Medical Record Picker (Chọn hồ sơ bệnh án) */}
          {recordItems.length > 1 && (
            <>
              {profiles.length > 0 && <View style={styles.recordPickerDivider} />}

              <View style={styles.pickerHeaderRow}>
                <FontAwesome6 color="#1996E0" iconStyle="solid" name="file-medical" size={12} />
                <Text style={styles.pickerLabel}>
                  HỒ SƠ BỆNH ÁN ({recordItems.length}):
                </Text>
                <View style={styles.recordTypePill}>
                  <Text style={styles.recordTypePillText}>
                    {activeRecord?.kind ?? 'Bệnh án'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRecordModalVisible(true)}
                style={styles.dropdownBtn}
              >
                <View style={styles.dropdownLeft}>
                  <View
                    style={[
                      styles.dropdownAvatar,
                      {
                        backgroundColor:
                          activeRecord?.kind === 'Phác đồ' ? '#EFF6FF' : '#F0FDF4',
                      },
                    ]}
                  >
                    <FontAwesome6
                      color={
                        activeRecord?.kind === 'Phác đồ' ? '#0863c5' : '#16A34A'
                      }
                      iconStyle="solid"
                      name={
                        activeRecord?.kind === 'Phác đồ' ? 'list-check' : 'file-waveform'
                      }
                      size={12}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.dropdownValue}>
                      {activeRecord?.title ?? 'Chọn hồ sơ bệnh án'}
                    </Text>
                    <Text numberOfLines={1} style={styles.dropdownSubtext}>
                      {activeRecord?.category} • {activeRecord?.date}
                    </Text>
                  </View>
                </View>
                <FontAwesome6 color="#64748B" iconStyle="solid" name="chevron-down" size={12} />
              </TouchableOpacity>
            </>
          )}

          {/* Modal to pick medical record */}
          {recordItems.length > 1 && (
            <Modal
              animationType="fade"
              hardwareAccelerated
              onRequestClose={() => setRecordModalVisible(false)}
              statusBarTranslucent
              transparent
              visible={recordModalVisible}
            >
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => setRecordModalVisible(false)}>
                  <View style={styles.modalBackdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.modalSheet}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleGroup}>
                      <FontAwesome6 color="#0863c5" iconStyle="solid" name="book-medical" size={14} />
                      <Text style={styles.modalTitle}>Chọn hồ sơ bệnh án & dịch vụ</Text>
                    </View>
                    <TouchableOpacity
                      hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                      onPress={() => setRecordModalVisible(false)}
                      style={styles.modalCloseBtn}
                    >
                      <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={14} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.modalList}>
                      {recordItems.map((item, index) => {
                        const isSelected = item.id === (activeRecordId || recordItems[0]?.id);
                        const isPlan = item.kind === 'Phác đồ';

                        return (
                          <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.75}
                            onPress={() => {
                              onSelectRecord?.(item.id);
                              setRecordModalVisible(false);
                            }}
                            style={[
                              styles.profileOptionCard,
                              isSelected && styles.profileOptionCardSelected,
                            ]}
                          >
                            <View style={styles.profileOptionLeft}>
                              <View
                                style={[
                                  styles.optionAvatar,
                                  { backgroundColor: isPlan ? '#EFF6FF' : '#F0FDF4' },
                                  isSelected && { backgroundColor: isPlan ? '#0863c5' : '#16A34A' },
                                ]}
                              >
                                <FontAwesome6
                                  color={isSelected ? '#FFFFFF' : isPlan ? '#0863c5' : '#16A34A'}
                                  iconStyle="solid"
                                  name={isPlan ? 'list-check' : 'file-waveform'}
                                  size={12}
                                />
                              </View>
                              <View style={styles.optionInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text
                                    numberOfLines={1}
                                    style={[
                                      styles.optionName,
                                      { flexShrink: 1 },
                                      isSelected && styles.optionNameSelected,
                                    ]}
                                  >
                                    Hồ sơ #{index + 1}: {item.title}
                                  </Text>
                                  <View
                                    style={[
                                      styles.miniBadge,
                                      { backgroundColor: isPlan ? '#EFF6FF' : '#F0FDF4' },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.miniBadgeText,
                                        { color: isPlan ? '#0863c5' : '#16A34A' },
                                      ]}
                                    >
                                      {item.kind}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.optionRel}>
                                  {item.category} • BS. {item.doctor} • {item.date}
                                </Text>
                              </View>
                            </View>

                            {isSelected && (
                              <View style={styles.optionCheck}>
                                <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="check" size={11} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 6,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  profilePickerSection: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  pickerHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  pickerLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dropdownBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    marginRight: 8,
  },
  dropdownAvatar: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  dropdownAvatarText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
  },
  dropdownValue: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  modalTitleGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  modalCloseBtn: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  modalList: {
    gap: 10,
    marginTop: 14,
  },
  profileOptionCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  profileOptionCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0863c5',
  },
  profileOptionLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  optionAvatar: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  optionAvatarSelected: {
    backgroundColor: '#0863c5',
  },
  optionAvatarText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
  optionAvatarTextSelected: {
    color: '#FFFFFF',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  optionNameSelected: {
    color: '#0863c5',
  },
  optionRel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  optionCheck: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 10,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  recordPickerDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  recordTypePill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  recordTypePillText: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '700',
  },
  dropdownSubtext: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  miniBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
