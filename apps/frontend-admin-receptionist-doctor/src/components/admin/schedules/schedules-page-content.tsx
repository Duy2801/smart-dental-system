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
} from "./schedule-api";
import { ScheduleFormModal } from "./components/schedule-form-modal";
import { ScheduleTable } from "./components/schedule-table";
import { ScheduleToolbar } from "./components/schedule-toolbar";
import { getErrorMessage } from "./schedule-utils";
import type { ScheduleFormState } from "./types";
import type { BusinessHour } from "../setting/types";

export function SchedulesPageContent() {
  const queryClient = useQueryClient();
  const [doctorId, setDoctorId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState<ScheduleFormState>(defaultScheduleForm);

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
    enabled: Boolean(selectedDoctorId),
  });

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId),
    [selectedDoctorId, doctors],
  );

  const invalidateSchedule = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.admin.schedules.availability(selectedDoctorId),
    });

  const deleteMutation = useMutation({
    mutationFn: deleteDoctorAvailability,
    onSuccess: invalidateSchedule,
    onError: (err) => {
      setError(getErrorMessage(err, "Xoa lich that bai"));
    },
  });

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDoctorId) return;

    setSubmitting(true);
    setError(null);

    try {
      await createDoctorAvailability(selectedDoctorId, form, businessHours);
      setIsAddModalOpen(false);
      await invalidateSchedule();
    } catch (err) {
      setError(getErrorMessage(err, "Luu lich that bai"));
    } finally {
      setSubmitting(false);
    }
  };

  const removeRecord = async (id: string) => {
    const confirmed = window.confirm("Ban chac chan muon xoa lich nay?");
    if (!confirmed) return;

    setError(null);
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  const queryError = isDoctorsError
    ? "Khong tai duoc bac si"
    : isScheduleError
      ? "Khong tai duoc lich"
      : null;

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
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
              ? "Can cau hinh gio lam viec phong kham truoc khi lap lich bac si."
              : null)
          }
        />

        <ScheduleTable
          businessHours={businessHours}
          loading={loadingSchedule}
          schedule={schedule}
          onAddDay={(dayOfWeek) => openAddModal(dayOfWeek)}
          onRemove={removeRecord}
        />
      </div>

      {isAddModalOpen ? (
        <ScheduleFormModal
          form={form}
          businessHours={businessHours}
          submitting={submitting}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
          toggleSelectedDay={toggleSelectedDay}
        />
      ) : null}
    </>
  );
}
