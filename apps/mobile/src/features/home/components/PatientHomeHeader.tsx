import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  getPatientNotifications,
  markPatientNotificationRead,
} from '~src/features/patient/api';

type PatientHomeHeaderProps = {
  hasNotification?: boolean;
  notificationCount?: number;
  onMenuPress: () => void;
  onNotificationPress: () => void;
  user?: unknown;
};

export function PatientHomeHeader({
  hasNotification = true,
  notificationCount,
  onMenuPress,
  onNotificationPress,
}: PatientHomeHeaderProps) {
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const notificationsQuery = useQuery({
    enabled: previewOpen || notificationCount === undefined,
    queryFn: getPatientNotifications,
    queryKey: ['patient', 'notifications'],
    staleTime: 30000,
  });
  const markReadMutation = useMutation({
    mutationFn: markPatientNotificationRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['patient', 'notifications'] }),
  });

  const previewNotifications = useMemo(
    () => (notificationsQuery.data ?? []).slice(0, 4),
    [notificationsQuery.data],
  );
  const unreadCount = useMemo(
    () =>
      notificationCount ??
      (notificationsQuery.data ?? []).filter(item => !item.isRead).length,
    [notificationCount, notificationsQuery.data],
  );
  const shouldShowNotification = unreadCount > 0 || hasNotification;

  const openNotificationCenter = () => {
    setPreviewOpen(false);
    onNotificationPress();
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        accessibilityLabel="Mở danh mục điều hướng"
        activeOpacity={0.82}
        onPress={onMenuPress}
        style={styles.brandGroup}
      >
        <View style={styles.gridBtn}>
          <FontAwesome6
            color="#FFFFFF"
            iconStyle="solid"
            name="table-cells-large"
            size={16}
          />
        </View>
        <View style={styles.brandTextWrapper}>
          <Text style={styles.brandEyebrow}>NHA KHOA</Text>
          <Text style={styles.brandTitle}>
            Smart<Text style={styles.brandTitleAccent}>Dental</Text>
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.rightActions}>
        <TouchableOpacity
          accessibilityLabel="Thông báo hệ thống"
          activeOpacity={0.82}
          onPress={() => setPreviewOpen(true)}
          style={styles.bellBtn}
        >
          <FontAwesome6 color="#334155" iconStyle="regular" name="bell" size={18} />
          {unreadCount > 0 ? (
            <View style={styles.bellCountBadge}>
              <Text style={styles.bellCountText}>
                {unreadCount > 9 ? '9' : unreadCount}
              </Text>
            </View>
          ) : shouldShowNotification ? (
            <View style={styles.bellBadge} />
          ) : null}
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setPreviewOpen(false)}
        transparent
        visible={previewOpen}
      >
        <View style={styles.previewLayer}>
          <TouchableWithoutFeedback onPress={() => setPreviewOpen(false)}>
            <View style={styles.previewBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewTitleRow}>
                <Text style={styles.previewTitle}>Thông báo mới</Text>
                {unreadCount > 0 ? (
                  <View style={styles.previewUnreadBadge}>
                    <Text style={styles.previewUnreadText}>
                      {unreadCount} chưa đọc
                    </Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={openNotificationCenter}
              >
                <Text style={styles.previewViewAll}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewList}>
              {notificationsQuery.isLoading ? (
                <View style={styles.previewLoading}>
                  <ActivityIndicator color="#0863c5" size="small" />
                </View>
              ) : previewNotifications.length === 0 ? (
                <Text style={styles.previewEmpty}>Không có thông báo nào</Text>
              ) : (
                previewNotifications.map(item => (
                  <TouchableOpacity
                    activeOpacity={0.86}
                    key={item.id}
                    onPress={() => {
                      if (!item.isRead) markReadMutation.mutate(item.id);
                    }}
                    style={[
                      styles.previewItem,
                      !item.isRead && styles.previewItemUnread,
                    ]}
                  >
                    <View style={styles.previewItemTop}>
                      <Text numberOfLines={1} style={styles.previewItemTitle}>
                        {item.title}
                      </Text>
                      {!item.isRead ? <View style={styles.previewDot} /> : null}
                    </View>
                    <Text numberOfLines={2} style={styles.previewItemMessage}>
                      {item.message}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.84}
              onPress={openNotificationCenter}
              style={styles.previewOpenCenter}
            >
              <Text style={styles.previewOpenCenterText}>
                Mở trung tâm thông báo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bellBadge: {
    backgroundColor: '#EF4444',
    borderColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 9,
    position: 'absolute',
    right: 8,
    top: 7,
    width: 9,
  },
  bellBtn: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  bellCountBadge: {
    alignItems: 'center',
    backgroundColor: '#E11D48',
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1.5,
    minWidth: 17,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 3,
    top: 2,
  },
  bellCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
  },
  brandEyebrow: {
    color: '#0058bc',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    lineHeight: 11,
  },
  brandGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  brandTextWrapper: {
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  brandTitleAccent: {
    color: '#0058bc',
  },
  gridBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 12,
    elevation: 2,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    width: 36,
  },
  headerContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  previewBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  previewCard: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 8,
    marginTop: 92,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    width: '83%',
  },
  previewDot: {
    backgroundColor: '#0863c5',
    borderRadius: 999,
    height: 8,
    marginLeft: 8,
    width: 8,
  },
  previewEmpty: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 20,
    textAlign: 'center',
  },
  previewHeader: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  previewItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewItemMessage: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 4,
  },
  previewItemTitle: {
    color: '#0F172A',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  previewItemTop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  previewItemUnread: {
    backgroundColor: '#EFF6FF',
  },
  previewLayer: {
    flex: 1,
  },
  previewList: {
    gap: 8,
    marginTop: 12,
  },
  previewLoading: {
    alignItems: 'center',
    paddingVertical: 22,
  },
  previewOpenCenter: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 11,
  },
  previewOpenCenterText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
  },
  previewTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  previewTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  previewUnreadBadge: {
    backgroundColor: '#FFE4E6',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  previewUnreadText: {
    color: '#E11D48',
    fontSize: 10,
    fontWeight: '900',
  },
  previewViewAll: {
    color: '#0863c5',
    fontSize: 12,
    fontWeight: '800',
  },
  rightActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
