"use client";

import { Coffee } from "@phosphor-icons/react";
import {
  AdminCard,
  AdminInput,
  AdminSwitch,
} from "@/src/components/admin/common";
import type { LunchBreak } from "../types";

type LunchBreakPanelProps = {
  lunchBreak: LunchBreak;
  onChange: (
    field: keyof LunchBreak,
    value: string | boolean,
  ) => void;
};

export function LunchBreakPanel({
  lunchBreak,
  onChange,
}: LunchBreakPanelProps) {
  return (
    <AdminCard
      title="Giờ nghỉ trưa"
      description="Áp dụng cho tất cả bác sĩ, dịch vụ và hình thức đặt lịch."
      icon={<Coffee size={18} weight="duotone" />}
      action={
        <AdminSwitch
          checked={lunchBreak.isEnabled}
          onChange={(checked) => onChange("isEnabled", checked)}
          label="Bật hoặc tắt giờ nghỉ trưa"
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminInput
          label="Từ"
          type="time"
          value={lunchBreak.start}
          disabled={!lunchBreak.isEnabled}
          onChange={(event) => onChange("start", event.target.value)}
        />
        <AdminInput
          label="Đến"
          type="time"
          value={lunchBreak.end}
          disabled={!lunchBreak.isEnabled}
          onChange={(event) => onChange("end", event.target.value)}
        />
      </div>
    </AdminCard>
  );
}
