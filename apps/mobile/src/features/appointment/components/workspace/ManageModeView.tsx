import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useAppointmentWorkspaceView } from '../../hooks/useAppointmentWorkspaceView';
import type { AppointmentItem, AppointmentStatus } from '../../types';
import { PatientFooter } from '~src/features/home/components/PatientFooter';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { AppointmentRecordCard } from './AppointmentRecordCard';
import { RescheduleAppointmentModal } from './RescheduleAppointmentModal';

type ManageModeViewProps = {
  appointments: AppointmentItem[];
  upcoming: AppointmentItem[];
  historyItems: AppointmentItem[];
  loading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenBooking: () => void;
  onCancelAppointment: (appointmentId: string) => void;
  cancellingAppointmentId: string | null;
};

export function ManageModeView({
  upcoming,
  historyItems,
  loading,
  onRefresh,
  isRefreshing,
  onOpenBooking,
  onCancelAppointment,
  cancellingAppointmentId,
}: ManageModeViewProps) {
  const [activeMainTab, setActiveMainTab] = useState<'upcoming' | 'history'>(
    'upcoming',
  );
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>(
    'all',
  );
  const [selectedDetail, setSelectedDetail] = useState<AppointmentItem | null>(
    null,
  );
  const [reschedulingAppointment, setReschedulingAppointment] =
    useState<AppointmentItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentItem | null>(
    null,
  );

  const { filteredUpcoming, history } = useAppointmentWorkspaceView({
    upcoming,
    historyItems,
    query,
    statusFilter,
  });

  const filterTabsUpcoming: {
    value: AppointmentStatus | 'all';
    label: string;
  }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
  ];

  const filterTabsHistory: {
    value: AppointmentStatus | 'all';
    label: string;
  }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const currentFilterTabs =
    activeMainTab === 'upcoming' ? filterTabsUpcoming : filterTabsHistory;
  const currentList = activeMainTab === 'upcoming' ? filteredUpcoming : history;
  const totalCount =
    activeMainTab === 'upcoming' ? upcoming.length : historyItems.length;

  const handleCancelPrompt = (item: AppointmentItem) => {
    setCancelTarget(item);
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget) return;
    onCancelAppointment(cancelTarget.id);
    setCancelTarget(null);
  };

  const renderHeader = () => (
    <View className="space-y-4 pb-2">
      {/* Search Input Box */}
      <View style={styles.searchContainer}>
        <FontAwesome6
          color="#94A3B8"
          iconStyle="solid"
          name="magnifying-glass"
          size={14}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm theo bác sĩ, dịch vụ, người khám..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <FontAwesome6
              color="#94A3B8"
              iconStyle="solid"
              name="circle-xmark"
              size={14}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 2 Main Tabs: Lịch Hẹn Sắp Tới vs Lịch Sử Đặt */}
      <View style={styles.mainTabsContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveMainTab('upcoming');
            setStatusFilter('all');
          }}
          style={[
            styles.mainTabButton,
            activeMainTab === 'upcoming' && styles.mainTabButtonActive,
          ]}
        >
          <FontAwesome6
            color={activeMainTab === 'upcoming' ? '#0058bc' : '#64748B'}
            iconStyle="solid"
            name="calendar-days"
            size={13}
          />
          <Text
            style={[
              styles.mainTabText,
              activeMainTab === 'upcoming'
                ? styles.mainTabTextActive
                : styles.mainTabTextInactive,
            ]}
          >
            Lịch Hẹn Sắp Tới
          </Text>
          <View
            style={[
              styles.badgePill,
              activeMainTab === 'upcoming'
                ? styles.badgePillActive
                : styles.badgePillInactive,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                activeMainTab === 'upcoming'
                  ? styles.badgeTextActive
                  : styles.badgeTextInactive,
              ]}
            >
              {upcoming.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveMainTab('history');
            setStatusFilter('all');
          }}
          style={[
            styles.mainTabButton,
            activeMainTab === 'history' && styles.mainTabButtonActive,
          ]}
        >
          <FontAwesome6
            color={activeMainTab === 'history' ? '#0058bc' : '#64748B'}
            iconStyle="solid"
            name="file-lines"
            size={13}
          />
          <Text
            style={[
              styles.mainTabText,
              activeMainTab === 'history'
                ? styles.mainTabTextActive
                : styles.mainTabTextInactive,
            ]}
          >
            Lịch Sử Đặt
          </Text>
          <View
            style={[
              styles.badgePill,
              activeMainTab === 'history'
                ? styles.badgePillActive
                : styles.badgePillInactive,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                activeMainTab === 'history'
                  ? styles.badgeTextActive
                  : styles.badgeTextInactive,
              ]}
            >
              {historyItems.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Sub-Filters Row */}
      <View className="flex-row items-center justify-between mt-1">
        <View className="flex-row items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          {currentFilterTabs.map(item => {
            const active = statusFilter === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.8}
                onPress={() => setStatusFilter(item.value)}
                style={[
                  styles.subFilterChip,
                  active && styles.subFilterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    active
                      ? styles.subFilterTextActive
                      : styles.subFilterTextInactive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-[11px] font-bold text-slate-400">
          {currentList.length}/{totalCount} cuộc hẹn
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      {loading ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator color="#0058bc" size="large" />
          <Text className="mt-3 text-xs font-bold text-slate-500">
            Đang tải danh sách lịch hẹn...
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={
            <PatientFooter style={{ marginHorizontal: -16 }} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              colors={['#0058bc']}
              onRefresh={onRefresh}
              refreshing={isRefreshing}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 mb-3">
                <FontAwesome6
                  color="#0058bc"
                  iconStyle="solid"
                  name="calendar"
                  size={24}
                />
              </View>
              <Text className="text-sm font-black text-slate-800">
                {activeMainTab === 'upcoming'
                  ? 'Không tìm thấy cuộc hẹn sắp tới nào.'
                  : 'Không tìm thấy lịch sử cuộc hẹn nào.'}
              </Text>
              <Text className="mt-1 text-xs text-slate-400 text-center max-w-[260px]">
                {activeMainTab === 'upcoming'
                  ? 'Đặt lịch khám ngay để được tư vấn và điều trị với các bác sĩ chuyên khoa giỏi.'
                  : 'Các cuộc hẹn đã hoàn thành hoặc đã hủy sẽ được lưu trữ tại đây.'}
              </Text>
              {activeMainTab === 'upcoming' ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onOpenBooking}
                  style={styles.emptyCtaButton}
                >
                  <FontAwesome6
                    color="#FFFFFF"
                    iconStyle="solid"
                    name="calendar-plus"
                    size={13}
                  />
                  <Text style={styles.emptyCtaText}>Đặt Lịch Khám Ngay</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const now = Date.now();
            const scheduledTime = new Date(item.scheduledAt).getTime();
            const hoursUntil = (scheduledTime - now) / (1000 * 60 * 60);
            const isUpcoming = activeMainTab === 'upcoming';
            const isPendingOrConfirmed =
              item.status === 'pending' || item.status === 'confirmed';

            const canCancel =
              isUpcoming && isPendingOrConfirmed && hoursUntil >= 12;
            const canReschedule =
              isUpcoming &&
              isPendingOrConfirmed &&
              hoursUntil >= 6 &&
              (item.rescheduleCount ?? 0) < 1;

            return (
              <View className="mb-3">
                <AppointmentRecordCard
                  appointment={item}
                  onViewDetail={() => setSelectedDetail(item)}
                  onReschedule={
                    canReschedule
                      ? () => setReschedulingAppointment(item)
                      : undefined
                  }
                  onCancel={
                    isUpcoming && isPendingOrConfirmed
                      ? () => handleCancelPrompt(item)
                      : undefined
                  }
                  canCancel={canCancel}
                  isCancelling={cancellingAppointmentId === item.id}
                />
              </View>
            );
          }}
        />
      )}

      {/* Modals */}
      <AppointmentDetailModal
        appointment={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />

      {reschedulingAppointment ? (
        <RescheduleAppointmentModal
          appointment={reschedulingAppointment}
          onClose={() => setReschedulingAppointment(null)}
        />
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setCancelTarget(null)}
        transparent
        visible={Boolean(cancelTarget)}
      >
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalCard}>
            <View style={styles.cancelModalHeader}>
              <View style={styles.cancelIconWrap}>
                <FontAwesome6
                  color="#DC2626"
                  iconStyle="solid"
                  name="calendar-xmark"
                  size={22}
                />
              </View>
              <TouchableOpacity
                accessibilityLabel="Đóng"
                activeOpacity={0.75}
                onPress={() => setCancelTarget(null)}
                style={styles.cancelCloseButton}
              >
                <FontAwesome6
                  color="#64748B"
                  iconStyle="solid"
                  name="xmark"
                  size={14}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.cancelTitle}>Hủy lịch hẹn?</Text>
            <Text style={styles.cancelMessage}>
              Bạn có chắc chắn muốn hủy lịch khám với{' '}
              <Text style={styles.cancelHighlight}>
                BS. {cancelTarget?.doctor}
              </Text>{' '}
              vào ngày{' '}
              <Text style={styles.cancelHighlight}>{cancelTarget?.date}</Text>?
            </Text>

            <View style={styles.cancelInfoBox}>
              <FontAwesome6
                color="#D97706"
                iconStyle="solid"
                name="circle-info"
                size={13}
              />
              <Text style={styles.cancelInfoText}>
                Lịch sau khi hủy sẽ được cập nhật trong danh sách của bạn.
              </Text>
            </View>

            <View style={styles.cancelActionRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setCancelTarget(null)}
                style={styles.cancelKeepButton}
              >
                <Text style={styles.cancelKeepText}>Giữ lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmCancel}
                style={styles.cancelConfirmButton}
              >
                <FontAwesome6
                  color="#FFFFFF"
                  iconStyle="solid"
                  name="check"
                  size={12}
                />
                <Text style={styles.cancelConfirmText}>Xác nhận hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cancelActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelCloseButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  cancelConfirmButton: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    elevation: 3,
    flex: 1.2,
    flexDirection: 'row',
    gap: 7,
    height: 46,
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  cancelConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  cancelHighlight: {
    color: '#0F172A',
    fontWeight: '900',
  },
  cancelIconWrap: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 18,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  cancelInfoBox: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    padding: 12,
  },
  cancelInfoText: {
    color: '#92400E',
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 17,
  },
  cancelKeepButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    flex: 0.9,
    height: 46,
    justifyContent: 'center',
  },
  cancelKeepText: {
    color: '#0058bc',
    fontSize: 12,
    fontWeight: '900',
  },
  cancelMessage: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: 8,
  },
  cancelModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 12,
    marginHorizontal: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
  },
  cancelModalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelModalOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    flex: 1,
    justifyContent: 'center',
  },
  cancelTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 18,
  },
  badgePill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  badgePillActive: {
    backgroundColor: '#EFF6FF',
  },
  badgePillInactive: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  badgeTextActive: {
    color: '#0058bc',
  },
  badgeTextInactive: {
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  emptyCtaButton: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 14,
    elevation: 2,
    flexDirection: 'row',
    gap: 7,
    height: 42,
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 0,
  },
  mainTabButton: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2.5,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  mainTabButtonActive: {
    borderBottomColor: '#0058bc',
  },
  mainTabsContainer: {
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '900',
  },
  mainTabTextActive: {
    color: '#0058bc',
  },
  mainTabTextInactive: {
    color: '#64748B',
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 42,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    padding: 0,
  },
  subFilterChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  subFilterChipActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  subFilterText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subFilterTextActive: {
    color: '#0058bc',
  },
  subFilterTextInactive: {
    color: '#64748B',
  },
});
