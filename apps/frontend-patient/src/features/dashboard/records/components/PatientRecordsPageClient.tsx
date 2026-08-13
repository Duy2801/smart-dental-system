"use client";

import Link from "next/link";
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
import { RecordPatientHero } from "./RecordPatientHero";
import { PatientPageSkeleton } from "../../common/PatientSkeleton";
import { ROUTES } from "../../common/routes";
import { LoginRequiredPanel } from "../../common/LoginRequiredPanel";

const relationshipLabels: Record<string, string> = {
  SELF: "Tôi",
  CHILD: "Con",
  FATHER: "Bố",
  MOTHER: "Mẹ",
  OTHER: "Người thân",
};

export function PatientRecordsPageClient() {
  const { isAuthenticated, accessToken } = useAppSelector(
    (state) => state.login,
  );
  const isLoggedIn = isAuthenticated && Boolean(accessToken);
  const queryClient = useQueryClient();
  const profilesQuery = useManagedPatientProfilesQuery(isLoggedIn);
  const profiles = profilesQuery.data ?? [];
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const createProfileMutation = useMutation({
    mutationFn: createManagedPatientProfile,
    onSuccess: async (profile) => {
      setSelectedPatientId(profile.id);
      await queryClient.invalidateQueries({
        queryKey: appointmentQueryKeys.patientProfiles(),
      });
    },
  });

  useEffect(() => {
    if (selectedPatientId || profiles.length === 0) return;
    const primaryProfile =
      profiles.find((profile) => profile.isPrimary) ?? profiles[0];
    setSelectedPatientId(primaryProfile.id);
  }, [profiles, selectedPatientId]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedPatientId) ?? null,
    [profiles, selectedPatientId],
  );

  const recordsQuery = usePatientRecordsQuery(
    selectedPatientId || undefined,
    isLoggedIn && Boolean(selectedPatientId),
  );

  if (profilesQuery.isLoading && !profiles.length) {
    return <PatientPageSkeleton />;
  }

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

  if (recordsQuery.isError || (!recordsQuery.isLoading && !recordsQuery.data)) {
    return (
      <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          Không thể tải hồ sơ điều trị. Vui lòng đăng nhập lại hoặc thử lại sau.
        </section>
      </main>
    );
  }

  const treatments = recordsQuery.data
    ? mapRecordTreatments(recordsQuery.data.treatmentPlans)
    : [];
  const relationshipLabel = selectedProfile
    ? relationshipLabels[selectedProfile.relationship] ?? "Người thân"
    : "Người khám";

  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-5 px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
        <Link href={ROUTES.home} className="hover:text-[#0863c5]">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-800">Hồ sơ</span>
      </div>

      <FamilyProfilePanel
        profiles={profiles}
        selectedPatientId={selectedPatientId}
        loading={profilesQuery.isLoading}
        creating={createProfileMutation.isPending}
        onSelect={setSelectedPatientId}
        onCreate={(payload) => createProfileMutation.mutateAsync(payload)}
      />

      <section className="min-w-0 space-y-5">
        {recordsQuery.isLoading || !recordsQuery.data ? (
          <PatientPageSkeleton />
        ) : (
          <>
            <RecordPatientHero
              patient={recordsQuery.data.patient}
              relationshipLabel={relationshipLabel}
            />
            <RecordHistorySection treatments={treatments} />
          </>
        )}
      </section>
    </main>
  );
}

function FamilyProfilePanel({
  profiles,
  selectedPatientId,
  loading,
  creating,
  onSelect,
  onCreate,
}: {
  profiles: PatientProfile[];
  selectedPatientId: string;
  loading?: boolean;
  creating?: boolean;
  onSelect: (patientId: string) => void;
  onCreate: (payload: CreatePatientProfilePayload) => Promise<unknown>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "UNKNOWN",
    relationship: "CHILD",
  });

  async function handleCreate() {
    const fullName = form.fullName.trim();
    if (!fullName) return;

    await onCreate({
      fullName,
      phone: form.phone.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender,
      relationship: form.relationship,
    });

    setForm({
      fullName: "",
      phone: "",
      dateOfBirth: "",
      gender: "UNKNOWN",
      relationship: "CHILD",
    });
    setShowForm(false);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0058bc]">
              Hồ sơ người khám
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">
              Danh sách hồ sơ
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="h-9 rounded-xl border border-[#0863c5] bg-[#0863c5] px-3 text-xs font-bold text-white transition hover:bg-[#0753a8]"
          >
            + Thêm
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Chọn hồ sơ để xem bệnh án tương ứng.
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const selected = profile.id === selectedPatientId;
            const relationship =
              relationshipLabels[profile.relationship] ?? "Người thân";

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile.id)}
                className={`min-w-0 rounded-xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-[#0863c5] bg-blue-50 shadow-sm ring-2 ring-blue-100"
                    : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-sm font-extrabold ${
                      selected
                        ? "border-[#0863c5] bg-[#0863c5] text-white"
                        : "border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {getInitials(profile.fullName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-950">
                      {profile.fullName}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{relationship}</span>
                      {profile.isPrimary ? (
                        <span className="rounded-full border border-blue-100 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#0863c5]">
                          Chính
                        </span>
                      ) : null}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="mt-3 text-xs font-medium text-slate-500">
            Đang tải danh sách hồ sơ...
          </p>
        ) : null}

        {showForm ? (
          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
              placeholder="Họ tên người khám"
              className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0863c5]"
            />
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="Số điện thoại nếu có"
              className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0863c5]"
            />
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dateOfBirth: event.target.value,
                }))
              }
              className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0863c5]"
            />
            <select
              value={form.relationship}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  relationship: event.target.value,
                }))
              }
              className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0863c5]"
            >
              <option value="CHILD">Con</option>
              <option value="FATHER">Bố</option>
              <option value="MOTHER">Mẹ</option>
              <option value="OTHER">Người thân</option>
            </select>
            <select
              value={form.gender}
              onChange={(event) =>
                setForm((current) => ({ ...current, gender: event.target.value }))
              }
              className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0863c5]"
            >
              <option value="UNKNOWN">Chưa rõ giới tính</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
            <button
              type="button"
              disabled={!form.fullName.trim() || creating}
              onClick={handleCreate}
              className="h-10 rounded-xl border border-[#0863c5] bg-[#0863c5] text-sm font-bold text-white transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 sm:col-span-2 lg:col-span-5"
            >
              {creating ? "Đang thêm..." : "Lưu hồ sơ"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
