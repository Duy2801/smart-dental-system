import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getManagedPatientProfiles } from '~src/features/appointment/api';
import type { PatientProfile } from '~src/features/appointment/types';
import type { RootState } from '~src/reducers/store';
import { getPatientRecordsPlans, getPatientRecordsSummary, mapRecordTreatments } from '../api';
import type { PatientRecordsResponse } from '../types';

export function usePatientRecordsData() {
  const loginState = useSelector((state: RootState) => state.login);
  const isLoggedIn = Boolean(loginState?.accessToken);
  const isHydrated = loginState?.isHydrated ?? true;

  const profilesQuery = useQuery<PatientProfile[]>({
    queryKey: ['managed-patient-profiles'],
    queryFn: getManagedPatientProfiles,
    enabled: isLoggedIn,
    staleTime: 60_000,
  });
  const profiles = profilesQuery.data ?? [];
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const activePatientId = profiles.some(profile => profile.id === selectedPatientId)
    ? selectedPatientId
    : (profiles.find(profile => profile.isPrimary) ?? profiles[0])?.id ?? '';
  const enabled = isLoggedIn && Boolean(activePatientId);

  const summaryQuery = useQuery({
    queryKey: ['patient-records', activePatientId, 'summary'],
    queryFn: () => getPatientRecordsSummary(activePatientId),
    enabled,
    staleTime: 5_000,
  });
  const plansQuery = useQuery({
    queryKey: ['patient-records', activePatientId, 'plans'],
    queryFn: () => getPatientRecordsPlans(activePatientId),
    enabled,
    staleTime: 5_000,
  });

  const selectedProfile = profiles.find(profile => profile.id === activePatientId);
  const profilePatient: PatientRecordsResponse['patient'] | null = selectedProfile
    ? {
        id: selectedProfile.id,
        patientCode: selectedProfile.patientCode,
        fullName: selectedProfile.fullName,
        phone: selectedProfile.phone ?? null,
        email: selectedProfile.email ?? '',
        gender: selectedProfile.gender === 'MALE' || selectedProfile.gender === 'FEMALE' || selectedProfile.gender === 'OTHER'
          ? selectedProfile.gender : 'UNKNOWN',
        dateOfBirth: selectedProfile.dateOfBirth ?? null,
        age: null,
        address: selectedProfile.address ?? null,
        medicalHistory: selectedProfile.medicalHistory ?? null,
        lastVisitAt: selectedProfile.lastVisit ?? null,
      }
    : null;
  const patient = summaryQuery.data?.patient ?? profilePatient;
  const recordsData: PatientRecordsResponse | null = patient ? {
    patient,
    medicalRecords: summaryQuery.data?.medicalRecords ?? [],
    treatmentPlans: plansQuery.data?.treatmentPlans ?? [],
  } : null;
  const treatments = useMemo(
    () => mapRecordTreatments(plansQuery.data?.treatmentPlans ?? []),
    [plansQuery.data],
  );

  return {
    isLoggedIn,
    isHydrated,
    profiles,
    activePatientId,
    setActivePatientId: setSelectedPatientId,
    recordsData,
    treatments,
    isLoading: profilesQuery.isLoading,
    recordsLoading: enabled && (summaryQuery.isLoading || plansQuery.isLoading),
    isRefetching: profilesQuery.isRefetching || summaryQuery.isRefetching || plansQuery.isRefetching,
    summaryError: summaryQuery.isError,
    plansError: plansQuery.isError,
    refetch: async () => {
      await profilesQuery.refetch();
      if (enabled) await Promise.all([summaryQuery.refetch(), plansQuery.refetch()]);
    },
  };
}
