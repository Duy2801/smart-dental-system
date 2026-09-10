import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { EmptyState, Screen, ScreenList } from '~src/components/ui';
import { SCREEN_NAME } from '~src/constants/screenName';
import { getClinicConfigInfo } from '~src/features/home/api';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import { PatientDrawerModal } from '~src/features/home/components/PatientDrawerModal';
import { PatientFooter } from '~src/features/home/components/PatientFooter';
import { PatientHomeHeader } from '~src/features/home/components/PatientHomeHeader';
import { usePatientDrawerActions } from '~src/features/home/hooks/usePatientDrawerActions';
import type { RootState } from '~src/reducers/store';
import type { PatientHomeScreenProps } from '~src/routes/types';
import {
  getPatientDoctors,
  getPatientServices,
  type PatientDoctor,
} from '../api';

const doctorsBanner = require('~src/assets/home/dsbacsi.png');

type Props = PatientHomeScreenProps<'PatientDoctors'>;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function isDoctorRelatedToService(doctor: PatientDoctor, serviceText: string) {
  const haystack = normalize(
    [
      doctor.name,
      doctor.specialization,
      doctor.position,
      doctor.workplace,
      doctor.bio,
      doctor.doctorCode,
    ].join(' '),
  );
  const service = normalize(serviceText);

  const keywordGroups = [
    ['chinh nha', 'nieng rang', 'invisalign', 'rang tre em'],
    ['implant', 'cay ghep', 'phuc hinh', 'rang su'],
    ['tay trang', 'tham my', 'veneer', 'cuoi'],
    ['noi nha', 'tuy', 'dieu tri tuy', 'root'],
    ['tong quat', 'kham', 'cao voi', 've sinh', 'nha chu'],
    ['tieu phau', 'nho rang', 'rang khon', 'phau thuat'],
  ];

  const directWords = service.split(/\s+/).filter(word => word.length > 3);
  if (directWords.some(word => haystack.includes(word))) return true;

  const matchedGroup = keywordGroups.find(group =>
    group.some(keyword => service.includes(keyword)),
  );

  return matchedGroup
    ? matchedGroup.some(keyword => haystack.includes(keyword))
    : false;
}

