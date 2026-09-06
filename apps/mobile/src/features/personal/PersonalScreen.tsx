import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Screen } from '~src/components/ui';
import { SCREEN_NAME } from '~src/constants/screenName';
import { getClinicConfigInfo } from '~src/features/home/api';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import { PatientDrawerModal } from '~src/features/home/components/PatientDrawerModal';
import { PatientFooter } from '~src/features/home/components/PatientFooter';
import { PatientHomeHeader } from '~src/features/home/components/PatientHomeHeader';
import { usePatientDrawerActions } from '~src/features/home/hooks/usePatientDrawerActions';
import { setSession } from '~src/reducers/loginReducer';
import type { AppDispatch, RootState } from '~src/reducers/store';
import {
  apiGetPatientProfile,
  apiUpdatePatientProfile,
  formatDateToInput,
  getInitials,
  parseDateInputToISO,
} from './api';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import type { PatientProfileGender, ProfileFormState } from './types';

export default function PersonalScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  const loginState = useSelector((state: RootState) => state.login);
  const isLoggedIn = Boolean(loginState?.accessToken);
  const user = loginState?.user ?? null;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 1. Fetch patient profile
  const profileQuery = useQuery({
    queryKey: ['patient-profile'],
    queryFn: apiGetPatientProfile,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });

  const clinicQuery = useQuery({
    queryKey: ['clinic-config'],
    queryFn: getClinicConfigInfo,
    staleTime: 5 * 60 * 1000,
  });

  const profile = profileQuery.data;

  // 2. Form state initialized from profile
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: 'UNKNOWN',
    address: '',
  });

  useEffect(() => {
    if (profile) {
      const p = profile.patient || profile.patientProfile;
      setForm({
        fullName: profile.fullName || user?.fullName || '',
        phone: profile.phone || user?.phone || '',
        email: profile.email || user?.email || '',
        dateOfBirth: formatDateToInput(p?.dateOfBirth),
        gender: (p?.gender as PatientProfileGender) || 'UNKNOWN',
        address: p?.address || '',
      });
    } else if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
      }));
    }
  }, [profile, user]);

  const initials = useMemo(
    () => getInitials(form.fullName || profile?.fullName || user?.fullName),
    [form.fullName, profile?.fullName, user?.fullName],
  );

  // 3. Save profile changes
  const handleSaveProfile = async () => {
    if (saving) return;
    if (!form.fullName.trim()) {
      setStatusMsg({ type: 'error', text: 'Họ và tên không được để trống.' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const isoDob = parseDateInputToISO(form.dateOfBirth);
      const payload: {
        fullName: string;
        phone?: string;
        email?: string;
        dateOfBirth?: string;
        gender?: PatientProfileGender;
        address?: string;
      } = {
        fullName: form.fullName.trim(),
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (isoDob) payload.dateOfBirth = isoDob;
      if (form.gender && form.gender !== 'UNKNOWN') payload.gender = form.gender;
      if (form.address.trim()) payload.address = form.address.trim();

      const updatedUser = await apiUpdatePatientProfile(payload);

      if (loginState.accessToken && loginState.role && loginState.user) {
        dispatch(
          setSession({
            user: {
              ...loginState.user,
              id: updatedUser.id,
              fullName: updatedUser.fullName,
              email: updatedUser.email,
              phone: updatedUser.phone,
            },
            accessToken: loginState.accessToken,
            role: loginState.role,
          }),
        );
      }

      queryClient.setQueryData(['patient-profile'], updatedUser);
      await queryClient.invalidateQueries({ queryKey: ['patient-profile'] });

      setStatusMsg({
        type: 'success',
        text: 'Cập nhật thông tin cá nhân thành công!',
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      {/* Top Header Bar */}
      <PatientHomeHeader
        hasNotification={true}
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() =>
          navigation.navigate(SCREEN_NAME.PATIENT_NOTIFICATIONS as never)
        }
        user={user}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching}
            onRefresh={() => profileQuery.refetch()}
            colors={['#0863c5']}
            tintColor="#0863c5"
          />
        }
      >
        {!isLoggedIn ? (
          <View style={styles.loginRequiredCard}>
            <View style={styles.loginIconBox}>
              <FontAwesome6 color="#0863c5" iconStyle="solid" name="user-lock" size={28} />
            </View>
            <Text style={styles.loginTitle}>Xem thông tin cá nhân</Text>
            <Text style={styles.loginSub}>
              Đăng nhập để xem và cập nhật thông tin cá nhân, tài khoản y tế và lịch hẹn.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate(SCREEN_NAME.PATIENT_LOGIN as never)}
              style={styles.loginBtn}
            >
              <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        ) : profileQuery.isLoading && !profile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#0863c5" size="large" />
            <Text style={styles.loadingText}>Đang tải thông tin cá nhân...</Text>
          </View>
        ) : (
          <View style={styles.contentSection}>
            {/* Breadcrumb matching Web (Screenshot 1) */}
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.getParent()?.navigate(SCREEN_NAME.HOME as never)}
              >
                <Text style={styles.breadcrumbLink}>Trang chủ</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbSeparator}>/</Text>
              <Text style={styles.breadcrumbCurrent}>Thông tin cá nhân</Text>
            </View>

            {/* Main Form Card matching Web (Screenshot 1) */}
            <View style={styles.mainCard}>
              {/* Card Header Title */}
              <Text style={styles.cardHeaderTitle}>Thông tin cá nhân</Text>
              <View style={styles.cardDivider} />

              {/* Center Avatar Section matching Web (Screenshot 1) */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  {/* Small Edit Pen Icon Button on bottom left */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.alert(
                        'Ảnh đại diện',
                        'Tính năng tải ảnh đại diện sẽ được hỗ trợ trong phiên bản tiếp theo.',
                      );
                    }}
                    style={styles.avatarEditBtn}
                  >
                    <FontAwesome6 color="#475569" iconStyle="solid" name="pen" size={11} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Status Message Banner */}
              {statusMsg ? (
                <View
                  style={[
                    styles.statusBanner,
                    statusMsg.type === 'success'
                      ? styles.statusSuccess
                      : styles.statusError,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      statusMsg.type === 'success'
                        ? styles.statusTextSuccess
                        : styles.statusTextError,
                    ]}
                  >
                    {statusMsg.type === 'success' ? '✓ ' : '⚠️ '}
                    {statusMsg.text}
                  </Text>
                </View>
              ) : null}

              {/* Form Fields */}
              <View style={styles.formContainer}>
                {/* 1. Họ và tên */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Họ và tên</Text>
                  <TextInput
                    value={form.fullName}
                    onChangeText={text => setForm(prev => ({ ...prev, fullName: text }))}
                    placeholder="Khách hàng"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>

                {/* 2. Số điện thoại */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Số điện thoại</Text>
                  <TextInput
                    value={form.phone}
                    onChangeText={text => setForm(prev => ({ ...prev, phone: text }))}
                    placeholder="**** *** 035"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>

                {/* 3. Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    value={form.email}
                    onChangeText={text => setForm(prev => ({ ...prev, email: text }))}
                    placeholder="Email"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>

                {/* 4. Ngày sinh */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Ngày sinh</Text>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      value={form.dateOfBirth}
                      onChangeText={text => setForm(prev => ({ ...prev, dateOfBirth: text }))}
                      placeholder="DD/MM/YYYY (ví dụ: 12/05/1990)"
                      placeholderTextColor="#94A3B8"
                      style={styles.inputInner}
                    />
                    <FontAwesome6 color="#94A3B8" iconStyle="solid" name="calendar-days" size={15} />
                  </View>
                </View>

                {/* 5. Giới tính matching Web (Screenshot 1) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Giới tính</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsGenderDropdownOpen(prev => !prev)}
                    style={styles.dropdownSelect}
                  >
                    <Text
                      style={[
                        styles.dropdownSelectText,
                        form.gender === 'UNKNOWN' ? styles.dropdownPlaceholderText : null,
                      ]}
                    >
                      {form.gender === 'MALE'
                        ? 'Nam'
                        : form.gender === 'FEMALE'
                        ? 'Nữ'
                        : form.gender === 'OTHER'
                        ? 'Khác'
                        : 'Giới tính'}
                    </Text>
                    <FontAwesome6
                      color="#94A3B8"
                      iconStyle="solid"
                      name={isGenderDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={13}
                    />
                  </TouchableOpacity>

                  {isGenderDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {(
                        [
                          ['UNKNOWN', 'Giới tính'],
                          ['MALE', 'Nam'],
                          ['FEMALE', 'Nữ'],
                          ['OTHER', 'Khác'],
                        ] as const
                      ).map(([code, label]) => {
                        const isSelected = form.gender === code;
                        return (
                          <TouchableOpacity
                            key={code}
                            activeOpacity={0.7}
                            onPress={() => {
                              setForm(prev => ({
                                ...prev,
                                gender: code as PatientProfileGender,
                              }));
                              setIsGenderDropdownOpen(false);
                            }}
                            style={[
                              styles.dropdownItem,
                              isSelected ? styles.dropdownItemActive : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                isSelected ? styles.dropdownItemTextActive : null,
                              ]}
                            >
                              {label}
                            </Text>
                            {isSelected && (
                              <FontAwesome6
                                color="#0863c5"
                                iconStyle="solid"
                                name="check"
                                size={12}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* 6. Mật khẩu matching Web (Screenshot 1) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mật khẩu</Text>
                  <View style={styles.passwordRow}>
                    <View style={styles.passwordLeft}>
                      <FontAwesome6 color="#94A3B8" iconStyle="solid" name="lock" size={14} />
                      <Text style={styles.passwordDots}>••••••••••</Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setIsPasswordModalOpen(true)}
                      style={styles.passwordUpdateBtn}
                    >
                      <Text style={styles.passwordUpdateText}>Cập nhật</Text>
                      <FontAwesome6 color="#0863c5" iconStyle="solid" name="rotate" size={11} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 7. Centered Save Button matching Web (Screenshot 1) */}
                <View style={styles.saveBtnContainer}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={saving}
                    onPress={handleSaveProfile}
                    style={[styles.saveBtn, saving ? styles.saveBtnDisabled : null]}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <FontAwesome6
                          color="#FFFFFF"
                          iconStyle="solid"
                          name="floppy-disk"
                          size={15}
                        />
                        <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Clinic Footer */}
        <View style={styles.footerContainer}>
          <PatientFooter clinic={clinicQuery.data} />
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Floating Chat Button */}
      <FloatingChatButton />

      {/* Drawer */}
      <PatientDrawerModal
        clinicPhone={clinicQuery.data?.phone}
        isOpen={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onNavigate={handleDrawerNavigate}
        onLogout={handleLogout}
        user={user}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderColor: '#EFF6FF',
    borderRadius: 44,
    borderWidth: 4,
    elevation: 4,
    height: 88,
    justifyContent: 'center',
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    width: 88,
  },
  avatarEditBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderWidth: 1,
    bottom: -2,
    elevation: 3,
    height: 32,
    justifyContent: 'center',
    left: -2,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    width: 32,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  avatarWrapper: {
    position: 'relative',
  },
  breadcrumbCurrent: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  breadcrumbLink: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  breadcrumbRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  breadcrumbSeparator: {
    color: '#94A3B8',
    fontSize: 12,
  },
  cardDivider: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginBottom: 16,
    marginTop: 12,
  },
  cardHeaderTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  contentSection: {
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  footerContainer: {
    marginHorizontal: -16,
    marginTop: 16,
  },
  formContainer: {
    width: '100%',
  },
  dropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#0863c5',
    fontWeight: '800',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 4,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dropdownPlaceholderText: {
    color: '#94A3B8',
  },
  dropdownSelect: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownSelectText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputInner: {
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  inputWithIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 64,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  loginBtn: {
    backgroundColor: '#0863c5',
    borderRadius: 14,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  loginIconBox: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    height: 60,
    justifyContent: 'center',
    marginBottom: 12,
    width: 60,
  },
  loginRequiredCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    marginVertical: 24,
    padding: 24,
  },
  loginSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  loginTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  passwordDots: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 10,
  },
  passwordLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  passwordRow: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  passwordUpdateBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  passwordUpdateText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 14,
    elevation: 2,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveBtnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  scrollContainer: {
    paddingBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statusBanner: {
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusError: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextError: {
    color: '#9F1239',
  },
  statusTextSuccess: {
    color: '#065F46',
  },
});
