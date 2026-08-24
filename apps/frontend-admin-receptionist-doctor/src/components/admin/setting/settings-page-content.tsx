"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SkeletonSettings } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { emptyClinicConfig, initialBusinessHours } from "./constants";
import { BusinessHoursPanel } from "./components/business-hours-panel";
import { GeneralSettingsPanel } from "./components/general-settings-panel";
import { SettingsSidebar } from "./components/settings-sidebar";
import { ConfirmCancelDayModal } from "./components/confirm-cancel-day-modal";
import { getClinicConfig, updateClinicConfig } from "./settings-api";
import type { ClinicConfig, ClinicSpecialDate, SettingsTab } from "./types";

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
    onSuccess: async (savedConfig) => {
      setSuccessMessage("Cập nhật thông tin và cấu hình giờ làm việc phòng khám thành công!");
      setErrorMessage("");
      setDraftConfig(savedConfig);
      queryClient.setQueryData(queryKeys.admin.clinicConfig, savedConfig);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.clinicConfig,
      });

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
    try {
      await saveMutation.mutateAsync(form);
    } catch {
      // Error is handled by onError callback
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-8 p-6 md:p-8 lg:flex-row">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 flex-col pb-20">
        {/* Success Alert Banner */}
        {successMessage ? (
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-950">Thành công!</p>
                <p className="text-xs font-medium text-emerald-800">{successMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}

        {/* Error Alert Banner */}
        {isError || errorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorMessage || "Không tải được cấu hình thông tin phòng khám từ máy chủ."}
          </div>
        ) : null}

        {isLoading ? <SkeletonSettings /> : null}

        {!isLoading && activeTab === "general" ? (
          <GeneralSettingsPanel config={form} onChange={setDraftConfig} />
        ) : null}

        {!isLoading && activeTab === "hours" ? (
          <BusinessHoursPanel
            businessHours={form.businessHours}
            slotIntervalMinutes={form.slotIntervalMinutes}
            specialDates={form.specialDates}
            isConfigured={form.isBusinessHoursConfigured}
            onChangeTime={changeTime}
            onChangeSlotInterval={updateSlotIntervalMinutes}
            onChangeSpecialDate={handleRequestSpecialDateChange}
            onAddSpecialDate={addSpecialDate}
            onInitialize={initializeBusinessHours}
            onRemoveSpecialDate={handleRequestRemoveSpecialDate}
            onToggleDay={handleRequestToggleDay}
          />
        ) : null}

        <div className="mt-auto pt-8">
          <div className="flex justify-end">
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={handleSave}
              className="rounded-xl bg-brand px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-dark hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
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
