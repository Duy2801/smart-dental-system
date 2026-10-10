"use client";

import { useMemo, useState } from "react";
import { useAppSelector } from "@/providers";
import {
  useManagedPatientProfilesQuery,
} from "../../appointment/hooks/useAppointmentQueries";
import { mapRecordTreatments } from "./recordMappers";
import { usePatientRecordsPlansQuery, usePatientRecordsSummaryQuery } from "../hooks/useRecordsQueries";
import { RecordHistorySection } from "./RecordHistorySection";
import { LoginRequiredPanel } from "../../common/LoginRequiredPanel";
import type { PatientRecordsResponse } from "../api";

export function PatientRecordsPageClient() {
  const { isAuthenticated, accessToken, isHydrated } = useAppSelector(
    (state) => state.login,
  );
  const isLoggedIn = isAuthenticated && Boolean(accessToken);
  const profilesQuery = useManagedPatientProfilesQuery(isLoggedIn);
  const profiles = profilesQuery.data ?? [];
  const [selectedPatientId, setSelectedPatientId] = useState("");

  // Calculate primary / active patient ID immediately without waiting for useEffect rerender
  const activePatientId = useMemo(() => {
    if (selectedPatientId) return selectedPatientId;
    if (profiles.length === 0) return "";
    const primary = profiles.find((profile) => profile.isPrimary) ?? profiles[0];
    return primary?.id ?? "";
  }, [profiles, selectedPatientId]);

  const enabled = isLoggedIn && Boolean(activePatientId);
  const summaryQuery = usePatientRecordsSummaryQuery(activePatientId, enabled);
  const plansQuery = usePatientRecordsPlansQuery(activePatientId, enabled);
  const selectedProfile = profiles.find((profile) => profile.id === activePatientId);
  const profilePatient: PatientRecordsResponse["patient"] | null = selectedProfile
    ? {
        id: selectedProfile.id,
        patientCode: selectedProfile.patientCode,
        fullName: selectedProfile.fullName,
        phone: selectedProfile.phone ?? null,
        email: selectedProfile.email ?? "",
        gender: selectedProfile.gender === "MALE" || selectedProfile.gender === "FEMALE" || selectedProfile.gender === "OTHER" ? selectedProfile.gender : "UNKNOWN",
        dateOfBirth: selectedProfile.dateOfBirth ?? null,
        age: null,
        address: selectedProfile.address ?? null,
        medicalHistory: selectedProfile.medicalHistory ?? null,
        lastVisitAt: selectedProfile.lastVisit ?? null,
      }
    : null;
  const patient = summaryQuery.data?.patient ?? profilePatient;
  const recordsData: PatientRecordsResponse | null = patient
    ? {
        patient,
        medicalRecords: summaryQuery.data?.medicalRecords ?? [],
        treatmentPlans: plansQuery.data?.treatmentPlans ?? [],
      }
    : null;

  // Show LoginRequiredPanel ONLY after auth hydration completes and user is confirmed unauthenticated
  if (isHydrated && !isLoggedIn) {
    return (
      <LoginRequiredPanel
        title="Xem hồ sơ bệnh án"
        description="Đăng nhập để chọn người khám trong gia đình, xem phác đồ điều trị, lịch sử khám và các thông tin y tế cá nhân."
        loginLabel="Đăng nhập để xem hồ sơ"
        redirectTo="/records"
        secondaryHref="/service"
        secondaryLabel="Xem dịch vụ"
        icon="document"
      />
    );
  }

  const treatments = plansQuery.data
    ? mapRecordTreatments(plansQuery.data.treatmentPlans)
    : [];

  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-8 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <section className="min-w-0">
        <RecordHistorySection
          key={activePatientId}
          treatments={treatments}
          recordsData={recordsData}
          profiles={profiles}
          selectedPatientId={activePatientId}
          onSelectPatient={setSelectedPatientId}
          profilesLoading={profilesQuery.isLoading}
          summaryLoading={summaryQuery.isLoading}
          plansLoading={plansQuery.isLoading}
          summaryError={summaryQuery.isError}
          plansError={plansQuery.isError}
        />
      </section>
    </main>
  );
}
