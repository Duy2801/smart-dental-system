import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
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
import { CACHE_TIMES, queryKeys } from '~src/config/queryClient';
import type { RootState } from '~src/reducers/store';
import { LoginRequiredRecord } from '../components/LoginRequiredRecord';
import { MedicalVisitCard } from '../components/MedicalVisitCard';
import { PatientAdminCard } from '../components/PatientAdminCard';
import { RecordPatientHeader } from '../components/RecordPatientHeader';
import { RecordSectionTabs } from '../components/RecordSectionTabs';
import { StepInvoiceModal } from '../components/StepInvoiceModal';
import { usePatientRecordsData } from '../hooks/usePatientRecordsData';
import { cleanRecordTitle, detectTreatmentCategory, formatShortDate } from '../api';
import type { TimelineStepView } from '../types';

export function PatientRecordsScreen() {
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.login?.user ?? null);
  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  const {
    isLoggedIn,
    isHydrated,
    profiles,
    activePatientId,
    setActivePatientId,
    recordsData,
    treatments,
    isLoading,
    recordsLoading,
    isRefetching,
    summaryError,
    plansError,
    refetch,
  } = usePatientRecordsData();

  const [selectedRecordId, setSelectedRecordId] = useState('');
  const visits = recordsData?.medicalRecords ?? [];
  const recordItems = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date: string;
      doctor: string;
      kind: string;
      completedSteps: number;
      stepCount: number;
      category: string;
    }> = [];

    const coveredServices = new Set<string>();
    const coveredRecordIds = new Set<string>();

    treatments.forEach(t => {
      const displayTitle = cleanRecordTitle(t.title, t.category);
      const displayCategory = t.category || detectTreatmentCategory(t.title);
      if (displayCategory) coveredServices.add(displayCategory.toLowerCase().trim());
      if (t.category) coveredServices.add(t.category.toLowerCase().trim());

      t.treatmentPlan.forEach(step => {
        if ((step as any).medicalRecordId) {
          coveredRecordIds.add((step as any).medicalRecordId);
        }
      });

      list.push({
        id: `plan:${t.id}`,
        title: displayTitle,
        date: t.date,
        doctor: t.doctor,
        kind: 'Phác đồ',
        completedSteps: t.completedStepsCount,
        stepCount: t.totalStepsCount,
        category: displayCategory,
      });
    });

    recordsData?.treatmentPlans?.forEach(p => {
      p.steps?.forEach(s => {
        s.medicalRecords?.forEach(mr => coveredRecordIds.add(mr.id));
        s.appointments?.forEach(app => {
          if (app.service) coveredServices.add(app.service.toLowerCase().trim());
        });
      });
      if (Array.isArray(p.items)) {
        p.items.forEach((item: any) => {
          if (item?.service) coveredServices.add(String(item.service).toLowerCase().trim());
        });
      }
    });

    visits.forEach(visit => {
      if (coveredRecordIds.has(visit.id)) return;
      if (visit.treatmentPlanStepId) return;

      const vService = (visit.service || '').toLowerCase().trim();
      if (vService && coveredServices.has(vService)) return;

      const displayTitle = cleanRecordTitle(visit.diagnosis || visit.service, visit.service);
      const displayCategory = visit.service || detectTreatmentCategory(visit.diagnosis || '');

      list.push({
        id: `visit:${visit.id}`,
        title: displayTitle,
        date: formatShortDate(visit.createdAt),
        doctor: visit.doctor || 'Bác sĩ chuyên khoa',
        kind: 'Khám dịch vụ',
        completedSteps: 1,
        stepCount: 1,
        category: displayCategory,
      });
    });

    return list;
  }, [treatments, visits, recordsData]);
  const activeRecordId = recordItems.some(item => item.id === selectedRecordId)
    ? selectedRecordId : recordItems[0]?.id;
  const activeRecord = recordItems.find(item => item.id === activeRecordId);
  const selectedTreatment = treatments.find(treatment => `plan:${treatment.id}` === activeRecordId);
  const selectedVisit = visits.find(visit => `visit:${visit.id}` === activeRecordId);

  const clinicQuery = useQuery({
    queryKey: queryKeys.clinicConfig,
    queryFn: getClinicConfigInfo,
    staleTime: CACHE_TIMES.CLINIC_CONFIG.staleTime,
    gcTime: CACHE_TIMES.CLINIC_CONFIG.gcTime,
  });

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [selectedStepForInvoice, setSelectedStepForInvoice] =
    useState<TimelineStepView | null>(null);

  const handleOpenInvoiceModal = useCallback((step: TimelineStepView) => {
    setSelectedStepForInvoice(step);
    setInvoiceModalVisible(true);
  }, []);

  const handleCloseInvoiceModal = useCallback(() => {
    setInvoiceModalVisible(false);
    setSelectedStepForInvoice(null);
  }, []);

  return (
    <Screen>
      {/* Top Header Bar */}
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
        {isHydrated && !isLoggedIn ? (
          <LoginRequiredRecord />
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#0863c5" size="large" />
            <Text style={styles.loadingText}>
              Đang tải hồ sơ bệnh án & phác đồ điều trị...
            </Text>
          </View>
        ) : (
          <View style={styles.contentSection}>
            {/* 1. Header & Family Profiles & Record Selector */}
            <RecordPatientHeader
              profiles={profiles}
              selectedPatientId={activePatientId}
              onSelectPatient={setActivePatientId}
              recordItems={recordItems}
              activeRecordId={activeRecordId}
              onSelectRecord={setSelectedRecordId}
            />

            {recordsLoading && recordItems.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#0863c5" size="small" />
                <Text style={styles.loadingText}>Đang tải hồ sơ bệnh án...</Text>
              </View>
            ) : null}

            {(summaryError || plansError) && !recordsLoading && recordItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Không tải được hồ sơ bệnh án</Text>
                <Text style={styles.emptySub}>Kéo xuống để thử lại.</Text>
              </View>
            ) : null}

            {recordsData?.patient ? <PatientAdminCard patient={recordsData.patient} recordDate={activeRecord?.date} /> : null}

            {/* 3. Detailed Treatment Card */}
            {selectedVisit ? <MedicalVisitCard record={selectedVisit} /> : selectedTreatment && recordsData ? (
              <View style={styles.detailSection}>
                {/* 4 Feature Tabs: Workflow, Prescriptions, Images, Invoices */}
                <RecordSectionTabs
                  treatment={selectedTreatment}
                  recordsData={recordsData}
                  onOpenInvoiceModal={handleOpenInvoiceModal}
                />
              </View>
            ) : !recordsLoading && !summaryError && !plansError ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Chưa có hồ sơ bệnh án</Text>
                <Text style={styles.emptySub}>
                  Hồ sơ sẽ xuất hiện sau khi phòng khám ghi nhận lần khám hoặc lập phác đồ điều trị.
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* 4. Clinic Footer */}
        <View style={styles.footerContainer}>
          <PatientFooter clinic={clinicQuery.data} />
        </View>
      </ScrollView>

      {/* Floating Chat Button */}
      <FloatingChatButton />

      {/* Step Invoice Modal */}
      <StepInvoiceModal
        visible={invoiceModalVisible}
        step={selectedStepForInvoice}
        onClose={handleCloseInvoiceModal}
      />

      {/* Drawer */}
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
  detailSection: {
    marginTop: 6,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    marginVertical: 20,
    padding: 24,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
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
  scrollContainer: {
    paddingBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

export default PatientRecordsScreen;
