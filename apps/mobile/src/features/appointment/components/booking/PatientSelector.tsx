import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { Button, Card } from '~src/components/ui';
import type { CreatePatientProfilePayload, PatientProfile } from '../../types';

type PatientSelectorProps = {
  patients: PatientProfile[];
  selectedPatientId: string;
  isLoading?: boolean;
  isCreating?: boolean;
  onSelectPatient: (patientId: string) => void;
  onCreatePatient: (payload: CreatePatientProfilePayload) => Promise<void>;
  onContinue: () => void;
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  SELF: 'Tôi (Chính chủ)',
  CHILD: 'Con',
  FATHER: 'Bố',
  MOTHER: 'Mẹ',
  OTHER: 'Người thân',
};

export function PatientSelector({
  patients = [],
  selectedPatientId,
  isLoading,
  isCreating,
  onSelectPatient,
  onCreatePatient,
  onContinue,
}: PatientSelectorProps) {
  const safePatients = Array.isArray(patients) ? patients : [];
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'>('UNKNOWN');
  const [relationship, setRelationship] = useState('CHILD');

  const handleSavePatient = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) return;

    await onCreatePatient({
      fullName: trimmed,
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth.trim() || undefined,
      gender,
      relationship,
    });

    setFullName('');
    setPhone('');
    setDateOfBirth('');
    setGender('UNKNOWN');
    setRelationship('CHILD');
    setShowModal(false);
  };

  const isComplete = Boolean(selectedPatientId);

  return (
    <View className="space-y-4">
      {/* Header Row */}
      <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
        <View className="min-w-0 flex-1">
          <Text className="text-base font-black text-slate-900">
            1. Chọn người khám
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500">
            Lịch hẹn sẽ được gắn trực tiếp với hồ sơ người đi khám.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowModal(true)}
          className="flex-row items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2"
        >
          <FontAwesome6 color="#0058bc" iconStyle="solid" name="plus" size={11} />
          <Text className="text-xs font-bold text-[#0058bc]">Thêm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Patient Profile Cards */}
      {isLoading ? (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator color="#0058bc" size="small" />
          <Text className="mt-2 text-xs text-slate-400">Đang tải danh sách hồ sơ...</Text>
        </View>
      ) : safePatients.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-slate-200 p-6 items-center justify-center">
          <FontAwesome6 color="#94A3B8" iconStyle="solid" name="user-slash" size={24} />
          <Text className="mt-2 text-xs font-bold text-slate-600">
            Chưa có hồ sơ người khám nào.
          </Text>
          <Text className="mt-1 text-[11px] text-slate-400 text-center">
            Vui lòng thêm hồ sơ để tiếp tục đặt lịch hẹn.
          </Text>
        </View>
      ) : (
        <View className="gap-2.5">
          {safePatients.map(patient => {
            const isSelected = patient.id === selectedPatientId;
            return (
              <TouchableOpacity
                key={patient.id}
                activeOpacity={0.85}
                disabled={!patient.canBook}
                onPress={() => onSelectPatient(patient.id)}
                style={[
                  styles.patientCard,
                  isSelected && styles.patientCardSelected,
                  !patient.canBook && styles.patientCardDisabled,
                ]}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 min-w-0 flex-1">
                    <View
                      style={[
                        styles.avatarCircle,
                        isSelected && styles.avatarCircleSelected,
                      ]}
                    >
                      <FontAwesome6
                        color={isSelected ? '#0058bc' : '#64748B'}
                        iconStyle="solid"
                        name="user"
                        size={14}
                      />
                    </View>
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          numberOfLines={1}
                          className={`text-sm font-black ${
                            isSelected ? 'text-[#0058bc]' : 'text-slate-900'
                          }`}
                        >
                          {patient.fullName}
                        </Text>
                        {patient.isPrimary ? (
                          <View className="rounded-md bg-blue-100 px-1.5 py-0.5">
                            <Text className="text-[9px] font-black text-[#0058bc]">
                              Chính chủ
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="mt-0.5 text-xs text-slate-500">
                        Quan hệ: {RELATIONSHIP_LABELS[patient.relationship] ?? 'Người thân'}
                        {patient.phone ? ` • ${patient.phone}` : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Action Footer Button */}
      <View className="pt-3 border-t border-slate-100">
        <Button
          disabled={!isComplete}
          onPress={onContinue}
          className="w-full"
        >
          Tiếp tục: Chọn dịch vụ
        </Button>
      </View>

      {/* Modal Thêm hồ sơ người khám */}
      <Modal
        animationType="slide"
        transparent
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-black text-slate-900">
                Thêm người khám mới
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              >
                <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={14} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-3 space-y-3">
              <TextInput
                label="Họ và tên người khám *"
                mode="outlined"
                value={fullName}
                onChangeText={setFullName}
                placeholder="VD: Nguyễn Văn An"
                outlineColor="#CBD5E1"
                activeOutlineColor="#0058bc"
                className="bg-white"
              />

              <TextInput
                label="Số điện thoại"
                mode="outlined"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="VD: 0912345678"
                outlineColor="#CBD5E1"
                activeOutlineColor="#0058bc"
                className="bg-white mt-3"
              />

              <TextInput
                label="Ngày sinh (YYYY-MM-DD)"
                mode="outlined"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="VD: 1998-10-25"
                outlineColor="#CBD5E1"
                activeOutlineColor="#0058bc"
                className="bg-white mt-3"
              />

              {/* Quan hệ */}
              <View className="mt-3">
                <Text className="text-xs font-bold text-slate-700 mb-1.5">
                  Mối quan hệ với chủ tài khoản
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { key: 'CHILD', label: 'Con' },
                    { key: 'FATHER', label: 'Bố' },
                    { key: 'MOTHER', label: 'Mẹ' },
                    { key: 'OTHER', label: 'Người thân khác' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setRelationship(item.key)}
                      className={`rounded-xl border px-3 py-2 ${
                        relationship === item.key
                          ? 'border-[#0058bc] bg-blue-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          relationship === item.key ? 'text-[#0058bc]' : 'text-slate-700'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Giới tính */}
              <View className="mt-3">
                <Text className="text-xs font-bold text-slate-700 mb-1.5">
                  Giới tính
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { key: 'MALE', label: 'Nam' },
                    { key: 'FEMALE', label: 'Nữ' },
                    { key: 'UNKNOWN', label: 'Khác / Chưa rõ' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setGender(item.key as any)}
                      className={`flex-1 items-center rounded-xl border py-2 ${
                        gender === item.key
                          ? 'border-[#0058bc] bg-blue-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          gender === item.key ? 'text-[#0058bc]' : 'text-slate-700'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="pt-4 pb-2">
                <Button
                  disabled={!fullName.trim() || isCreating}
                  onPress={handleSavePatient}
                  className="w-full"
                >
                  {isCreating ? 'Đang lưu...' : 'Lưu hồ sơ người khám'}
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  avatarCircleSelected: {
    backgroundColor: '#EFF6FF',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    width: '100%',
  },
  modalOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
  },
  patientCardDisabled: {
    opacity: 0.5,
  },
  patientCardSelected: {
    backgroundColor: '#F8FAFC',
    borderColor: '#0058bc',
  },
  radioInner: {
    backgroundColor: '#0058bc',
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    marginLeft: 10,
    width: 20,
  },
  radioOuterSelected: {
    borderColor: '#0058bc',
  },
});
