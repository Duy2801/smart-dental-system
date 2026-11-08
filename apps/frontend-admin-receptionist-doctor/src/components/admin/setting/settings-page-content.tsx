"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FloppyDisk } from "@phosphor-icons/react";
import { AdminAlert, AdminButton, SkeletonSettings } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { emptyClinicConfig, initialBusinessHours } from "./constants";
import { BusinessHoursPanel } from "./components/business-hours-panel";
import { GeneralSettingsPanel } from "./components/general-settings-panel";
import { SettingsSidebar } from "./components/settings-sidebar";
import { ConfirmCancelDayModal } from "./components/confirm-cancel-day-modal";
import { getClinicConfig, updateClinicConfig } from "./settings-api";
import type {
  ClinicConfig,
  ClinicSpecialDate,
  LunchBreak,
  SettingsTab,
} from "./types";

export function SettingsPageContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [draftConfig, setDraftConfig] = useState<ClinicConfig | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [confirmCancel, setConfirmCancel] = useState<{
    dayName: string;
    onConfirmAction: () => void;
  } | null>(null);

  const {
    data: config,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.admin.clinicConfig,
    queryFn: getClinicConfig,
  });

  const saveMutation = useMutation({
    mutationFn: updateClinicConfig,
    onSuccess: (savedConfig) => {
      setSuccessMessage("Cập nhật thông tin và cấu hình giờ làm việc phòng khám thành công!");
      setErrorMessage("");
      setDraftConfig(savedConfig);
      queryClient.setQueryData(queryKeys.admin.clinicConfig, savedConfig);

      // Auto dismiss success message after 5s
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: () => {
      setErrorMessage("Lưu thông tin phòng khám thất bại. Vui lòng kiểm tra lại kết nối.");
      setSuccessMessage("");
    },
  });

  const form = draftConfig ?? config ?? emptyClinicConfig;

  const toggleDay = (index: number) => {
    setDraftConfig((current) => {
      const currentConfig = current ?? form;
      return {
        ...currentConfig,
        businessHours: currentConfig.businessHours.map((day, currentIndex) =>
          currentIndex === index ? { ...day, isOpen: !day.isOpen } : day,
        ),
      };
    });
  };

  const handleRequestToggleDay = (index: number) => {
    const day = form.businessHours[index];
    if (day && day.isOpen) {
      // Prompt warning before turning off open day
      setConfirmCancel({
        dayName: day.label,
        onConfirmAction: () => toggleDay(index),
      });
    } else {
      toggleDay(index);
    }
  };

  const changeTime = (
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    setDraftConfig((current) => {
      const currentConfig = current ?? form;
      return {
        ...currentConfig,
        businessHours: currentConfig.businessHours.map((day, currentIndex) =>
          currentIndex === index ? { ...day, [field]: value } : day,
        ),
      };
    });
  };

  const initializeBusinessHours = () => {
    setDraftConfig((current) => ({
      ...(current ?? form),
      businessHours: initialBusinessHours,
      isBusinessHoursConfigured: true,
    }));
  };

  const updateSlotIntervalMinutes = (value: number) => {
    setDraftConfig((current) => ({
      ...(current ?? form),
      slotIntervalMinutes: value,
    }));
  };

  const updateLunchBreak = (
    field: keyof LunchBreak,
    value: string | boolean,
  ) => {
    setDraftConfig((current) => {
      const currentConfig = current ?? form;
      return {
        ...currentConfig,
        lunchBreak: {
          ...currentConfig.lunchBreak,
          [field]: value,
        },
      };
    });
  };

  const updateSpecialDate = (
    index: number,
    field: keyof ClinicSpecialDate,
    value: string | boolean,
  ) => {
    setDraftConfig((current) => {
      const currentConfig = current ?? form;
      return {
        ...currentConfig,
        specialDates: currentConfig.specialDates.map((item, currentIndex) =>
          currentIndex === index ? { ...item, [field]: value } : item,
        ),
      };
    });
  };

  const handleRequestSpecialDateChange = (
    index: number,
    field: keyof ClinicSpecialDate,
    value: string | boolean,
  ) => {
    if (field === "isClosed" && value === true) {
      const item = form.specialDates[index];
      const dayLabel = item?.date
        ? `Ngày ${item.date}${item.label ? ` (${item.label})` : ""}`
        : "Ngày đặc biệt";
      setConfirmCancel({
        dayName: dayLabel,
        onConfirmAction: () => updateSpecialDate(index, field, value),
      });
    } else {
      updateSpecialDate(index, field, value);
    }
  };

  const addSpecialDate = () => {
    setDraftConfig((current) => {
      const currentConfig = current ?? form;
      return {
        ...currentConfig,
        specialDates: [
          ...currentConfig.specialDates,
          {
            date: "",
            label: "",
            isClosed: true,
          },
        ],
      };
    });
  };

  const removeSpecialDate = (index: number) => {
    setDraftConfig((current) => {
      const currentConfig = current ?? form;
      return {
        ...currentConfig,
        specialDates: currentConfig.specialDates.filter(
          (_, currentIndex) => currentIndex !== index,
        ),
      };
    });
  };

  const handleRequestRemoveSpecialDate = (index: number) => {
    const item = form.specialDates[index];
    const dayLabel = item?.date
      ? `Ngày ${item.date}${item.label ? ` (${item.label})` : ""}`
      : "Ngày đặc biệt";
    setConfirmCancel({
      dayName: dayLabel,
      onConfirmAction: () => removeSpecialDate(index),
    });
  };

  const handleSave = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (
      form.lunchBreak.isEnabled &&
      form.lunchBreak.start >= form.lunchBreak.end
    ) {
      setErrorMessage("Giờ bắt đầu nghỉ trưa phải sớm hơn giờ kết thúc.");
      return;
    }

    try {
      await saveMutation.mutateAsync(form);
    } catch {
      // Error is handled by onError callback
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-8 p-6 md:p-8 lg:flex-row">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex min-w-0 flex-1 flex-col pb-6">
        <div className="mb-5 space-y-3 empty:hidden">
          <AdminAlert variant="success" message={successMessage || null} />
          <AdminAlert
            message={
              isError || errorMessage
                ? errorMessage || "Không tải được cấu hình thông tin phòng khám từ máy chủ."
                : null
            }
          />
        </div>

        {isLoading ? <SkeletonSettings /> : null}

        {!isLoading && activeTab === "general" ? (
          <GeneralSettingsPanel config={form} onChange={setDraftConfig} />
        ) : null}

        {!isLoading && activeTab === "hours" ? (
          <BusinessHoursPanel
            businessHours={form.businessHours}
            lunchBreak={form.lunchBreak}
            slotIntervalMinutes={form.slotIntervalMinutes}
            specialDates={form.specialDates}
            isConfigured={form.isBusinessHoursConfigured}
            onChangeTime={changeTime}
            onChangeSlotInterval={updateSlotIntervalMinutes}
            onChangeLunchBreak={updateLunchBreak}
            onChangeSpecialDate={handleRequestSpecialDateChange}
            onAddSpecialDate={addSpecialDate}
            onInitialize={initializeBusinessHours}
            onRemoveSpecialDate={handleRequestRemoveSpecialDate}
            onToggleDay={handleRequestToggleDay}
          />
        ) : null}

        <div className="sticky bottom-4 z-10 mt-8 flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-md">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <FloppyDisk size={16} className="text-slate-400" />
            Thay đổi chỉ được áp dụng sau khi bấm lưu.
          </p>
          <AdminButton loading={saveMutation.isPending} onClick={handleSave}>
            {saveMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </AdminButton>
        </div>
      </div>

      {/* Warning Confirmation Modal on Day Cancellation / Closing */}
      <ConfirmCancelDayModal
        isOpen={Boolean(confirmCancel)}
        dayName={confirmCancel?.dayName || ""}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => {
          if (confirmCancel?.onConfirmAction) {
            confirmCancel.onConfirmAction();
          }
          setConfirmCancel(null);
        }}
      />
    </div>
  );
}
