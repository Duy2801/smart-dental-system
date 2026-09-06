import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
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
import type { RootState } from '~src/reducers/store';
import { ServiceCatalogHeader } from '../components/ServiceCatalogHeader';
import { ServiceCategoryGrid } from '../components/ServiceCategoryGrid';
import { ServiceDetailModal } from '../components/ServiceDetailModal';
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
    isLoading,
    isRefetching,
    refetch,
  } = usePatientServices(initialKeyword);

  const clinicQuery = useQuery({
    queryKey: ['clinic-config'],
    queryFn: getClinicConfigInfo,
    staleTime: 5 * 60 * 1000,
  });

  const [drawerVisible, setDrawerVisible] = useState(false);

  // Detail Modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailService, setDetailService] = useState<DentalService | null>(null);
  const [detailMethod, setDetailMethod] = useState<TreatmentMethod | null>(null);

  const handleOpenDetail = useCallback(
    (service: DentalService, method: TreatmentMethod) => {
      setDetailService(service);
      setDetailMethod(method);
      setDetailModalVisible(true);
    },
    [],
  );

  const handleCloseDetail = useCallback(() => {
    setDetailModalVisible(false);
  }, []);

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

            {/* 3. Clinic Footer Section (Image 3) */}
            <View style={styles.footerContainer}>
              <PatientFooter clinic={clinicQuery.data} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating AI Chat Button (bottom right matching web responsive) */}
      <FloatingChatButton />

      {/* Treatment Method Detail Modal */}
      <ServiceDetailModal
        visible={detailModalVisible}
        service={detailService}
        method={detailMethod}
        onClose={handleCloseDetail}
        onBook={handleBook}
      />

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
