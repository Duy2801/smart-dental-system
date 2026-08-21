"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAlert } from "@/src/components/admin/common";
import { getClinicConfig } from "@/src/components/admin/setting/settings-api";
import { queryKeys } from "@/src/lib/query/query-keys";
import { defaultScheduleForm } from "./constants";
import {
  createDoctorAvailability,
  deleteDoctorAvailability,
  getDoctorAvailability,
  getDoctors,
  getShiftMatrix,
  updateTimeOffApproval,
} from "./schedule-api";
import { ScheduleFormModal } from "./components/schedule-form-modal";
import { ScheduleTable } from "./components/schedule-table";
import { ScheduleToolbar } from "./components/schedule-toolbar";
import { ShiftMatrixTable } from "./components/shift-matrix-table";
import { ConflictModal } from "./components/conflict-modal";
import { getErrorMessage } from "./schedule-utils";
import type { AppointmentConflictItem, AvailabilityApprovalStatus, ScheduleFormState } from "./types";
import type { BusinessHour } from "../setting/types";

export function SchedulesPageContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"INDIVIDUAL" | "MATRIX">("INDIVIDUAL");
  const [doctorId, setDoctorId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState<ScheduleFormState>(defaultScheduleForm);

  // Conflict handling state
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflicts, setConflicts] = useState<AppointmentConflictItem[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    type: "CREATE" | "DELETE";
    deleteId?: string;
  } | null>(null);

  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    isError: isDoctorsError,
  } = useQuery({
    queryKey: queryKeys.admin.schedules.doctors,
    queryFn: async () => {
      const doctorList = await getDoctors();
      return doctorList.filter((doctor) => doctor.isActive);
    },
  });

  const { data: clinicConfig } = useQuery({
    queryKey: queryKeys.admin.clinicConfig,
    queryFn: getClinicConfig,
  });

  const selectedDoctorId = doctorId || doctors[0]?.id || "";
  const businessHours = clinicConfig?.businessHours ?? [];
  const openBusinessHours = businessHours.filter((day) => day.isOpen);
  const canManageSchedule =
    Boolean(selectedDoctorId) && Boolean(clinicConfig?.isBusinessHoursConfigured);

  const {
    data: schedule = null,
    isLoading: loadingSchedule,
    isError: isScheduleError,
  } = useQuery({
    queryKey: queryKeys.admin.schedules.availability(selectedDoctorId),
    queryFn: () => getDoctorAvailability(selectedDoctorId),
    enabled: Boolean(selectedDoctorId) && activeTab === "INDIVIDUAL",
  });

  const {
    data: matrixData = null,
    isLoading: loadingMatrix,
  } = useQuery({
    queryKey: ["admin", "schedules", "matrix"],
    queryFn: getShiftMatrix,
    enabled: activeTab === "MATRIX",
  });

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId),
    [selectedDoctorId, doctors],
  );

  const invalidateSchedule = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.admin.schedules.availability(selectedDoctorId),
    });
    queryClient.invalidateQueries({
      queryKey: ["admin", "schedules", "matrix"],
    });
  };

  const getBusinessHourForDay = (dayOfWeek: number) =>
    businessHours.find((day) => day.id === dayOfWeek);

  const getFallbackBusinessHour = (): BusinessHour | undefined =>
    openBusinessHours[0] ?? businessHours[0];

  const openAddModal = (dayOfWeek = 1, autoSchedule = false) => {
    const businessHour =
      getBusinessHourForDay(dayOfWeek) ?? getFallbackBusinessHour();
    const selectedDays = autoSchedule
      ? openBusinessHours.map((day) => day.id)
      : [businessHour?.id ?? dayOfWeek];

    setForm({
      ...defaultScheduleForm,
      autoSchedule,
      dayOfWeek: businessHour?.id ?? dayOfWeek,
      startTime: businessHour?.start ?? defaultScheduleForm.startTime,
      endTime: businessHour?.end ?? defaultScheduleForm.endTime,
      selectedDays,
      autoShifts: [
        {
          startTime: businessHour?.start ?? defaultScheduleForm.startTime,
          endTime: businessHour?.end ?? defaultScheduleForm.endTime,
        },
      ],
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsAddModalOpen(false);
  };

  const toggleSelectedDay = (dayOfWeek: number) => {
    setForm((current) => {
      const selectedDays = current.selectedDays.includes(dayOfWeek)
        ? current.selectedDays.filter((day) => day !== dayOfWeek)
        : [...current.selectedDays, dayOfWeek].sort(
            (a, b) =>
              businessHours.findIndex((day) => day.id === a) -
              businessHours.findIndex((day) => day.id === b),
          );

      return { ...current, selectedDays };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>, force = false) => {
    if (event) event.preventDefault();
    if (!selectedDoctorId) return;

    setSubmitting(true);
    setError(null);

    try {
      await createDoctorAvailability(selectedDoctorId, form, businessHours, force);
      setIsAddModalOpen(false);
      setConflictModalOpen(false);
      await invalidateSchedule();
    } catch (err: any) {
      const respData = err?.response?.data;
      if (respData?.code === "APPOINTMENT_CONFLICT" && respData?.conflicts) {
        setConflicts(respData.conflicts);
        setPendingAction({ type: "CREATE" });
        setConflictModalOpen(true);
      } else {
        setError(getErrorMessage(err, "Lưu lịch thất bại"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveStatus = async (id: string, approvalStatus: AvailabilityApprovalStatus) => {
    try {
      await updateTimeOffApproval(id, approvalStatus);
      await invalidateSchedule();
    } catch (err) {
      setError(getErrorMessage(err, "Cập nhật trạng thái phê duyệt thất bại"));
    }
  };

  const removeRecord = async (id: string, force = false) => {
    if (!force) {
      const confirmed = window.confirm("Bạn chắc chắn muốn xóa lịch này?");
      if (!confirmed) return;
    }

    setError(null);
    try {
      await deleteDoctorAvailability(id, force);
      setConflictModalOpen(false);
      await invalidateSchedule();
    } catch (err: any) {
      const respData = err?.response?.data;
      if (respData?.code === "APPOINTMENT_CONFLICT" && respData?.conflicts) {
        setConflicts(respData.conflicts);
        setPendingAction({ type: "DELETE", deleteId: id });
        setConflictModalOpen(true);
      } else {
        setError(getErrorMessage(err, "Xóa lịch thất bại"));
      }
    }
  };

  const handleConfirmForce = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "CREATE") {
      handleSubmit(null as any, true);
    } else if (pendingAction.type === "DELETE" && pendingAction.deleteId) {
      removeRecord(pendingAction.deleteId, true);
    }
  };

  const queryError = isDoctorsError
    ? "Không tải được danh sách bác sĩ"
    : isScheduleError
      ? "Không tải được lịch làm việc"
      : null;

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("INDIVIDUAL")}
              className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "INDIVIDUAL"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Lịch từng bác sĩ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MATRIX")}
              className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "MATRIX"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Ma trận ca trực toàn phòng khám
            </button>
          </div>
        </div>

        {activeTab === "INDIVIDUAL" ? (
          <>
            <ScheduleToolbar
              doctorId={selectedDoctorId}
              doctors={doctors}
              loadingDoctors={loadingDoctors}
              selectedDoctor={selectedDoctor}
              onDoctorChange={setDoctorId}
              onOpenManual={() => openAddModal(openBusinessHours[0]?.id ?? 1)}
              onOpenAuto={() => openAddModal(openBusinessHours[0]?.id ?? 1, true)}
              scheduleDisabled={!canManageSchedule}
            />

            <AdminAlert
              message={
                error ||
                queryError ||
                (clinicConfig && !clinicConfig.isBusinessHoursConfigured
                  ? "Cần cấu hình giờ làm việc phòng khám trước khi lập lịch bác sĩ."
                  : null)
              }
            />

            <ScheduleTable
              businessHours={businessHours}
              loading={loadingSchedule}
              schedule={schedule}
              onAddDay={(dayOfWeek) => openAddModal(dayOfWeek)}
              onRemove={(id) => removeRecord(id, false)}
              onApprove={handleApproveStatus}
            />
          </>
        ) : (
          <ShiftMatrixTable loading={loadingMatrix} matrix={matrixData} />
        )}
      </div>

      {isAddModalOpen ? (
        <ScheduleFormModal
          form={form}
          businessHours={businessHours}
          submitting={submitting}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={(e) => handleSubmit(e, false)}
          toggleSelectedDay={toggleSelectedDay}
        />
      ) : null}

      {conflictModalOpen ? (
        <ConflictModal
          isOpen={conflictModalOpen}
          onClose={() => setConflictModalOpen(false)}
          onConfirmForce={handleConfirmForce}
          conflicts={conflicts}
          actionName={pendingAction?.type === "CREATE" ? "Đăng ký lịch / nghỉ" : "Xóa ca trực"}
        />
      ) : null}
    </>
  );
}

