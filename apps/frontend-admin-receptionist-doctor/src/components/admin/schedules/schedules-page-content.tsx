"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAlert } from "@/src/components/admin/common";
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
  const selectedDoctorId = doctorId || doctors[0]?.id || "";

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

  const openAddModal = (dayOfWeek = 1, autoSchedule = false) => {
    setForm({
      ...defaultScheduleForm,
      autoSchedule,
      dayOfWeek,
      selectedDays: autoSchedule ? [1, 2, 3, 4, 5] : [dayOfWeek],
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsAddModalOpen(false);
  };

  const setAutoShift = (
    index: number,
    key: "startTime" | "endTime",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      autoShifts: current.autoShifts.map((shift, shiftIndex) =>
        shiftIndex === index ? { ...shift, [key]: value } : shift,
      ),
    }));
  };

  const toggleSelectedDay = (dayOfWeek: number) => {
    setForm((current) => {
      const selectedDays = current.selectedDays.includes(dayOfWeek)
        ? current.selectedDays.filter((day) => day !== dayOfWeek)
        : [...current.selectedDays, dayOfWeek].sort((a, b) => a - b);

      return { ...current, selectedDays };
    });
  };

  const addAutoShift = () => {
    setForm((current) => ({
      ...current,
      autoShifts: [
        ...current.autoShifts,
        { startTime: "08:00", endTime: "12:00" },
      ],
    }));
  };

  const removeAutoShift = (index: number) => {
    setForm((current) => ({
      ...current,
      autoShifts: current.autoShifts.filter(
        (_, shiftIndex) => shiftIndex !== index,
      ),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDoctorId) return;

    setSubmitting(true);
    setError(null);

    try {
      await createDoctorAvailability(selectedDoctorId, form);
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
          onOpenManual={() => openAddModal(1)}
          onOpenAuto={() => openAddModal(1, true)}
        />

        <AdminAlert message={error || queryError} />

        <ScheduleTable
          loading={loadingSchedule}
          schedule={schedule}
          onAddDay={(dayOfWeek) => openAddModal(dayOfWeek)}
          onRemove={removeRecord}
        />
      </div>

      {isAddModalOpen ? (
        <ScheduleFormModal
          form={form}
          submitting={submitting}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
          toggleSelectedDay={toggleSelectedDay}
          setAutoShift={setAutoShift}
          addAutoShift={addAutoShift}
          removeAutoShift={removeAutoShift}
        />
      ) : null}
    </>
  );
}
