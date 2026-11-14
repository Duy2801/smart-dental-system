"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CaretLeft,
  CaretRight,
  Eye,
  Phone,
  UserList,
  UsersThree,
} from "@phosphor-icons/react";
import {
  AdminAlert,
  AdminEmptyState,
  AdminFilterSelect,
  AdminSearchInput,
  AdminStatCard,
  AdminToolbar,
  SkeletonRows,
} from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import { getVisitedPatients } from "./patients-api";
import { PatientVisitDrawer } from "./components/patient-visit-drawer";
import { genderLabel } from "./patient-utils";
import type { VisitedPatient } from "./types";

const PAGE_SIZE = 10;
const ROW_GRID =
  "lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_auto] lg:items-center lg:gap-5";

type SortKey = "RECENT" | "MOST_VISITS" | "NAME";

export function PatientsPageContent() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("RECENT");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: patients = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.patients(search),
    queryFn: () => getVisitedPatients(search),
  });

  const sorted = useMemo(() => {
    const list = [...patients];
    if (sort === "MOST_VISITS") list.sort((a, b) => b.totalVisits - a.totalVisits);
    else if (sort === "NAME") list.sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));
    else
      list.sort(
        (a, b) =>
          new Date(b.lastVisit ?? 0).getTime() - new Date(a.lastVisit ?? 0).getTime(),
      );
    return list;
  }, [patients, sort]);

  // Mốc 30 ngày lấy một lần khi mở trang
  const [monthAgo] = useState(() => Date.now() - 30 * 24 * 60 * 60 * 1000);

  const stats = useMemo(() => {
    return {
      total: patients.length,
      visits: patients.reduce((sum, p) => sum + p.totalVisits, 0),
      recent: patients.filter((p) => p.lastVisit && new Date(p.lastVisit).getTime() >= monthAgo)
        .length,
    };
  }, [patients, monthAgo]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard
          label="Bệnh nhân đã khám"
          value={stats.total}
          suffix="người"
          icon={<UsersThree size={20} weight="duotone" />}
          tone="brand"
        />
        <AdminStatCard
          label="Tổng lượt khám"
          value={stats.visits}
          suffix="lượt"
          icon={<CalendarCheck size={20} weight="duotone" />}
          tone="emerald"
        />
        <AdminStatCard
          label="Khám trong 30 ngày"
          value={stats.recent}
          suffix="người"
          icon={<UserList size={20} weight="duotone" />}
          tone="violet"
        />
      </div>

      <AdminToolbar>
        <AdminSearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Tìm tên, mã bệnh nhân, số điện thoại..."
          className="w-full sm:max-w-sm"
        />
        <AdminFilterSelect
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as SortKey);
            setPage(1);
          }}
          aria-label="Sắp xếp"
          wrapperClassName="w-full sm:w-auto"
          className="sm:w-auto"
        >
          <option value="RECENT">Khám gần đây nhất</option>
          <option value="MOST_VISITS">Khám nhiều lần nhất</option>
          <option value="NAME">Tên A → Z</option>
        </AdminFilterSelect>
      </AdminToolbar>

      <AdminAlert message={isError ? "Không tải được danh sách bệnh nhân." : null} />

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div
          className={cn(
            "hidden border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500",
            ROW_GRID,
          )}
        >
          <div>Bệnh nhân</div>
          <div>Liên hệ</div>
          <div>Giới tính / tuổi</div>
          <div>Số lần khám</div>
          <div>Khám gần nhất</div>
          <div className="w-24 text-right">Chi tiết</div>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <SkeletonRows count={6} hasAvatar />
          ) : pageItems.length === 0 ? (
            <AdminEmptyState
              icon={<UsersThree size={24} weight="duotone" />}
              title={search ? "Không tìm thấy bệnh nhân phù hợp" : "Chưa có bệnh nhân nào tới khám"}
              description={
                search
                  ? "Thử tìm bằng tên, mã bệnh nhân hoặc số điện thoại khác."
                  : "Bệnh nhân sẽ xuất hiện ở đây sau lần khám hoàn tất đầu tiên."
              }
            />
          ) : (
            pageItems.map((patient) => (
              <PatientRow key={patient.id} patient={patient} onOpen={() => setSelectedId(patient.id)} />
            ))
          )}
        </div>

        {!isLoading && sorted.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
            <span>
              Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, sorted.length)} / {sorted.length} bệnh nhân
            </span>
            <div className="flex items-center gap-1.5">
              <PageButton
                label="Trang trước"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <CaretLeft size={14} weight="bold" />
              </PageButton>
              <span className="min-w-16 text-center font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <PageButton
                label="Trang sau"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <CaretRight size={14} weight="bold" />
              </PageButton>
            </div>
          </div>
        ) : null}
      </div>

      {selectedId ? (
        <PatientVisitDrawer patientId={selectedId} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}

function PatientRow({ patient, onOpen }: { patient: VisitedPatient; onOpen: () => void }) {
  const initials = patient.fullName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:px-6",
        ROW_GRID,
      )}
      onClick={onOpen}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-light text-sm font-bold text-brand">
          {initials || "BN"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{patient.fullName}</p>
          <p className="font-mono text-xs text-slate-500">{patient.patientCode}</p>
        </div>
      </div>

      <div className="min-w-0 text-xs">
        <p className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Phone size={13} className="shrink-0 text-slate-400" />
          {patient.phone || "—"}
        </p>
        <p className="mt-0.5 truncate text-slate-500">{patient.email || "Chưa có email"}</p>
      </div>

      <div className="text-xs text-slate-600">
        {genderLabel(patient.gender)}
        {patient.age !== null ? ` · ${patient.age} tuổi` : ""}
      </div>

      <div>
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
          {patient.totalVisits} lần
        </span>
      </div>

      <div className="text-xs font-semibold tabular-nums text-slate-700">
        {patient.lastVisit ? formatDate(patient.lastVisit) : "—"}
      </div>

      <div className="flex lg:w-24 lg:justify-end">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-brand/30 hover:bg-brand-light hover:text-brand"
        >
          <Eye size={14} weight="bold" />
          Xem
        </button>
      </div>
    </div>
  );
}

function PageButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
