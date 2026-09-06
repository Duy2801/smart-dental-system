import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { Button, Screen } from '~src/components/ui';
import { SCREEN_NAME } from '~src/constants/screenName';
import { getClinicConfigInfo } from '~src/features/home/api';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import { PatientDrawerModal } from '~src/features/home/components/PatientDrawerModal';
import { PatientHomeHeader } from '~src/features/home/components/PatientHomeHeader';
import { usePatientDrawerActions } from '~src/features/home/hooks/usePatientDrawerActions';
import type { RootState } from '~src/reducers/store';
import {
  cancelPatientAppointment,
  getPatientAppointments,
} from '../api';
import { AppointmentWorkspaceHeader, AppointmentWorkspaceMode } from '../components/AppointmentWorkspaceHeader';
import { BookingModeView } from '../components/booking/BookingModeView';
import { ManageModeView } from '../components/workspace/ManageModeView';

type AppointmentWorkspaceScreenProps = {
  navigation?: any;
  route?: {
    params?: {
      dedicatedDoctorId?: string;
      initialMode?: AppointmentWorkspaceMode;
      initialServiceId?: string;
      initialMethodId?: string;
    };
  };
};

export default function AppointmentWorkspaceScreen({
  navigation,
  route,
}: AppointmentWorkspaceScreenProps) {
  const dedicatedDoctorId = route?.params?.dedicatedDoctorId || '';
  const initialMode = route?.params?.initialMode || 'booking';
  const initialServiceId = route?.params?.initialServiceId || '';
  const initialMethodId = route?.params?.initialMethodId || '';

  const { accessToken, isHydrated } = useSelector(
    (state: RootState) => state.login,
  );
  const user = useSelector((state: RootState) => state.login?.user ?? null);
  const isLoggedIn = Boolean(accessToken);

  const [mode, setMode] = useState<AppointmentWorkspaceMode>(initialMode);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const queryClient = useQueryClient();
  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  const clinicQuery = useQuery({
    queryKey: ['clinic-config'],
    queryFn: getClinicConfigInfo,
    staleTime: 5 * 60 * 1000,
  });

  // Appointments Query
  const appointmentsQuery = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: getPatientAppointments,
    enabled: isLoggedIn,
  });

  const upcomingAppointments = Array.isArray(appointmentsQuery.data?.upcoming)
    ? appointmentsQuery.data.upcoming
    : [];
  const historyAppointments = Array.isArray(appointmentsQuery.data?.history)
    ? appointmentsQuery.data.history
    : [];
  const allAppointments = [...upcomingAppointments, ...historyAppointments];

  // Cancel Appointment Mutation
  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) => {
      setCancellingId(appointmentId);
      return cancelPatientAppointment(appointmentId);
    },
    onSuccess: () => {
      setCancellingId(null);
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      Alert.alert('Thành công', 'Lịch hẹn đã được hủy.');
    },
    onError: (err: any) => {
      setCancellingId(null);
      Alert.alert(
        'Không thể hủy',
        err?.response?.data?.message || 'Có lỗi xảy ra khi hủy lịch hẹn. Vui lòng liên hệ phòng khám.',
      );
    },
  });

  const handleCancelAppointment = useCallback(
    (appointmentId: string) => {
      cancelMutation.mutate(appointmentId);
    },
    [cancelMutation],
  );

  const handleNotificationPress = useCallback(() => {
    const tabNavigation = navigation?.getParent?.();
    tabNavigation?.navigate?.(SCREEN_NAME.HOME, {
      screen: SCREEN_NAME.PATIENT_NOTIFICATIONS,
    });
  }, [navigation]);

  const renderTopHeader = () => (
    <PatientHomeHeader
      hasNotification={true}
      onMenuPress={() => setDrawerVisible(true)}
      onNotificationPress={handleNotificationPress}
      user={user}
    />
  );

  const renderDrawer = () => (
    <PatientDrawerModal
      clinicPhone={clinicQuery.data?.phone}
      isOpen={drawerVisible}
      onClose={() => setDrawerVisible(false)}
      onLogout={handleLogout}
      onNavigate={handleDrawerNavigate}
      user={user}
    />
  );

  // Unauthenticated Banner
  if (isHydrated && !isLoggedIn) {
    return (
      <Screen>
        {renderTopHeader()}
        <View style={styles.loginRequiredContainer}>
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 mb-4">
            <FontAwesome6 color="#0058bc" iconStyle="solid" name="calendar-days" size={28} />
          </View>
          <Text className="text-xl font-black text-slate-900 text-center">
            Đặt lịch khám nha khoa
          </Text>
          <Text className="mt-2 text-xs text-slate-500 text-center leading-5 max-w-[280px]">
            Đăng nhập để chọn người khám, dịch vụ, bác sĩ và khung giờ phù hợp. Tài khoản giúp phòng khám lưu hồ sơ và thông báo lịch hẹn cho bạn.
          </Text>
          <Button
            onPress={() => navigation?.navigate(SCREEN_NAME.PATIENT_LOGIN)}
            className="mt-6 w-full max-w-[260px]"
          >
            Đăng nhập để tiếp tục
          </Button>
        </View>
        {renderDrawer()}
      </Screen>
    );
  }

  return (
    <Screen>
      {renderTopHeader()}
      <View className="flex-1 px-4 pt-3">
        <AppointmentWorkspaceHeader
          mode={mode}
          title={
            mode === 'booking'
              ? 'Đặt lịch khám mới'
              : 'Quản lý lịch hẹn'
          }
          subtitle={
            mode === 'booking'
              ? 'Chọn dịch vụ, thời gian và bác sĩ phù hợp với bạn.'
              : 'Theo dõi lịch khám sắp tới, đổi lịch hoặc xem lịch sử các lần thăm khám.'
          }
          onSelectBooking={() => setMode('booking')}
          onSelectManage={() => setMode('manage')}
        />

        {mode === 'booking' ? (
          <BookingModeView
            dedicatedDoctorId={dedicatedDoctorId}
            initialServiceId={initialServiceId}
            initialMethodId={initialMethodId}
            isLoggedIn={isLoggedIn}
            upcomingAppointments={upcomingAppointments}
            onCancelBooking={() => setMode('manage')}
            onBookingComplete={() => setMode('manage')}
          />
        ) : (
          <ManageModeView
            appointments={allAppointments}
            upcoming={upcomingAppointments}
            historyItems={historyAppointments}
            loading={appointmentsQuery.isLoading}
            onRefresh={appointmentsQuery.refetch}
            isRefreshing={appointmentsQuery.isRefetching}
            onOpenBooking={() => setMode('booking')}
            onCancelAppointment={handleCancelAppointment}
            cancellingAppointmentId={cancellingId}
          />
        )}
      </View>
      <FloatingChatButton />
      {renderDrawer()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loginRequiredContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
