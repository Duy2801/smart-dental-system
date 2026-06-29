import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '~src/reducers/store';
import SectionHeader from '../components/SectionHeader';

const quickServices = [
  { icon: 'tooth' as const, label: 'Lấy cao răng' },
  { icon: 'teeth-open' as const, label: 'Niềng răng' },
  { icon: 'calendar-check' as const, label: 'Khám định kỳ' },
  { icon: 'briefcase-medical' as const, label: 'Trồng răng' },
];

const doctors = [
  {
    initials: 'HN',
    name: 'BS. Lê Hoàng Nam',
    specialty: 'Nha khoa tổng quát',
    rating: '4.9',
  },
  {
    initials: 'ML',
    name: 'BS. Nguyễn Mai Linh',
    specialty: 'Chỉnh nha',
    rating: '4.8',
  },
];

const PatientHome = () => {
  const user = useSelector((state: RootState) => state.login.user);
  const firstName = user?.fullName.trim().split(/\s+/).pop() || 'bạn';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FC" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <FontAwesome6
              name="user-doctor"
              size={20}
              color="#FFFFFF"
              iconStyle="solid"
            />
          </View>
          <View style={styles.greeting}>
            <Text style={styles.hello}>Chào bạn,</Text>
            <Text numberOfLines={1} style={styles.name}>
              {firstName} 👋
            </Text>
          </View>
          <TouchableOpacity style={styles.notification}>
            <FontAwesome6
              name="bell"
              size={18}
              color="#0875D1"
              iconStyle="solid"
            />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.aiBanner}>
          <View style={styles.bannerCopy}>
            <View style={styles.aiBadge}>
              <FontAwesome6
                name="wand-magic-sparkles"
                size={10}
                color="#FFFFFF"
                iconStyle="solid"
              />
              <Text style={styles.aiBadgeText}>AI TECHNOLOGY</Text>
            </View>
            <Text style={styles.bannerTitle}>
              Chẩn đoán bằng{`\n`}AI siêu tốc
            </Text>
            <Text style={styles.bannerText}>
              Phân tích phim chụp X-quang chỉ trong 30 giây.
            </Text>
            <TouchableOpacity style={styles.tryButton}>
              <Text style={styles.tryButtonText}>Thử ngay</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.aiVisual}>
            <View style={styles.scanCircle}>
              <FontAwesome6
                name="brain"
                size={55}
                color="#45D3FF"
                iconStyle="solid"
              />
            </View>
            <View style={styles.scanLine} />
          </View>
        </View>

        <SectionHeader action="Xem tất cả" title="Dịch vụ nhanh" />
        <View style={styles.quickGrid}>
          {quickServices.map(item => (
            <TouchableOpacity key={item.label} style={styles.quickItem}>
              <View style={styles.quickIcon}>
                <FontAwesome6
                  name={item.icon}
                  size={20}
                  color="#0875D1"
                  iconStyle="solid"
                />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader title="Lịch hẹn sắp tới" />
        <View style={styles.appointmentCard}>
          <View style={styles.dateBox}>
            <Text style={styles.month}>THÁNG 10</Text>
            <Text style={styles.day}>24</Text>
          </View>
          <View style={styles.appointmentInfo}>
            <View style={styles.appointmentTop}>
              <Text style={styles.appointmentTitle}>Tư vấn chỉnh nha</Text>
              <Text style={styles.status}>Sắp diễn ra</Text>
            </View>
            <Text style={styles.time}>09:30 - 10:30</Text>
            <Text style={styles.doctor}>
              <FontAwesome6
                name="user-doctor"
                size={11}
                color="#667085"
                iconStyle="solid"
              />{' '}
              BS. Lê Hoàng Nam
            </Text>
          </View>
          <View style={styles.cardDivider} />
          <TouchableOpacity style={styles.directionButton}>
            <FontAwesome6
              name="map"
              size={13}
              color="#FFFFFF"
              iconStyle="solid"
            />
            <Text style={styles.directionText}>Chỉ đường</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader action="Xem tất cả" title="Bác sĩ nổi bật" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.doctorList}
        >
          {doctors.map(doctor => (
            <TouchableOpacity key={doctor.name} style={styles.doctorCard}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorInitials}>{doctor.initials}</Text>
                <View style={styles.rating}>
                  <FontAwesome6
                    name="star"
                    size={9}
                    color="#F5B700"
                    iconStyle="solid"
                  />
                  <Text style={styles.ratingText}>{doctor.rating}</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={styles.doctorName}>
                {doctor.name}
              </Text>
              <Text style={styles.specialty}>{doctor.specialty}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F6F8FC', flex: 1 },
  content: {
    gap: 18,
    paddingBottom: 30,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    elevation: 1,
    flexDirection: 'row',
    padding: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#4C9AF1',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  greeting: { flex: 1, marginLeft: 10 },
  hello: { color: '#98A2B3', fontSize: 12 },
  name: { color: '#2780D7', fontSize: 20, fontWeight: '800' },
  notification: { padding: 8 },
  notificationDot: {
    backgroundColor: '#F04438',
    borderRadius: 4,
    height: 7,
    position: 'absolute',
    right: 6,
    top: 5,
    width: 7,
  },
  aiBanner: {
    backgroundColor: '#0570CF',
    borderRadius: 15,
    flexDirection: 'row',
    minHeight: 180,
    overflow: 'hidden',
    padding: 16,
  },
  bannerCopy: { flex: 1.2, zIndex: 2 },
  aiBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 9,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
    marginTop: 8,
  },
  bannerText: { color: '#D9F0FF', fontSize: 12, lineHeight: 17, marginTop: 4 },
  tryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginTop: 9,
    paddingHorizontal: 16,
    paddingVertical: 7,
    width: 88,
  },
  tryButtonText: { color: '#0875D1', fontSize: 12, fontWeight: '800' },
  aiVisual: {
    alignItems: 'center',
    backgroundColor: '#063F73',
    flex: 0.8,
    justifyContent: 'center',
    margin: -16,
    marginLeft: 8,
  },
  scanCircle: {
    alignItems: 'center',
    borderColor: '#1BBEEC',
    borderRadius: 50,
    borderWidth: 1,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  scanLine: {
    backgroundColor: '#52D9FF',
    height: 1,
    position: 'absolute',
    width: '85%',
  },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', width: '24%' },
  quickIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E1EC',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  quickLabel: {
    color: '#344054',
    fontSize: 10,
    marginTop: 7,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE3ED',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 14,
  },
  dateBox: {
    alignItems: 'center',
    backgroundColor: '#EAF5FF',
    borderRadius: 12,
    height: 66,
    justifyContent: 'center',
    width: 56,
  },
  month: { color: '#0875D1', fontSize: 8, fontWeight: '700' },
  day: { color: '#0875D1', fontSize: 22, fontWeight: '900' },
  appointmentInfo: { flex: 1, marginLeft: 12 },
  appointmentTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appointmentTitle: { color: '#101828', fontSize: 14, fontWeight: '800' },
  status: {
    backgroundColor: '#DDF2FF',
    borderRadius: 10,
    color: '#0875D1',
    fontSize: 9,
    fontWeight: '700',
    overflow: 'hidden',
    padding: 5,
  },
  time: { color: '#475467', fontSize: 12, marginTop: 3 },
  doctor: { color: '#667085', fontSize: 11, marginTop: 5 },
  cardDivider: {
    backgroundColor: '#EAECF0',
    height: 1,
    marginVertical: 13,
    width: '100%',
  },
  directionButton: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 9,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    height: 40,
    justifyContent: 'center',
  },
  directionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cancelButton: {
    alignItems: 'center',
    borderColor: '#D0D5DD',
    borderRadius: 9,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginLeft: 10,
    width: 58,
  },
  cancelText: { color: '#667085', fontSize: 12, fontWeight: '600' },
  doctorList: { marginHorizontal: -2 },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E6EE',
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 2,
    marginRight: 10,
    overflow: 'hidden',
    paddingBottom: 12,
    width: 165,
  },
  doctorAvatar: {
    alignItems: 'center',
    backgroundColor: '#DCECF2',
    height: 105,
    justifyContent: 'center',
  },
  doctorInitials: { color: '#0875D1', fontSize: 30, fontWeight: '800' },
  rating: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    right: 7,
    top: 7,
  },
  ratingText: { color: '#344054', fontSize: 9, fontWeight: '700' },
  doctorName: {
    color: '#101828',
    fontSize: 12,
    fontWeight: '800',
    marginHorizontal: 10,
    marginTop: 9,
  },
  specialty: {
    color: '#667085',
    fontSize: 10,
    marginHorizontal: 10,
    marginTop: 3,
  },
});

export default PatientHome;
