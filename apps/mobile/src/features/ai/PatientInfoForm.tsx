import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

export type PatientFormDefaults = {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  relationship?: string;
  gender?: string;
};

export type PatientFormValues = {
  fullName: string;
  phone: string;
  /** YYYY-MM-DD hoặc rỗng */
  dateOfBirth: string;
  relationship: string;
  gender: string;
};

export const RELATIONSHIP_OPTIONS = [
  { value: 'CHILD', label: 'Con' },
  { value: 'FATHER', label: 'Cha' },
  { value: 'MOTHER', label: 'Mẹ' },
  { value: 'OTHER', label: 'Người thân khác' },
] as const;

export const GENDER_OPTIONS = [
  { value: '', label: 'Chưa rõ' },
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
] as const;

const PHONE_PATTERN = /^0\d{9}$/;

const todayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

/** "2018-02-01..." -> "01/02/2018" để hiện trong ô nhập */
const toDisplayDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return '';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

/** Tự chèn dấu "/" khi gõ: 01022018 -> 01/02/2018 */
const maskDateInput = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/** "01/02/2018" -> "2018-02-01"; null nếu không hợp lệ */
const parseDisplayDate = (value: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    year < 1900
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
};

type PatientInfoFormProps = {
  defaults?: PatientFormDefaults;
  disabled?: boolean;
  onSubmit: (values: PatientFormValues) => void;
};

/**
 * Form "Thông tin người khám" hiển thị ngay dưới tin nhắn của trợ lý AI khi
 * khách đặt lịch cho người thân — giống form trên web.
 */
export function PatientInfoForm({
  defaults,
  disabled,
  onSubmit,
}: PatientInfoFormProps) {
  const [fullName, setFullName] = useState(defaults?.fullName ?? '');
  const [phone, setPhone] = useState(defaults?.phone ?? '');
  const [dob, setDob] = useState(toDisplayDate(defaults?.dateOfBirth));
  const [relationship, setRelationship] = useState(
    defaults?.relationship || 'CHILD',
  );
  const [gender, setGender] = useState(defaults?.gender ?? '');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = fullName.trim().length >= 2 && !disabled;

  const handleSubmit = () => {
    const name = fullName.trim().replace(/\s+/g, ' ');
    const phoneValue = phone.trim();

    if (name.length < 2) {
      setError('Vui lòng nhập họ tên người khám.');
      return;
    }
    if (phoneValue && !PHONE_PATTERN.test(phoneValue)) {
      setError('Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.');
      return;
    }
    let dateOfBirth = '';
    if (dob.trim()) {
      const parsed = parseDisplayDate(dob.trim());
      if (!parsed) {
        setError('Ngày sinh không hợp lệ (dd/mm/yyyy).');
        return;
      }
      if (parsed > todayKey()) {
        setError('Ngày sinh không được lớn hơn hôm nay.');
        return;
      }
      dateOfBirth = parsed;
    }

    onSubmit({
      fullName: name,
      phone: phoneValue,
      dateOfBirth,
      relationship,
      gender,
    });
  };

  const clearError = () => setError(null);

  return (
    <View style={styles.form}>
      <TextInput
        accessibilityLabel="Họ tên người khám"
        editable={!disabled}
        maxLength={100}
        onChangeText={value => {
          setFullName(value);
          clearError();
        }}
        placeholder="Họ tên người khám"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        value={fullName}
      />
      <View style={styles.row}>
        <TextInput
          accessibilityLabel="Số điện thoại"
          editable={!disabled}
          keyboardType="phone-pad"
          maxLength={10}
          onChangeText={value => {
            setPhone(value.replace(/[^\d]/g, ''));
            clearError();
          }}
          placeholder="SĐT nếu có"
          placeholderTextColor="#94A3B8"
          style={[styles.input, styles.flexInput]}
          value={phone}
        />
        <TextInput
          accessibilityLabel="Ngày sinh"
          editable={!disabled}
          keyboardType="number-pad"
          maxLength={10}
          onChangeText={value => {
            setDob(maskDateInput(value));
            clearError();
          }}
          placeholder="Ngày sinh dd/mm/yyyy"
          placeholderTextColor="#94A3B8"
          style={[styles.input, styles.flexInput]}
          value={dob}
        />
      </View>

      <Text style={styles.groupLabel}>Quan hệ với bạn</Text>
      <View style={styles.chipRow}>
        {RELATIONSHIP_OPTIONS.map(option => {
          const active = relationship === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.82}
              disabled={disabled}
              onPress={() => setRelationship(option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.groupLabel}>Giới tính</Text>
      <View style={styles.chipRow}>
        {GENDER_OPTIONS.map(option => {
          const active = gender === option.value;
          return (
            <TouchableOpacity
              key={option.value || 'unknown'}
              activeOpacity={0.82}
              disabled={disabled}
              onPress={() => setGender(option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.86}
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={[styles.submit, !canSubmit && styles.submitDisabled]}
      >
        <Text style={styles.submitText}>Lưu hồ sơ</Text>
      </TouchableOpacity>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 7,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#334155',
    fontSize: 12,
    height: 38,
    paddingHorizontal: 11,
  },
  flexInput: {
    flex: 1,
    minWidth: 0,
  },
  groupLabel: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0863c5',
  },
  chipText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#0863c5',
  },
  submit: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    marginTop: 2,
  },
  submitDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  error: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },
});
