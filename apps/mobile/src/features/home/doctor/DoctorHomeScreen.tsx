import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '~src/reducers/store';
import SectionHeader from '../components/SectionHeader';

const actions = [
  {
    badge: '1',
    color: '#0875D1',
    icon: 'user-plus' as const,
    label: 'Tiếp nhận',
  },
  { color: '#12B76A', icon: 'calendar' as const, label: 'Lịch hẹn' },
  { color: '#EAAA08', icon: 'user-group' as const, label: 'Khách hàng' },
  { color: '#9E4BEE', icon: 'wallet' as const, label: 'Sổ quỹ' },
];

const appointments = [
  { code: 'BN001', name: 'Sarah Mitchell', phone: '0983830609', time: '12:03' },
  { code: 'BN002', name: 'Mark Thompson', phone: '0369835014', time: '13:59' },
  { code: 'BN003', name: 'Elena Gomez', phone: '0912345678', time: '14:00' },
];

const DoctorHome = () => {
  const user = useSelector((state: RootState) => state.login.user);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFD" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.clinicRow}>
          <FontAwesome6
            name="location-dot"
            size={14}
            color="#0875D1"
            iconStyle="solid"
          />
          <Text style={styles.clinicText}>Phòng khám AI - Chi nhánh 1</Text>
          <FontAwesome6
            name="chevron-down"
            size={10}
            color="#0875D1"
            iconStyle="solid"
          />
        </TouchableOpacity>

        <View style={styles.profileHeader}>
          <View style={styles.doctorCopy}>
            <Text style={styles.welcome}>Xin chào bác sĩ,</Text>
            <Text numberOfLines={2} style={styles.doctorName}>
              {user?.fullName || 'Bác sĩ'}
            </Text>
          </View>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarHead} />
            <View style={styles.avatarBody} />
          </View>
        </View>

        <View style={styles.searchBox}>
          <FontAwesome6
            name="magnifying-glass"
            size={16}
            color="#667085"
            iconStyle="solid"
          />
          <TextInput
            placeholder="Tìm kiếm bệnh nhân, hồ sơ điều trị..."
            placeholderTextColor="#B2B8C6"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.actions}>
          {actions.map(action => (
            <TouchableOpacity key={action.label} style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <FontAwesome6
                  name={action.icon}
                  size={18}
                  color={action.color}
                  iconStyle="solid"
                />
                {!!action.badge && (
                  <Text style={styles.badge}>{action.badge}</Text>
                )}
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <SectionHeader title="Lịch hẹn hôm nay" />
          <TouchableOpacity style={styles.addButton}>
            <FontAwesome6
              name="plus"
              size={16}
              color="#FFFFFF"
              iconStyle="solid"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <TouchableOpacity>
            <Text style={[styles.filter, styles.filterActive]}>Tổng hẹn 3</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.filter}>Đang hẹn 3</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.filter}>Đã đến 0</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.filter}>Hoàn tất 0</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.appointmentList}>
          {appointments.map(appointment => (
            <TouchableOpacity
              key={appointment.code}
              style={styles.appointmentCard}
            >
              <View style={styles.blueBar} />
              <View style={styles.cardTop}>
                <Text style={styles.waiting}>
                  Đang hẹn{' '}
                  <FontAwesome6
                    name="chevron-down"
                    size={8}
                    color="#0875D1"
                    iconStyle="solid"
                  />
                </Text>
                <Text style={styles.appointmentTime}>
                  <FontAwesome6
                    name="clock"
                    size={10}
                    color="#667085"
                    iconStyle="regular"
                  />{' '}
                  {appointment.time}
                </Text>
              </View>
              <Text style={styles.patientName}>
                [{appointment.code}] {appointment.name}
              </Text>
              <Text style={styles.patientPhone}>
                <FontAwesome6
                  name="phone"
                  size={10}
                  color="#B3BCD0"
                  iconStyle="solid"
                />{' '}
                {appointment.phone}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFD', flex: 1 },
  content: { paddingBottom: 30, paddingHorizontal: 20, paddingTop: 22 },
  clinicRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  clinicText: { color: '#475467', fontSize: 12 },
  profileHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 100,
    justifyContent: 'space-between',
    marginTop: 5,
  },
  doctorCopy: { flex: 1, paddingBottom: 14 },
  welcome: { color: '#98A2B3', fontSize: 12, marginBottom: 5 },
  doctorName: { color: '#101828', fontSize: 23, fontWeight: '900' },
  avatarWrap: {
    alignItems: 'center',
    height: 100,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 95,
  },
  avatarHead: {
    backgroundColor: '#FFD9AD',
    borderRadius: 25,
    height: 50,
    position: 'absolute',
    top: 2,
    width: 50,
  },
  avatarBody: {
    backgroundColor: '#0875D1',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    height: 58,
    width: 76,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D9DFEA',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    height: 50,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: '#101828',
    flex: 1,
    fontSize: 13,
    marginLeft: 10,
    paddingVertical: 0,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 23,
  },
  actionItem: { alignItems: 'center', width: '24%' },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE3EC',
    borderRadius: 11,
    borderWidth: 1,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  badge: {
    backgroundColor: '#D92D20',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    minWidth: 16,
    overflow: 'hidden',
    padding: 2,
    position: 'absolute',
    right: -5,
    textAlign: 'center',
    top: -5,
  },
  actionLabel: { color: '#101828', fontSize: 10, marginTop: 7 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  filters: { gap: 8, paddingVertical: 14 },
  filter: {
    backgroundColor: '#F0F2F7',
    borderRadius: 18,
    color: '#475467',
    fontSize: 11,
    overflow: 'hidden',
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  filterActive: {
    backgroundColor: '#0875D1',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  appointmentList: { gap: 10 },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 1,
    minHeight: 100,
    overflow: 'hidden',
    padding: 14,
    shadowColor: '#344054',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  blueBar: {
    backgroundColor: '#0875D1',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waiting: { color: '#0875D1', fontSize: 10, fontWeight: '700' },
  appointmentTime: { color: '#667085', fontSize: 10 },
  patientName: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },
  patientPhone: { color: '#B3BCD0', fontSize: 11, marginTop: 8 },
});

export default DoctorHome;
