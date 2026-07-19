"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SkeletonSettings } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { emptyClinicConfig, initialBusinessHours } from "./constants";
import { BusinessHoursPanel } from "./components/business-hours-panel";
import { GeneralSettingsPanel } from "./components/general-settings-panel";
import { SettingsSidebar } from "./components/settings-sidebar";
import { getClinicConfig, updateClinicConfig } from "./settings-api";
import type { ClinicConfig, ClinicSpecialDate, SettingsTab } from "./types";

export function SettingsPageContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [draftConfig, setDraftConfig] = useState<ClinicConfig | null>(null);
  const [message, setMessage] = useState("");

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
      setMessage("Da luu thong tin phong kham.");
      setDraftConfig(savedConfig);
      queryClient.setQueryData(queryKeys.admin.clinicConfig, savedConfig);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.clinicConfig,
      });
    },
    onError: () => {
      setMessage("Luu thong tin phong kham that bai.");
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

  const handleSave = async () => {
    setMessage("");
    try {
      await saveMutation.mutateAsync(form);
    } catch {
      // Error message is handled by the mutation onError callback.
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-8 p-6 md:p-8 lg:flex-row">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 flex-col pb-20">
        {isLoading ? (
          <SkeletonSettings />
        ) : null}

        {isError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            Khong tai duoc cau hinh phong kham.
          </div>
        ) : null}

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
            onChangeSpecialDate={updateSpecialDate}
            onAddSpecialDate={addSpecialDate}
            onInitialize={initializeBusinessHours}
            onRemoveSpecialDate={removeSpecialDate}
            onToggleDay={toggleDay}
          />
        ) : null}

        <div className="mt-auto pt-8">
          {message ? (
            <div className="mb-4 rounded-xl border border-border bg-white p-3 text-sm font-medium text-brand-dark shadow-sm">
              {message}
            </div>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={handleSave}
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveMutation.isPending ? "Dang luu..." : "Luu thay doi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
