import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuthUser } from '~src/features/auth/types';

type DrawerItem = {
  icon: string;
  id: string;
  label: string;
  onPress: () => void;
};

type PatientDrawerModalProps = {
  clinicPhone?: string;
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onNavigate: (routeId: string) => void;
  user: AuthUser | null;
};

function getInitials(name?: string) {
  if (!name || !name.trim()) return 'KH';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PatientDrawerModal({
  clinicPhone = '1900 1234',
  isOpen,
  onClose,
  onLogout,
  onNavigate,
  user,
}: PatientDrawerModalProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(screenWidth * 0.82, 320);
  const displayName = user?.fullName || 'Khách hàng';
  const initials = getInitials(user?.fullName);

  const menuItems: DrawerItem[] = [
    {
      icon: 'house',
      id: 'home',
      label: 'Trang chủ',
      onPress: () => {
        onClose();
        onNavigate('home');
      },
    },
    {
      icon: 'calendar-days',
      id: 'appointment',
      label: 'Đặt lịch khám',
      onPress: () => {
        onClose();
        onNavigate('appointment');
      },
    },
    {
      icon: 'comments',
      id: 'consultation',
      label: 'Tư vấn Telehealth',
      onPress: () => {
        onClose();
        onNavigate('consultation');
      },
    },
    {
      icon: 'wand-magic-sparkles',
      id: 'services',
      label: 'Dịch vụ nha khoa',
      onPress: () => {
        onClose();
        onNavigate('services');
      },
    },
    {
      icon: 'user-doctor',
      id: 'doctors',
      label: 'Đội ngũ Bác sĩ',
      onPress: () => {
        onClose();
        onNavigate('doctors');
      },
    },
    {
      icon: 'file-lines',
      id: 'records',
      label: 'Hồ sơ bệnh án',
      onPress: () => {
        onClose();
        onNavigate('records');
      },
    },
    {
      icon: 'wand-magic-sparkles',
      id: 'promotions',
      label: 'Khuyến mãi & Ưu đãi HOT',
      onPress: () => {
        onClose();
        onNavigate('promotions');
      },
    },
  ];

  const handleCall = () => {
    const cleanPhone = clinicPhone.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={isOpen}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.drawerPanel,
            {
              paddingTop: insets.top,
              width: drawerWidth,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userProfile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.greetingText}>Xin chào,</Text>
                <Text numberOfLines={1} style={styles.userNameText}>
                  {displayName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sub-banner Promo Box */}
          <View style={styles.promoWrapper}>
            <View style={styles.promoCard}>
              <Text style={styles.promoText}>
                Tải ứng dụng Smart Dental để tận hưởng trải nghiệm dịch vụ nha
                khoa AI tốt hơn và nhận nhiều ưu đãi hấp dẫn.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onNavigate('appointment');
                }}
                style={styles.quickBookBtn}
              >
                <FontAwesome6
                  color="#FFFFFF"
                  iconStyle="solid"
                  name="calendar-days"
                  size={12}
                />
                <Text style={styles.quickBookBtnText}>Đặt lịch ngay</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Items List */}
          <ScrollView
            contentContainerStyle={styles.menuScroll}
            style={styles.menuList}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map(item => {
              const isActive = item.id === 'home';
              return (
                <TouchableOpacity
                  activeOpacity={0.75}
                  key={item.id}
                  onPress={item.onPress}
                  style={[styles.menuItem, isActive && styles.activeMenuItem]}
                >
                  <View style={styles.menuItemLeft}>
                    <View
                      style={[
                        styles.menuIconBox,
                        isActive ? styles.activeMenuIconBox : styles.defaultMenuIconBox,
                      ]}
                    >
                      <FontAwesome6
                        color={isActive ? '#FFFFFF' : '#64748B'}
                        iconStyle="solid"
                        name={item.icon as never}
                        size={13}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.menuItemLabel,
                        isActive && styles.activeMenuItemLabel,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <FontAwesome6
                    color={isActive ? '#0863c5' : '#94A3B8'}
                    iconStyle="solid"
                    name="chevron-right"
                    size={12}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Bottom Hotline & Logout */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCall}
              style={styles.hotlineBtn}
            >
              <FontAwesome6
                color="#0058bc"
                iconStyle="solid"
                name="phone"
                size={13}
              />
              <Text style={styles.hotlineLabel}>Đặt khám miễn phí</Text>
              <Text style={styles.hotlineNumber}>{clinicPhone}</Text>
            </TouchableOpacity>

            {user ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  if (onLogout) {
                    onLogout();
                  }
                }}
                style={styles.logoutBtn}
              >
                <FontAwesome6
                  color="#E11D48"
                  iconStyle="solid"
                  name="arrow-right-from-bracket"
                  size={13}
                />
                <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  activeMenuIconBox: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  defaultMenuIconBox: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  activeMenuItem: {
    backgroundColor: 'transparent',
  },
  activeMenuItemLabel: {
    color: '#0863c5',
    fontWeight: '800',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    borderWidth: 1.5,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  drawerPanel: {
    backgroundColor: '#FFFFFF',
    elevation: 24,
    height: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  footer: {
    backgroundColor: '#F8FAFC',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  greetingText: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  hotlineBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  hotlineLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  hotlineNumber: {
    color: '#0058bc',
    fontSize: 13,
    fontWeight: '900',
  },
  logoutBtn: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  logoutBtnText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '800',
  },
  menuIconBox: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: '#F8FAFC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuItemLabel: {
    color: '#1E293B',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  menuItemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  menuScroll: {
    paddingVertical: 4,
  },
  menuList: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
  },
  promoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DBEAFE',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  promoText: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
  },
  promoWrapper: {
    backgroundColor: '#EFF6FF',
    borderBottomColor: '#DBEAFE',
    borderBottomWidth: 1,
    padding: 12,
  },
  quickBookBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  quickBookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  userProfile: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    marginRight: 8,
  },
});
