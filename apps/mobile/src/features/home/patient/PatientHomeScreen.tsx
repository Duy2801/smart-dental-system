import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Screen, ScreenList } from '~src/components/ui';
import { SCREEN_NAME } from '~src/constants/screenName';
import { apiLogout } from '~src/features/auth/api';
import { removeAuthSession } from '~src/features/auth/session';
import { FeaturedServiceBanner } from '~src/features/home/components/FeaturedServiceBanner';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import {
  getHomeSearchResults,
  shouldSearchDoctors,
} from '~src/features/home/components/homeSearch';
import { PatientDrawerModal } from '~src/features/home/components/PatientDrawerModal';
import { PatientHomeHeader } from '~src/features/home/components/PatientHomeHeader';
import {
  PatientHomeHeroSearch,
  type Suggestion,
} from '~src/features/home/components/PatientHomeHeroSearch';
import {
  ClinicalCasesPreviewSection,
  ClinicLocationPreviewSection,
  DashboardFooterSection,
  DoctorsPreviewSection,
  KnowledgePreviewSection,
  PopularMethodsSection,
  PromotionCtaSection,
  ServicesPreviewSection,
  TrustMetricsSection,
} from '~src/features/home/components/PatientHomeSections';
import {
  getConsultationDoctors,
  getConsultationPackages,
  getPatientPromotions,
} from '~src/features/patient/api';
import { CACHE_TIMES, queryKeys } from '~src/config/queryClient';
import { clearSession } from '~src/reducers/loginReducer';
import type { AppDispatch, RootState } from '~src/reducers/store';
import { getLoginRoute } from '~src/routes/roleRoutes';
import type { PatientHomeStackParamList } from '~src/routes/types';
import {
  getBanners,
  getClinicConfigInfo,
  getHomeClinicalCases,
  getHomeDoctors,
  getHomeServices,
  type HomeServiceCard,
} from '../api';

type HomeRow =
  | { id: 'hero' }
  | { id: 'featured-service' }
  | { id: 'trust' }
  | { id: 'services' }
  | { id: 'popular-methods' }
  | { id: 'doctors' }
  | { id: 'clinical-cases' }
  | { id: 'promotion' }
  | { id: 'knowledge' }
  | { id: 'location' }
  | { id: 'footer' };

type PatientHomeNavigation = NativeStackNavigationProp<
  PatientHomeStackParamList,
  'Home'
>;

const rows: HomeRow[] = [
  { id: 'hero' },
  { id: 'featured-service' },
  { id: 'trust' },
  { id: 'services' },
  { id: 'popular-methods' },
  { id: 'doctors' },
  { id: 'clinical-cases' },
  { id: 'promotion' },
  { id: 'knowledge' },
  { id: 'location' },
  { id: 'footer' },
];

const fallbackServices: HomeServiceCard[] = [
  {
    category: 'Thẩm mỹ',
    description:
      'Mặt dán sứ siêu mỏng bảo tồn răng thật tối đa, mang lại nụ cười rạng rỡ.',
    durationMinutes: 45,
    icon: null,
    id: 'veneer',
    imageUrl: null,
    name: 'Dán sứ Veneer',
    price: 'Từ 8.000.000 đ',
    priceValue: 8000000,
    title: 'Dán sứ Veneer',
    treatmentMethods: [],
  },
  {
    category: 'Cấy ghép',
    description: 'Khôi phục răng mất bằng trụ Implant hiện đại và bền vững.',
    durationMinutes: 60,
    icon: null,
    id: 'implant',
    imageUrl: null,
    name: 'Trồng răng Implant',
    price: 'Từ 15.000.000 đ',
    priceValue: 15000000,
    title: 'Trồng răng Implant',
    treatmentMethods: [],
  },
  {
    category: 'Thẩm mỹ',
    description: 'Phục hình răng thẩm mỹ tự nhiên, cá nhân hóa theo nụ cười.',
    durationMinutes: 45,
    icon: null,
    id: 'porcelain',
    imageUrl: null,
    name: 'Bọc răng sứ',
    price: 'Liên hệ',
    priceValue: 0,
    title: 'Bọc răng sứ',
    treatmentMethods: [],
  },
];