export default function DoctorsScreen({ navigation, route }: Props) {
  const user = useSelector((state: RootState) => state.login?.user ?? null);
  const [keyword, setKeyword] = useState(route.params?.keyword ?? '');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [doctorPickerOpen, setDoctorPickerOpen] = useState(false);

  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  const doctorsQuery = useQuery({
    queryFn: getPatientDoctors,
    queryKey: ['patient', 'doctors'],
  });
  const servicesQuery = useQuery({
    queryFn: getPatientServices,
    queryKey: ['patient', 'doctor-search-services'],
  });
  const clinicQuery = useQuery({
    queryFn: getClinicConfigInfo,
    queryKey: ['clinic-config'],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (route.params?.keyword) {
      setKeyword(route.params.keyword);
    }
  }, [route.params?.keyword]);

  const doctors = useMemo(() => doctorsQuery.data ?? [], [doctorsQuery.data]);
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const selectedService = services.find(item => item.id === selectedServiceId);

  const relatedDoctors = useMemo(() => {
    if (!selectedService) return [];
    const serviceText = [
      selectedService.title,
      selectedService.category,
      selectedService.description,
    ].join(' ');
    const matches = doctors.filter(doctor =>
      isDoctorRelatedToService(doctor, serviceText),
    );
    return matches.length ? matches : doctors;
  }, [doctors, selectedService]);

  const visibleDoctors = useMemo(() => {
    const q = normalize(keyword.trim());
    const pool = selectedService ? relatedDoctors : doctors;

    return pool.filter(doctor => {
      const matchesSelectedDoctor =
        !selectedDoctorId || doctor.id === selectedDoctorId;
      const matchesKeyword =
        !q ||
        normalize(
          [
            doctor.name,
            doctor.specialization,
            doctor.position,
            doctor.doctorCode,
          ].join(' '),
        ).includes(q);

      return matchesSelectedDoctor && matchesKeyword;
    });
  }, [doctors, keyword, relatedDoctors, selectedDoctorId, selectedService]);

  const isLoading = doctorsQuery.isLoading || servicesQuery.isLoading;
  const isRefreshing = doctorsQuery.isRefetching || servicesQuery.isRefetching;

  const handleRefresh = useCallback(() => {
    doctorsQuery.refetch();
    servicesQuery.refetch();
  }, [doctorsQuery, servicesQuery]);

  const handleBookDoctor = useCallback(
    (doctor: PatientDoctor) => {
      (navigation.getParent() as any)?.navigate(SCREEN_NAME.FUNCTION, {
        screen: 'AppointmentMain',
        params: {
          dedicatedDoctorId: doctor.id,
          initialMode: 'booking',
        },
      });
    },
    [navigation],
  );

  const handleOpenBooking = useCallback(() => {
    (navigation.getParent() as any)?.navigate(SCREEN_NAME.FUNCTION, {
      screen: 'AppointmentMain',
      params: {
        initialMode: 'booking',
      },
    });
  }, [navigation]);

  const handleNotificationPress = useCallback(() => {
    navigation.navigate(SCREEN_NAME.PATIENT_NOTIFICATIONS);
  }, [navigation]);

  const resetFilters = useCallback(() => {
    setKeyword('');
    setSelectedDoctorId('');
    setSelectedServiceId('');
    setServicePickerOpen(false);
    setDoctorPickerOpen(false);
  }, []);

  const handleFindDoctors = useCallback(() => {
    setServicePickerOpen(false);
    setDoctorPickerOpen(false);
  }, []);

  const renderDoctor = ({ item }: { item: PatientDoctor }) => {
    const bullets =
      item.bullets.length > 0
        ? item.bullets.slice(0, 4)
        : [
            item.position,
            `${item.yearsExperience}+ năm kinh nghiệm lâm sàng`,
          ].filter(Boolean);

    return (
      <View style={styles.doctorCard}>
        <View style={styles.doctorCardContent}>
          <View style={styles.doctorTextCol}>
            <Text style={styles.cardEyebrow}>Bác sĩ</Text>
            <Text numberOfLines={1} style={styles.doctorName}>
              {item.name}
            </Text>

            <View style={styles.specialtyPill}>
              <Text numberOfLines={1} style={styles.specialtyPillText}>
                {item.specialization}
              </Text>
            </View>

            <View style={styles.bulletList}>
              {bullets.map((bullet, index) => (
                <View key={`${item.id}-${index}`} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text numberOfLines={2} style={styles.bulletText}>
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.portraitCol}>
            <View style={styles.portraitHalo} />
            {item.avatarUrl ? (
              <Image
                resizeMode="contain"
                source={{ uri: item.avatarUrl }}
                style={styles.doctorPortrait}
              />
            ) : (
              <View style={styles.initialPortrait}>
                <Text style={styles.initialPortraitText}>{item.initials}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardBottomRow}>
          <View style={styles.experienceRow}>
            <FontAwesome6 color="#0875D1" iconStyle="solid" name="award" size={13} />
            <Text style={styles.experienceText}>
              {item.yearsExperience || 5}+ năm kinh nghiệm
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => handleBookDoctor(item)}
            style={styles.detailButton}
          >
            <Text style={styles.detailButtonText}>Đặt lịch</Text>
            <FontAwesome6
              color="#2563EB"
              iconStyle="solid"
              name="arrow-right"
              size={11}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ListHeader = (
    <View style={styles.listHeader}>
      <View style={styles.introSection}>
        <View style={styles.badge}>
          <FontAwesome6
            color="#0058bc"
            iconStyle="solid"
            name="wand-magic-sparkles"
            size={12}
          />
          <Text style={styles.badgeText}>Đội ngũ chuyên gia</Text>
        </View>
        <Text style={styles.title}>Đội Ngũ Bác Sĩ Răng Hàm Mặt</Text>
        <Text style={styles.subtitle}>
          Chọn dịch vụ bạn quan tâm hoặc tìm kiếm theo tên bác sĩ để tham khảo
          thông tin chi tiết và đặt lịch khám cùng các chuyên gia hàng đầu.
        </Text>
      </View>

      <View style={styles.bannerCard}>
        <ImageBackground
          imageStyle={styles.bannerImage}
          resizeMode="contain"
          source={doctorsBanner}
          style={styles.bannerImageBox}
        />
      </View>

      <View style={styles.searchPanel}>
        <Text style={styles.filterLabel}>Dịch vụ nha khoa</Text>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => setServicePickerOpen(open => !open)}
          style={styles.selectBox}
        >
          <Text numberOfLines={1} style={styles.selectText}>
            {selectedService?.title || 'Tất cả dịch vụ'}
          </Text>
          <FontAwesome6
            color="#334155"
            iconStyle="solid"
            name={servicePickerOpen ? 'chevron-up' : 'chevron-down'}
            size={12}
          />
        </TouchableOpacity>

        {servicePickerOpen ? (
          <View style={styles.dropdownBox}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => {
                setSelectedServiceId('');
                setSelectedDoctorId('');
                setServicePickerOpen(false);
              }}
              style={styles.dropdownItem}
            >
              <Text style={styles.dropdownItemText}>Tất cả dịch vụ</Text>
            </TouchableOpacity>
            {services.map(service => (
              <TouchableOpacity
                activeOpacity={0.82}
                key={service.id}
                onPress={() => {
                  setSelectedServiceId(service.id);
                  setSelectedDoctorId('');
                  setServicePickerOpen(false);
                }}
                style={styles.dropdownItem}
              >
                <Text numberOfLines={1} style={styles.dropdownItemText}>
                  {service.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={[styles.filterLabel, styles.searchLabel]}>Tên bác sĩ</Text>
        <View style={styles.searchInputContainer}>
          <FontAwesome6
            color="#94A3B8"
            iconStyle="solid"
            name="magnifying-glass"
            size={14}
            style={styles.searchIcon}
          />
          <TextInput
            onChangeText={setKeyword}
            placeholder="Nhập tên bác sĩ cần tìm..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={keyword}
          />
          {keyword ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setKeyword('')}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>Xóa</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {selectedService ? (
          <>
            <Text style={[styles.filterLabel, styles.searchLabel]}>
              Bác sĩ phù hợp
            </Text>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setDoctorPickerOpen(open => !open)}
              style={styles.selectBox}
            >
              <Text numberOfLines={1} style={styles.selectText}>
                {relatedDoctors.find(doctor => doctor.id === selectedDoctorId)
                  ?.name || 'Tất cả bác sĩ liên quan'}
              </Text>
              <FontAwesome6
                color="#334155"
                iconStyle="solid"
                name={doctorPickerOpen ? 'chevron-up' : 'chevron-down'}
                size={12}
              />
            </TouchableOpacity>

            {doctorPickerOpen ? (
              <View style={styles.dropdownBox}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => {
                    setSelectedDoctorId('');
                    setDoctorPickerOpen(false);
                  }}
                  style={styles.dropdownItem}
                >
                  <Text style={styles.dropdownItemText}>Tất cả liên quan</Text>
                </TouchableOpacity>
                {relatedDoctors.map(doctor => (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    key={doctor.id}
                    onPress={() => {
                      setSelectedDoctorId(doctor.id);
                      setDoctorPickerOpen(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text numberOfLines={1} style={styles.dropdownItemText}>
                      {doctor.name} - {doctor.specialization}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.86}
          onPress={handleFindDoctors}
          style={styles.searchButton}
        >
          <FontAwesome6
            color="#FFFFFF"
            iconStyle="solid"
            name="magnifying-glass"
            size={13}
          />
          <Text style={styles.searchButtonText}>Tìm bác sĩ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <View>
          <Text style={styles.resultsEyebrow}>Kết quả tìm kiếm</Text>
          <Text style={styles.resultsTitle}>
            Tìm thấy {visibleDoctors.length} bác sĩ
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.82} onPress={handleOpenBooking}>
          <Text style={styles.bookingLink}>Đặt lịch khám</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen>
      <PatientHomeHeader
        hasNotification={true}
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={handleNotificationPress}
        user={user}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#0875D1" />
          <Text style={styles.loadingText}>Đang tải đội ngũ bác sĩ...</Text>
        </View>
      ) : (
        <ScreenList
          data={visibleDoctors}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              actionLabel="Xóa tìm kiếm"
              description="Hãy thử từ khóa, dịch vụ hoặc bác sĩ khác."
              onAction={resetFilters}
              title="Không tìm thấy bác sĩ phù hợp"
            />
          }
          ListHeaderComponent={ListHeader}
          ListFooterComponent={<PatientFooter clinic={clinicQuery.data} />}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          renderItem={renderDoctor}
          contentContainerStyle={styles.listContent}
        />
      )}

      <PatientDrawerModal
        clinicPhone={clinicQuery.data?.phone}
        isOpen={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onLogout={handleLogout}
        onNavigate={handleDrawerNavigate}
        user={user}
      />
      <FloatingChatButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  bannerCard: {
    backgroundColor: '#EEF2F6',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    marginTop: 14,
    overflow: 'hidden',
    padding: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  bannerImage: {
    borderRadius: 18,
  },
  bannerImageBox: {
    aspectRatio: 1.9,
    width: '100%',
  },
  bulletDot: {
    backgroundColor: '#0F172A',
    borderRadius: 3,
    height: 6,
    marginTop: 7,
    width: 6,
  },
  bulletList: {
    gap: 7,
    marginTop: 12,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  bulletText: {
    color: '#475569',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  bookingLink: {
    color: '#0058bc',
    fontSize: 12,
    fontWeight: '900',
  },
  cardBottomRow: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
  },
  cardEyebrow: {
    color: '#3B4C7C',
    fontSize: 12,
    fontWeight: '800',
  },
  detailButton: {
    alignItems: 'center',
    backgroundColor: '#ECF3FE',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
  },
  dropdownBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  dropdownItem: {
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  doctorCardContent: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 178,
  },
  doctorName: {
    color: '#1F2B56',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  doctorPortrait: {
    bottom: 0,
    height: 170,
    position: 'absolute',
    width: 118,
  },
  doctorTextCol: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 4,
  },
  experienceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 6,
  },
  experienceText: {
    color: '#334155',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  filterLabel: {
    color: '#7686A3',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  initialPortrait: {
    alignItems: 'center',
    backgroundColor: '#ECFEFF',
    borderColor: '#FFFFFF',
    borderRadius: 34,
    borderWidth: 3,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  initialPortraitText: {
    color: '#0F766E',
    fontSize: 20,
    fontWeight: '900',
  },
  introSection: {
    paddingTop: 6,
  },
  listContent: {
    paddingBottom: 0,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  portraitCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
    width: 116,
  },
  portraitHalo: {
    backgroundColor: '#D0E2FE',
    borderRadius: 56,
    bottom: 0,
    height: 112,
    position: 'absolute',
    width: 112,
  },
  resultsEyebrow: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  resultsHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 18,
  },
  resultsTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  searchInputContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 14,
    elevation: 5,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  searchLabel: {
    marginTop: 16,
  },
  searchPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 26,
    borderWidth: 1,
    elevation: 3,
    marginTop: 26,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  selectBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  selectText: {
    color: '#334155',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 10,
  },
  specialtyPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    marginTop: 8,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  specialtyPillText: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 8,
  },
  title: {
    color: '#0F172A',
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 31,
    marginTop: 10,
  },
});
