import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { Screen, toast } from '~src/components/ui';
import { CACHE_TIMES, queryKeys } from '~src/config/queryClient';
import { SCREEN_NAME } from '~src/constants/screenName';
import { LoginRequiredView } from '~src/features/auth/components/LoginRequiredView';
import { getClinicConfigInfo } from '~src/features/home/api';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import { PatientDrawerModal } from '~src/features/home/components/PatientDrawerModal';
import { PatientHomeHeader } from '~src/features/home/components/PatientHomeHeader';
import { usePatientDrawerActions } from '~src/features/home/hooks/usePatientDrawerActions';
import type { RootState } from '~src/reducers/store';
import { cancelPatientAppointment, getPatientAppointments } from '../api';
import {
  AppointmentWorkspaceHeader,
  AppointmentWorkspaceMode,
} from '../components/AppointmentWorkspaceHeader';
import { BookingModeView } from '../components/booking/BookingModeView';
import { ManageModeView } from '../components/workspace/ManageModeView';
import { getBookingErrorMessage } from '../utils/bookingErrorMessage';

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
  // Màn hình nằm trong tab nên không bị huỷ khi rời đi. Mỗi lần được mở lại kèm tham số mới
  // (vd. "Đặt lịch với bác sĩ" từ trang bác sĩ) thì làm mới form để bắt đầu lại từ bước 1, giống web.
  const [bookingFormKey, setBookingFormKey] = useState(0);
  const routeParams = route?.params;
  useEffect(() => {
    if (!routeParams) return;
    setMode(routeParams.initialMode || 'booking');
    setBookingFormKey(current => current + 1);
  }, [routeParams]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const queryClient = useQueryClient();
  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  const clinicQuery = useQuery({
    queryKey: queryKeys.clinicConfig,
    queryFn: getClinicConfigInfo,
    staleTime: CACHE_TIMES.CLINIC_CONFIG.staleTime,
    gcTime: CACHE_TIMES.CLINIC_CONFIG.gcTime,
  });

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments.list(),
    queryFn: getPatientAppointments,
    enabled: isLoggedIn,
    staleTime: CACHE_TIMES.APPOINTMENTS.staleTime,
    gcTime: CACHE_TIMES.APPOINTMENTS.gcTime,
  });

  const upcomingAppointments = Array.isArray(appointmentsQuery.data?.upcoming)
    ? appointmentsQuery.data.upcoming
    : [];
  const historyAppointments = Array.isArray(appointmentsQuery.data?.history)
    ? appointmentsQuery.data.history
    : [];
  const allAppointments = [...upcomingAppointments, ...historyAppointments];

  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) => {
      setCancellingId(appointmentId);
      return cancelPatientAppointment(appointmentId);
    },
    onSuccess: () => {
      setCancellingId(null);
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.list(),
      });
      toast.success(
        'Đã gửi yêu cầu hủy',
        'Slot bác sĩ đã được giải phóng. Lễ tân sẽ xác nhận hoàn tất thủ tục hủy.',
      );
    },
    onError: (err: any) => {
      setCancellingId(null);
      toast.error('Không thể hủy lịch', getBookingErrorMessage(err));
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

  if (isHydrated && !isLoggedIn) {
    return (
      <Screen>
        {renderTopHeader()}
        <LoginRequiredView
          actionLabel="Đăng nhập để đặt lịch"
          description="Đăng nhập để chọn dịch vụ, bác sĩ và khung giờ khám phù hợp với bạn."
          icon="calendar-days"
          title="Đặt lịch khám nha khoa"
        />
        <FloatingChatButton />
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
          onSelectBooking={() => setMode('booking')}
          onSelectManage={() => setMode('manage')}
          subtitle={
            mode === 'booking'
              ? 'Chọn dịch vụ, thời gian và bác sĩ phù hợp với bạn.'
              : 'Theo dõi lịch khám sắp tới, đổi lịch hoặc xem lịch sử các lần thăm khám.'
          }
          title={mode === 'booking' ? 'Đặt lịch khám mới' : 'Quản lý lịch hẹn'}
        />

        {mode === 'booking' ? (
          <BookingModeView
            key={`${bookingFormKey}-${dedicatedDoctorId || 'general'}-${initialServiceId}`}
            dedicatedDoctorId={dedicatedDoctorId}
            initialMethodId={initialMethodId}
            initialServiceId={initialServiceId}
            isLoggedIn={isLoggedIn}
            onBookingComplete={() => setMode('manage')}
            onCancelBooking={() => setMode('manage')}
            upcomingAppointments={upcomingAppointments}
          />
        ) : (
          <ManageModeView
            appointments={allAppointments}
            cancellingAppointmentId={cancellingId}
            historyItems={historyAppointments}
            isRefreshing={appointmentsQuery.isRefetching}
            loading={appointmentsQuery.isLoading}
            onCancelAppointment={handleCancelAppointment}
            onOpenBooking={() => setMode('booking')}
            onRefresh={appointmentsQuery.refetch}
            upcoming={upcomingAppointments}
          />
        )}
      </View>
      <FloatingChatButton />
      {renderDrawer()}
    </Screen>
  );
}