export default function PatientHomeScreen() {
  const navigation = useNavigation<PatientHomeNavigation>();
  const dispatch = useDispatch<AppDispatch>();
  const { role, user } = useSelector((state: RootState) => state.login);

  const [keyword, setKeyword] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const queryClient = useQueryClient();

  // Background prefetching for instant "Tư vấn" screen loading
  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.consultations.packages,
      queryFn: getConsultationPackages,
      staleTime: CACHE_TIMES.CATALOG.staleTime,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.consultations.doctors,
      queryFn: getConsultationDoctors,
      staleTime: CACHE_TIMES.CATALOG.staleTime,
    });
  }, [queryClient]);

  const servicesQuery = useQuery({
    queryFn: getHomeServices,
    queryKey: queryKeys.home.services,
    staleTime: CACHE_TIMES.CATALOG.staleTime,
    gcTime: CACHE_TIMES.CATALOG.gcTime,
  });
  const doctorsQuery = useQuery({
    queryFn: getHomeDoctors,
    queryKey: queryKeys.home.doctors,
    staleTime: CACHE_TIMES.CATALOG.staleTime,
    gcTime: CACHE_TIMES.CATALOG.gcTime,
  });
  const bannersQuery = useQuery({
    queryFn: getBanners,
    queryKey: queryKeys.home.banners,
    staleTime: CACHE_TIMES.ALBUM.staleTime,
    gcTime: CACHE_TIMES.ALBUM.gcTime,
  });
  const clinicalCasesQuery = useQuery({
    queryFn: getHomeClinicalCases,
    queryKey: queryKeys.home.clinicalCases,
    staleTime: CACHE_TIMES.ALBUM.staleTime,
    gcTime: CACHE_TIMES.ALBUM.gcTime,
  });
  const clinicConfigQuery = useQuery({
    queryFn: getClinicConfigInfo,
    queryKey: queryKeys.clinicConfig,
    staleTime: CACHE_TIMES.CLINIC_CONFIG.staleTime,
    gcTime: CACHE_TIMES.CLINIC_CONFIG.gcTime,
  });
  const promotionsQuery = useQuery({
    queryFn: () => getPatientPromotions(),
    queryKey: queryKeys.home.promotions,
    staleTime: CACHE_TIMES.CATALOG.staleTime,
    gcTime: CACHE_TIMES.CATALOG.gcTime,
  });

  const services = useMemo(
    () =>
      servicesQuery.data && servicesQuery.data.length > 0
        ? servicesQuery.data
        : fallbackServices,
    [servicesQuery.data],
  );
  const doctors = useMemo(() => doctorsQuery.data ?? [], [doctorsQuery.data]);
  const banner = bannersQuery.data?.[0];

  const searchResults = useMemo(
    () => getHomeSearchResults(keyword, services, doctors),
    [doctors, keyword, services],
  );
  const suggestions = useMemo<Suggestion[]>(() => {
    const serviceSuggestions = services.slice(0, 4).map(service => ({
      id: service.id,
      label: service.name,
      type: 'service' as const,
    }));
    const doctorSuggestions = doctors.slice(0, 1).map(doctor => ({
      id: doctor.id,
      label: `BS. ${doctor.name}`,
      type: 'doctor' as const,
    }));
    return [...serviceSuggestions, ...doctorSuggestions];
  }, [doctors, services]);

  const refreshing =
    servicesQuery.isRefetching ||
    doctorsQuery.isRefetching ||
    bannersQuery.isRefetching ||
    clinicalCasesQuery.isRefetching ||
    clinicConfigQuery.isRefetching ||
    promotionsQuery.isRefetching;

  const navigateTab = useCallback(
    (screen: string, params?: object) => {
      const parent = navigation.getParent();
      if (parent) {
        (parent as any).navigate(screen, params);
      }
    },
    [navigation],
  );

  const navigateRoot = useCallback(
    (screen: string, params?: object) => {
      let rootNavigation: any = navigation;
      let parentNavigation = rootNavigation?.getParent?.();
      while (parentNavigation) {
        rootNavigation = parentNavigation;
        parentNavigation = rootNavigation?.getParent?.();
      }
      rootNavigation?.navigate?.(screen as never, params as never);
    },
    [navigation],
  );

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.clinicConfig });
  }, [queryClient]);

  const goToConsultation = useCallback(() => {
    setShowResults(false);
    navigation.navigate(SCREEN_NAME.PATIENT_CONSULTATION);
  }, [navigation]);

  const goToAppointment = useCallback(
    (serviceId?: string, methodId?: string) => {
      setShowResults(false);
      navigateTab(SCREEN_NAME.FUNCTION, {
        screen: 'AppointmentMain',
        params: {
          initialMethodId: methodId,
          initialMode: 'booking',
          initialServiceId: serviceId,
        },
      });
    },
    [navigateTab],
  );

  const goToServiceSearch = useCallback(
    (value?: string) => {
      setShowResults(false);
      navigateTab(SCREEN_NAME.PATIENT_SERVICES, {
        screen: 'ServiceCatalogMain',
        params: value ? { keyword: value } : undefined,
      });
    },
    [navigateTab],
  );

  const goToDoctorSearch = useCallback(
    (value?: string) => {
      setShowResults(false);
      navigation.navigate(
        SCREEN_NAME.PATIENT_DOCTORS,
        value ? { keyword: value } : undefined,
      );
    },
    [navigation],
  );

  const handleSuggestionPress = useCallback(
    (suggestion: Suggestion) => {
      Keyboard.dismiss();
      setKeyword(suggestion.label.replace(/^BS\.\s*/, ''));
      if (suggestion.type === 'doctor') {
        goToDoctorSearch(suggestion.label.replace(/^BS\.\s*/, ''));
        return;
      }
      goToServiceSearch(suggestion.label);
    },
    [goToDoctorSearch, goToServiceSearch],
  );

  const handleSearchSubmit = useCallback(() => {
    const trimmed = keyword.trim();
    Keyboard.dismiss();
    if (!trimmed) {
      setShowResults(false);
      return;
    }

    if (shouldSearchDoctors(trimmed, searchResults)) {
      goToDoctorSearch(trimmed);
      return;
    }
    goToServiceSearch(trimmed);
  }, [goToDoctorSearch, goToServiceSearch, keyword, searchResults]);

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
    setShowResults(value.trim().length > 0);
  }, []);

  const handleDrawerNavigate = useCallback(
    (routeId: string) => {
      switch (routeId) {
        case 'home':
          break;
        case 'appointment':
          goToAppointment();
          break;
        case 'consultation':
          goToConsultation();
          break;
        case 'services':
          goToServiceSearch();
          break;
        case 'doctors':
          goToDoctorSearch();
          break;
        case 'records':
          navigateTab(SCREEN_NAME.REPORT);
          break;
        case 'promotions':
          navigation.navigate(SCREEN_NAME.PATIENT_PROMOTIONS);
          break;
        default:
          break;
      }
    },
    [
      goToAppointment,
      goToConsultation,
      goToDoctorSearch,
      goToServiceSearch,
      navigateTab,
      navigation,
    ],
  );

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Local logout still works even if server call fails
    } finally {
      await removeAuthSession();
      dispatch(clearSession());
      navigation
        .getParent()
        ?.getParent()
        ?.reset({
          index: 0,
          routes: [{ name: getLoginRoute(role || 'PATIENT') }],
        });
    }
  }, [dispatch, navigation, role]);

  const renderRow = ({ item }: { item: HomeRow }) => {
    if (item.id === 'hero') {
      return (
        <PatientHomeHeroSearch
          banner={banner}
          banners={bannersQuery.data ?? []}
          keyword={keyword}
          onConsultationPress={goToConsultation}
          onKeywordChange={handleKeywordChange}
          onQuickAppointmentPress={goToAppointment}
          onSearchSubmit={handleSearchSubmit}
          onSuggestionPress={handleSuggestionPress}
          searchResults={searchResults}
          showResults={showResults}
          suggestions={suggestions}
        />
      );
    }

    if (item.id === 'featured-service') {
      return (
        <FeaturedServiceBanner
          onPress={serviceName => goToServiceSearch(serviceName)}
          services={services}
        />
      );
    }

    const handlers = {
      onAppointmentPress: goToAppointment,
      onConsultationPress: goToConsultation,
      onDoctorsPress: goToDoctorSearch,
      onPromotionsPress: () =>
        navigation.navigate(SCREEN_NAME.PATIENT_PROMOTIONS),
      onServicePress: goToServiceSearch,
    };

    if (item.id === 'trust') return <TrustMetricsSection />;

    if (item.id === 'services') {
      return <ServicesPreviewSection handlers={handlers} services={services} />;
    }

    if (item.id === 'popular-methods') {
      return (
        <PopularMethodsSection handlers={handlers} services={services} />
      );
    }

    if (item.id === 'doctors') {
      return <DoctorsPreviewSection doctors={doctors} handlers={handlers} />;
    }

    if (item.id === 'clinical-cases') {
      return (
        <ClinicalCasesPreviewSection
          cases={clinicalCasesQuery.data ?? []}
        />
      );
    }

    if (item.id === 'promotion') {
      return (
        <PromotionCtaSection
          handlers={handlers}
          promotion={promotionsQuery.data?.[0]}
        />
      );
    }

    if (item.id === 'knowledge') {
      return (
        <KnowledgePreviewSection
          clinic={clinicConfigQuery.data}
          handlers={handlers}
          services={services}
        />
      );
    }

    if (item.id === 'location') {
      return (
        <ClinicLocationPreviewSection
          clinic={clinicConfigQuery.data}
          handlers={handlers}
        />
      );
    }

    return <DashboardFooterSection clinic={clinicConfigQuery.data} />;
  };

  return (
    <Screen className="bg-background">
      <PatientHomeHeader
        hasNotification={true}
        onMenuPress={() => setDrawerOpen(true)}
        onNotificationPress={() =>
          navigation.navigate(SCREEN_NAME.PATIENT_NOTIFICATIONS)
        }
        user={user}
      />
      <View className="flex-1">
        <ScreenList
          contentContainerStyle={styles.listContent}
          data={rows}
          keyExtractor={item => item.id}
          onRefresh={refresh}
          refreshing={refreshing}
          renderItem={renderRow}
        />
        <FloatingChatButton />
        <PatientDrawerModal
          clinicPhone={clinicConfigQuery.data?.phone || '1900 1234'}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onLogin={() => navigateRoot(SCREEN_NAME.PATIENT_LOGIN)}
          onLogout={handleLogout}
          onNavigate={handleDrawerNavigate}
          user={user}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 0,
    padding: 0,
    paddingBottom: 0,
  },
});
