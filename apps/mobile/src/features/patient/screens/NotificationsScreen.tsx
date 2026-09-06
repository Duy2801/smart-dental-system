import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useSelector } from 'react-redux';
import { EmptyState, Screen, ScreenList } from '~src/components/ui';
import { PatientDrawerModal } from '~src/features/home/components/PatientDrawerModal';
import { PatientHomeHeader } from '~src/features/home/components/PatientHomeHeader';
import { usePatientDrawerActions } from '~src/features/home/hooks/usePatientDrawerActions';
import type { RootState } from '~src/reducers/store';
import {
  getPatientNotifications,
  markAllPatientNotificationsRead,
  markPatientNotificationRead,
  PatientNotification,
} from '../api';

type NotificationFilter = 'ALL' | 'UNREAD' | 'APPOINTMENTS' | 'PAYMENTS';

const filterTabs: { id: NotificationFilter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'UNREAD', label: 'Chưa đọc' },
  { id: 'APPOINTMENTS', label: 'Lịch hẹn' },
  { id: 'PAYMENTS', label: 'Thanh toán' },
];

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const user = useSelector((state: RootState) => state.login?.user ?? null);
  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();
  const notificationsQuery = useQuery({
    queryFn: getPatientNotifications,
    queryKey: ['patient', 'notifications'],
  });
  const readOneMutation = useMutation({
    mutationFn: markPatientNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient', 'notifications'] }),
  });
  const readAllMutation = useMutation({
    mutationFn: markAllPatientNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient', 'notifications'] }),
  });

  const notifications = useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data],
  );
  const unread = notifications.filter(item => !item.isRead).length;
  const filteredNotifications = useMemo(
    () => filterNotifications(notifications, activeFilter),
    [activeFilter, notifications],
  );

  const renderNotification = ({ item }: { item: PatientNotification }) => {
    const config = getNotificationTypeConfig(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => {
          if (!item.isRead) readOneMutation.mutate(item.id);
        }}
        style={[
          styles.notificationCard,
          item.isRead ? styles.notificationCardRead : styles.notificationCardUnread,
        ]}
      >
        {!item.isRead ? <View style={styles.unreadDot} /> : null}

        <View style={[styles.typeIcon, { backgroundColor: config.iconBg }]}>
          <FontAwesome6
            color={config.iconColor}
            iconStyle="solid"
            name={config.icon as never}
            size={15}
          />
        </View>

        <View className="min-w-0 flex-1 pr-2">
          <View className="mb-1 flex-row flex-wrap items-center gap-2">
            <View style={[styles.typeBadge, { backgroundColor: config.badgeBg }]}>
              <Text style={[styles.typeBadgeText, { color: config.badgeColor }]}>
                {config.label}
              </Text>
            </View>
            <Text className="text-[11px] font-semibold text-slate-400">
              {item.createdAt}
            </Text>
          </View>

          <Text
            numberOfLines={2}
            className={`text-sm font-black leading-5 ${
              item.isRead ? 'text-slate-700' : 'text-slate-900'
            }`}
          >
            {item.title}
          </Text>
          <Text numberOfLines={2} className="mt-1 text-xs leading-5 text-slate-500">
            {item.message}
          </Text>

          <TouchableOpacity
            activeOpacity={0.82}
            className="mt-3 self-start flex-row items-center gap-1"
            onPress={() => {
              if (!item.isRead) readOneMutation.mutate(item.id);
            }}
          >
            <Text className="text-xs font-black text-[#0863c5]">
              Xem chi tiết
            </Text>
            <FontAwesome6
              color="#0863c5"
              iconStyle="solid"
              name="chevron-right"
              size={9}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      <PatientHomeHeader
        hasNotification={unread > 0}
        notificationCount={unread}
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() => notificationsQuery.refetch()}
        user={user}
      />
      {notificationsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0875D1" />
        </View>
      ) : (
        <ScreenList
          contentContainerStyle={styles.listContent}
          data={filteredNotifications}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="Chưa có thông báo"
              description={
                activeFilter === 'UNREAD'
                  ? 'Bạn đã đọc tất cả thông báo.'
                  : 'Nhắc lịch, thanh toán và ưu đãi sẽ xuất hiện tại đây.'
              }
            />
          }
          ListHeaderComponent={
            <View className="gap-4">
              <View style={styles.heroCard}>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-xl font-black text-white">
                        Trung tâm thông báo
                      </Text>
                      {unread > 0 ? (
                        <View style={styles.heroUnreadBadge}>
                          <Text style={styles.heroUnreadText}>
                            {unread} chưa đọc
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="mt-1 text-xs font-semibold leading-5 text-blue-100">
                      Cập nhật tức thì trạng thái lịch hẹn, hóa đơn thanh toán
                      và ưu đãi độc quyền.
                    </Text>
                  </View>
                </View>

                {unread > 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.84}
                    disabled={readAllMutation.isPending}
                    onPress={() => readAllMutation.mutate()}
                    style={styles.heroAction}
                  >
                    <FontAwesome6
                      color="#FFFFFF"
                      iconStyle="solid"
                      name="tooth"
                      size={13}
                    />
                    <Text className="text-xs font-black text-white">
                      {readAllMutation.isPending
                        ? 'Đang xử lý...'
                        : 'Đánh dấu tất cả đã đọc'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View className="flex-row gap-2">
                {filterTabs.map(tab => {
                  const isActive = activeFilter === tab.id;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.82}
                      key={tab.id}
                      onPress={() => setActiveFilter(tab.id)}
                      style={[
                        styles.filterTab,
                        isActive && styles.filterTabActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
                          isActive && styles.filterTabTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          onRefresh={notificationsQuery.refetch}
          refreshing={notificationsQuery.isRefetching}
          renderItem={renderNotification}
        />
      )}

      <PatientDrawerModal
        isOpen={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onLogout={handleLogout}
        onNavigate={handleDrawerNavigate}
        user={user}
      />
    </Screen>
  );
}

function filterNotifications(
  notifications: PatientNotification[],
  activeFilter: NotificationFilter,
) {
  if (activeFilter === 'UNREAD') {
    return notifications.filter(item => !item.isRead);
  }

  if (activeFilter === 'APPOINTMENTS') {
    return notifications.filter(item =>
      item.type.toUpperCase().includes('APPOINTMENT'),
    );
  }

  if (activeFilter === 'PAYMENTS') {
    return notifications.filter(item =>
      item.type.toUpperCase().includes('PAYMENT'),
    );
  }

  return notifications;
}

function getNotificationTypeConfig(type: string) {
  const normalizedType = type.toUpperCase();

  if (normalizedType.includes('APPOINTMENT')) {
    return {
      badgeBg: '#DBEAFE',
      badgeColor: '#0058bc',
      icon: 'calendar-check',
      iconBg: '#EFF6FF',
      iconColor: '#0058bc',
      label: normalizedType.includes('REMINDER') ? 'Nhắc lịch' : 'Lịch hẹn',
    };
  }

  if (normalizedType.includes('PAYMENT')) {
    return {
      badgeBg: '#D1FAE5',
      badgeColor: '#047857',
      icon: 'credit-card',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      label: 'Thanh toán',
    };
  }

  if (normalizedType.includes('PROMOTION') || normalizedType.includes('MARKETING')) {
    return {
      badgeBg: '#FEF3C7',
      badgeColor: '#92400E',
      icon: 'tag',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      label: 'Ưu đãi',
    };
  }

  return {
    badgeBg: '#F1F5F9',
    badgeColor: '#475569',
    icon: 'bell',
    iconBg: '#F8FAFC',
    iconColor: '#64748B',
    label: 'Hệ thống',
  };
}

const styles = StyleSheet.create({
  filterTab: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 8,
  },
  filterTabActive: {
    backgroundColor: '#0863c5',
    borderColor: '#0863c5',
    elevation: 2,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  filterTabText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  heroAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 42,
  },
  heroCard: {
    backgroundColor: '#0863c5',
    borderRadius: 18,
    elevation: 4,
    padding: 18,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  heroUnreadBadge: {
    backgroundColor: '#FFE4E6',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  heroUnreadText: {
    color: '#E11D48',
    fontSize: 11,
    fontWeight: '900',
  },
  listContent: {
    gap: 12,
    paddingTop: 16,
  },
  notificationCard: {
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 15,
    position: 'relative',
  },
  notificationCardRead: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    opacity: 0.86,
  },
  notificationCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    elevation: 2,
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  typeIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  unreadDot: {
    backgroundColor: '#0058bc',
    borderColor: '#DBEAFE',
    borderRadius: 999,
    borderWidth: 4,
    height: 14,
    position: 'absolute',
    right: 12,
    top: 12,
    width: 14,
  },
});
