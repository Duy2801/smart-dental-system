import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { Screen } from '~src/components/ui';
import { SCREEN_NAME } from '~src/constants/screenName';
import { getClinicConfigInfo } from '~src/features/home/api';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import { PatientDrawerModal } from '~src/features/home/components/PatientDrawerModal';
import { PatientHomeHeader } from '~src/features/home/components/PatientHomeHeader';
import { PatientFooter } from '~src/features/home/components/PatientFooter';
import { usePatientDrawerActions } from '~src/features/home/hooks/usePatientDrawerActions';
import { CACHE_TIMES, queryKeys } from '~src/config/queryClient';
import type { RootState } from '~src/reducers/store';
import { ServiceCatalogHeader } from '../components/ServiceCatalogHeader';
import { ServiceCategoryGrid } from '../components/ServiceCategoryGrid';
import { TreatmentMethodCard } from '../components/TreatmentMethodCard';
import { usePatientServices } from '../hooks/usePatientServices';
import type { DentalService, TreatmentMethod } from '../types';

export function ServiceCatalogScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const user = useSelector((state: RootState) => state.login?.user ?? null);
  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();
  const initialKeyword =
    typeof route.params?.keyword === 'string' ? route.params.keyword : '';

  const {
    services,
    selectedService,
    selectedServiceId,
    setSelectedServiceId,
    selectedMethods,
    serviceFaqs,
    isLoading,
    isRefetching,
    refetch,
  } = usePatientServices(initialKeyword);

  const clinicQuery = useQuery({
    queryKey: queryKeys.clinicConfig,
    queryFn: getClinicConfigInfo,
    staleTime: CACHE_TIMES.CLINIC_CONFIG.staleTime,
    gcTime: CACHE_TIMES.CLINIC_CONFIG.gcTime,
  });

  const [drawerVisible, setDrawerVisible] = useState(false);

  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // "Chi tiết" mở trang chi tiết dịch vụ, chọn sẵn phương pháp (giống ?method= trên web)
  const handleOpenDetail = useCallback(
    (service: DentalService, method: TreatmentMethod) => {
      navigation.navigate('ServiceDetail', {
        serviceId: service.id,
        methodId: method.id,
      });
    },
    [navigation],
  );

  const handleBook = useCallback(
    (service: DentalService, method: TreatmentMethod) => {
      const parentNav = navigation?.getParent?.() || navigation;
      parentNav?.navigate?.(SCREEN_NAME.FUNCTION as never, {
        screen: 'AppointmentMain',
        params: {
          initialServiceId: service.id,
          initialMethodId: method.id,
          initialMode: 'booking',
        },
      } as never);
    },
    [navigation],
  );

  return (
    <Screen>
      {/* Top Header Bar (matches Web responsive top bar: SmartDental logo + bell) */}
      <PatientHomeHeader
        hasNotification={true}
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() =>
          navigation.navigate(SCREEN_NAME.PATIENT_NOTIFICATIONS as never)
        }
        user={user}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#0863c5']}
            tintColor="#0863c5"
          />
        }
      >
        {/* Intro Section: Sparkles Badge + Title + Subtitle */}
        <ServiceCatalogHeader />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#0863c5" size="large" />
            <Text style={styles.loadingText}>
              Đang tải danh mục dịch vụ nha khoa...
            </Text>
          </View>
        ) : (
          <View style={styles.contentSection}>
            {/* 1. 8 Dental Specialty Tiles (Image 1) */}
            <ServiceCategoryGrid
              services={services}
              selectedServiceId={selectedServiceId}
              onSelectService={setSelectedServiceId}
            />

            {/* 2. Treatment Methods of Selected Specialty (Image 2) */}
            {selectedService ? (
              <View style={styles.methodsBox}>
                <View style={styles.methodsHeader}>
                  <Text style={styles.methodsEyebrow}>
                    {selectedService.title}
                  </Text>
                  <Text style={styles.methodsTitle}>
                    Các phương pháp điều trị
                  </Text>
                </View>

                {selectedMethods.length > 0 ? (
                  selectedMethods.map(({ service, method }) => (
                    <TreatmentMethodCard
                      key={method.id}
                      service={service}
                      method={method}
                      onOpenDetail={handleOpenDetail}
                      onBook={handleBook}
                    />
                  ))
                ) : (
                  <View style={styles.emptyMethodsBox}>
                    <Text style={styles.emptyMethodsText}>
                      Chuyên khoa này chưa cập nhật phương pháp điều trị.
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* 3. Giải đáp liên quan đến dịch vụ (giống web) */}
            {serviceFaqs.length > 0 ? (
              <View style={styles.faqBox}>
                <Text style={styles.methodsTitle}>
                  Giải đáp liên quan đến dịch vụ
                </Text>
                <View style={styles.faqList}>
                  {serviceFaqs.slice(0, 8).map(faq => {
                    const open = openFaqId === faq.id;
                    return (
                      <View key={faq.id} style={styles.faqItem}>
                        <TouchableOpacity
                          accessibilityState={{ expanded: open }}
                          activeOpacity={0.7}
                          onPress={() => setOpenFaqId(open ? null : faq.id)}
                          style={styles.faqQuestionRow}
                        >
                          <View style={styles.faqQuestionText}>
                            <Text style={styles.faqQuestion}>
                              {faq.question}
                            </Text>
                            <Text style={styles.faqMeta}>
                              {faq.serviceTitle} · {faq.methodName}
                            </Text>
                          </View>
                          <FontAwesome6
                            color="#94A3B8"
                            iconStyle="solid"
                            name={open ? 'chevron-down' : 'chevron-right'}
                            size={12}
                          />
                        </TouchableOpacity>
                        {open ? (
                          <Text style={styles.faqAnswer}>{faq.answer}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* 4. Clinic Footer Section (Image 3) */}
            <View style={styles.footerContainer}>
              <PatientFooter clinic={clinicQuery.data} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating AI Chat Button (bottom right matching web responsive) */}
      <FloatingChatButton />

      {/* Patient Drawer Navigation */}
      <PatientDrawerModal
        clinicPhone={clinicQuery.data?.phone}
        isOpen={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onNavigate={handleDrawerNavigate}
        onLogout={handleLogout}
        user={user}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentSection: {
    marginTop: 4,
  },
  emptyMethodsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyMethodsText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  faqBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  faqList: {
    marginTop: 8,
  },
  faqItem: {
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  faqQuestionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    flex: 1,
  },
  faqQuestion: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  faqMeta: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  faqAnswer: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 10,
  },
  footerContainer: {
    marginHorizontal: -16,
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 64,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  methodsBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 8,
    padding: 16,
  },
  methodsEyebrow: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  methodsHeader: {
    marginBottom: 16,
  },
  methodsTitle: {
    color: '#07366f',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  scrollContainer: {
    paddingBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

export default ServiceCatalogScreen;
