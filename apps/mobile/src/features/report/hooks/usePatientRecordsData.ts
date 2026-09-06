import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getManagedPatientProfiles } from '~src/features/appointment/api';
import type { PatientProfile } from '~src/features/appointment/types';
import type { RootState } from '~src/reducers/store';
import { getPatientRecords, mapRecordTreatments } from '../api';
import type { TreatmentRecordView } from '../types';

export function usePatientRecordsData() {
  const loginState = useSelector((state: RootState) => state.login);
  const isLoggedIn = Boolean(loginState?.accessToken);
  const isHydrated = loginState?.isHydrated ?? true;

  // 1. Fetch managed patient profiles (Gia đình)
  const profilesQuery = useQuery<PatientProfile[]>({
    queryKey: ['managed-patient-profiles'],
    queryFn: getManagedPatientProfiles,
    enabled: isLoggedIn,
    staleTime: 60000,
  });

  const profiles = profilesQuery.data ?? [];
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const activePatientId = useMemo(() => {
    if (selectedPatientId) return selectedPatientId;
    if (profiles.length === 0) return '';
    const primary = profiles.find(p => p.isPrimary) ?? profiles[0];
    return primary?.id ?? '';
  }, [profiles, selectedPatientId]);

  useEffect(() => {
    if (activePatientId && !selectedPatientId) {
      setSelectedPatientId(activePatientId);
    }
  }, [activePatientId, selectedPatientId]);

  // 2. Fetch records of active patient
  const recordsQuery = useQuery({
    queryKey: ['patient-records', activePatientId],
    queryFn: () => getPatientRecords(activePatientId || undefined),
    enabled: isLoggedIn,
    staleTime: 60000,
  });

  const recordsData = recordsQuery.data;

  // 3. Map treatment plans
  const treatments = useMemo<TreatmentRecordView[]>(() => {
    if (!recordsData?.treatmentPlans) return [];
    return mapRecordTreatments(recordsData.treatmentPlans);
  }, [recordsData]);

  // 4. Selected treatment plan state
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  useEffect(() => {
    if (treatments.length > 0) {
      setSelectedPlanId(prev => {
        const exists = treatments.some(t => t.id === prev);
        return exists ? prev : treatments[0].id;
      });
    } else {
      setSelectedPlanId('');
    }
  }, [treatments]);

  const selectedTreatment = useMemo(() => {
    return treatments.find(t => t.id === selectedPlanId) || treatments[0] || null;
  }, [treatments, selectedPlanId]);

  return {
    isLoggedIn,
    isHydrated,
    profiles,
    activePatientId,
    setActivePatientId: setSelectedPatientId,
    recordsData,
    treatments,
    selectedTreatment,
    selectedPlanId,
    setSelectedPlanId,
    isLoading: profilesQuery.isLoading || recordsQuery.isLoading,
    isRefetching: recordsQuery.isRefetching,
    refetch: async () => {
      await profilesQuery.refetch();
      await recordsQuery.refetch();
    },
  };
}
