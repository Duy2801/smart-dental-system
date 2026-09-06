import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
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
import { LoginRequiredRecord } from '../components/LoginRequiredRecord';
import { PatientAdminCard } from '../components/PatientAdminCard';
import { PlanProgressSummary } from '../components/PlanProgressSummary';
import { PlanSelectorList } from '../components/PlanSelectorList';
import { RecordPatientHeader } from '../components/RecordPatientHeader';
import { RecordSectionTabs } from '../components/RecordSectionTabs';
import { StepInvoiceModal } from '../components/StepInvoiceModal';
import { usePatientRecordsData } from '../hooks/usePatientRecordsData';
import type { TimelineStepView } from '../types';

export function PatientRecordsScreen() {
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.login?.user ?? null);
  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  const {
    isLoggedIn,
    profiles,
    activePatientId,
    setActivePatientId,
    recordsData,
    treatments,
    selectedTreatment,
    selectedPlanId,
    setSelectedPlanId,
    isLoading,
    isRefetching,
    refetch,
  } = usePatientRecordsData();

  const clinicQuery = useQuery({
    queryKey: ['clinic-config'],
    queryFn: getClinicConfigInfo,
    staleTime: 5 * 60 * 1000,
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
        {!isLoggedIn ? (
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
            {/* 1. Header & Family Profiles */}
            <RecordPatientHeader
              profiles={profiles}
              selectedPatientId={activePatientId}
              onSelectPatient={setActivePatientId}
            />

            {/* 2. Treatment Plans List */}
            {treatments.length > 0 ? (
              <PlanSelectorList
                treatments={treatments}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
              />
            ) : null}

            {/* 3. Detailed Treatment Card */}
            {selectedTreatment && recordsData ? (
              <View style={styles.detailSection}>
                {/* Administrative Patient Info */}
                <PatientAdminCard
                  patient={recordsData.patient}
                  treatment={selectedTreatment}
                />

                {/* Diagnostic & Progress Summary */}
                <PlanProgressSummary treatment={selectedTreatment} />

                {/* 4 Feature Tabs: Workflow, Prescriptions, Images, Invoices */}
                <RecordSectionTabs
                  treatment={selectedTreatment}
                  onOpenInvoiceModal={handleOpenInvoiceModal}
                />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Chưa có phác đồ điều trị</Text>
                <Text style={styles.emptySub}>
                  Hồ sơ sẽ xuất hiện sau khi phòng khám lập kế hoạch điều trị cho bệnh nhân.
                </Text>
              </View>
            )}
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
