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
  getPatientNotificationsPaginated,
  markAllPatientNotificationsRead,
  markPatientNotificationRead,
  type PatientNotification,
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
  const [page, setPage] = useState(1);
  const limit = 5;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const user = useSelector((state: RootState) => state.login?.user ?? null);
  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  const handleFilterChange = (filter: NotificationFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const notificationsQuery = useQuery({
    queryFn: () =>
      getPatientNotificationsPaginated({
        page,
        limit,
        type:
          activeFilter === 'APPOINTMENTS'
            ? 'APPOINTMENTS'
            : activeFilter === 'PAYMENTS'
            ? 'PAYMENTS'
            : undefined,
        unreadOnly: activeFilter === 'UNREAD',
      }),
    queryKey: ['patient', 'notifications', activeFilter, page, limit],
  });

  const readOneMutation = useMutation({
    mutationFn: markPatientNotificationRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['patient', 'notifications'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllPatientNotificationsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['patient', 'notifications'] }),
  });

  const notifications = useMemo(
    () => notificationsQuery.data?.data ?? [],
    [notificationsQuery.data?.data],
  );

  const meta = notificationsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total ?? 0;
  const unread = meta?.unreadCount ?? notifications.filter((item: PatientNotification) => !item.isRead).length;

  const paginationRange = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, '...', totalPages];
    }
    if (page >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', page, '...', totalPages];
  }, [page, totalPages]);

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

  const renderPaginationFooter = () => {
    if (totalPages <= 1) return <View style={styles.footerSpacing} />;

    return (
      <View style={styles.paginationCard}>
        <View style={styles.paginationMetaRow}>
          <Text style={styles.paginationMetaText}>
            Hiển thị trang <Text style={styles.paginationMetaBold}>{page}</Text> /{' '}
            <Text style={styles.paginationMetaBold}>{totalPages}</Text>{' '}
            (Tổng số {totalItems} thông báo)
          </Text>
        </View>

        <View style={styles.paginationControlsRow}>
          {/* Previous Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={[
              styles.pageBtnNav,
              page <= 1 && styles.pageBtnNavDisabled,
            ]}
          >
            <FontAwesome6
              color={page <= 1 ? '#94A3B8' : '#0863c5'}
              iconStyle="solid"
              name="chevron-left"
              size={11}
            />
            <Text
              style={[
                styles.pageBtnNavText,
                page <= 1 && styles.pageBtnNavTextDisabled,
              ]}
            >
              Trước
            </Text>
          </TouchableOpacity>

          {/* Page numbers */}
          <View style={styles.pageNumbersGroup}>
            {paginationRange.map((item, idx) => {
              if (item === '...') {
                return (
                  <View key={`ellipsis-${idx}`} style={styles.pageEllipsis}>
                    <Text style={styles.pageEllipsisText}>...</Text>
                  </View>
                );
              }

              const pageNum = item as number;
              const isCurrent = pageNum === page;

              return (
                <TouchableOpacity
                  key={`page-${pageNum}`}
                  activeOpacity={0.8}
                  onPress={() => setPage(pageNum)}
                  style={[
                    styles.pagePill,
                    isCurrent ? styles.pagePillActive : styles.pagePillDefault,
                  ]}
                >
                  <Text
                    style={[
                      styles.pagePillText,
                      isCurrent
                        ? styles.pagePillTextActive
                        : styles.pagePillTextDefault,
                    ]}
                  >
                    {pageNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={[
              styles.pageBtnNav,
              page >= totalPages && styles.pageBtnNavDisabled,
            ]}
          >
            <Text
              style={[
                styles.pageBtnNavText,
                page >= totalPages && styles.pageBtnNavTextDisabled,
              ]}
            >
              Sau
            </Text>
            <FontAwesome6
              color={page >= totalPages ? '#94A3B8' : '#0863c5'}
              iconStyle="solid"
              name="chevron-right"
              size={11}
            />
          </TouchableOpacity>
        </View>
      </View>
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
          data={notifications}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="Chưa có thông báo"
              description={
                activeFilter === 'UNREAD'
                  ? 'Bạn đã đọc tất cả thông báo.'
                  : activeFilter === 'APPOINTMENTS'
                  ? 'Chưa có thông báo lịch hẹn nào.'
                  : activeFilter === 'PAYMENTS'
                  ? 'Chưa có thông báo thanh toán nào.'
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
                      <Text className="text-xl font-black text-[#07366F]">
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
                    <Text className="mt-1 text-xs font-medium leading-5 text-slate-600">
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
                      name="check-double"
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
                      onPress={() => handleFilterChange(tab.id)}
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
          ListFooterComponent={renderPaginationFooter}
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
    backgroundColor: '#0863c5',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
  },
  // Nền sáng, chữ tối để dễ đọc; thanh xanh bên trái giữ điểm nhấn thương hiệu
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DBEAFE',
    borderLeftColor: '#0863c5',
    borderLeftWidth: 4,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  heroUnreadBadge: {
    backgroundColor: '#0863c5',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroUnreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  listContent: {
    gap: 12,
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    position: 'relative',
  },
  notificationCardRead: {
    borderColor: '#E2E8F0',
  },
  notificationCardUnread: {
    borderColor: '#BAE6FD',
    elevation: 1,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  typeIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  unreadDot: {
    backgroundColor: '#0284C7',
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    right: 14,
    top: 14,
    width: 8,
  },

  // Pagination Styles
  footerSpacing: {
    height: 20,
  },
  paginationCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 8,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  paginationMetaRow: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  paginationMetaText: {
    color: '#64748B',
    fontSize: 11,
  },
  paginationMetaBold: {
    color: '#0F172A',
    fontWeight: '800',
  },
  paginationControlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  pageBtnNav: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pageBtnNavDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  pageBtnNavText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
  },
  pageBtnNavTextDisabled: {
    color: '#94A3B8',
  },
  pageNumbersGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  pagePill: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    minWidth: 32,
    paddingHorizontal: 8,
  },
  pagePillDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  pagePillActive: {
    backgroundColor: '#0863c5',
    borderColor: '#0863c5',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  pagePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pagePillTextDefault: {
    color: '#334155',
  },
  pagePillTextActive: {
    color: '#FFFFFF',
  },
  pageEllipsis: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pageEllipsisText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
