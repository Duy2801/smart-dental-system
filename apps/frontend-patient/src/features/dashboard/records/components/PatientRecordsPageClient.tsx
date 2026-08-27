"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/providers";
import {
  appointmentQueryKeys,
  useManagedPatientProfilesQuery,
} from "../../appointment/hooks/useAppointmentQueries";
import {
  createManagedPatientProfile,
  type CreatePatientProfilePayload,
  type PatientProfile,
} from "../../appointment/api";
import { mapRecordTreatments } from "./recordMappers";
import { usePatientRecordsQuery } from "../hooks/useRecordsQueries";
import { RecordHistorySection } from "./RecordHistorySection";
import { PatientPageSkeleton, PatientRecordsSkeleton } from "../../common/PatientSkeleton";
import { LoginRequiredPanel } from "../../common/LoginRequiredPanel";

export function PatientRecordsPageClient() {
  const { isAuthenticated, accessToken, isHydrated } = useAppSelector(
    (state) => state.login,
  );
  const isLoggedIn = isAuthenticated && Boolean(accessToken);
  const queryClient = useQueryClient();
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

  // Sync state when activePatientId changes
  useEffect(() => {
    if (activePatientId && !selectedPatientId) {
      setSelectedPatientId(activePatientId);
    }
  }, [activePatientId, selectedPatientId]);

  const recordsQuery = usePatientRecordsQuery(
    activePatientId || undefined,
    isLoggedIn && Boolean(activePatientId),
  );

  // 1. Show skeleton while auth hydration is restoring (e.g. on F5 refresh)
  if (!isHydrated || (profilesQuery.isLoading && !profiles.length)) {
    return (
      <main className="mx-auto w-full max-w-[1360px] space-y-5 px-4 py-7 sm:px-6 lg:px-8">
        <PatientRecordsSkeleton />
      </main>
    );
  }

  // 2. Show LoginRequiredPanel ONLY after auth hydration finishes and user is not logged in
  if (!isLoggedIn) {
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

  const treatments = recordsQuery.data
    ? mapRecordTreatments(recordsQuery.data.treatmentPlans)
    : [];

  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-5 px-4 py-7 sm:px-6 lg:px-8">
      <section className="min-w-0 space-y-5">
        {recordsQuery.isLoading || !recordsQuery.data ? (
          <PatientRecordsSkeleton />
        ) : recordsQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            Không thể tải hồ sơ điều trị. Vui lòng đăng nhập lại hoặc thử lại sau.
          </div>
        ) : (
          <RecordHistorySection
            treatments={treatments}
            recordsData={recordsQuery.data}
            profiles={profiles}
            selectedPatientId={activePatientId}
            onSelectPatient={setSelectedPatientId}
          />
        )}
      </section>
    </main>
  );
}
