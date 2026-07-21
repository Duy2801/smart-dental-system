"use client";

import { useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import { Plus, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { WeekCalendar } from "./_components/WeekCalendar";
import { AppointmentList } from "./_components/AppointmentList";
import { TimeOffModal } from "./_components/TimeOffModal";

type ViewMode = "week" | "list";

export default function DoctorSchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  return (
    <>
      <Header
        title="Lịch làm việc của tôi"
        description="Quản lý ca trực và lịch hẹn với bệnh nhân"
      >
        <button
          onClick={() => setShowLeaveModal(true)}
          className="ml-auto flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" />
          Đăng ký ngày nghỉ
        </button>
      </Header>

      <div className="space-y-6 p-6 md:p-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-1">
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                viewMode === "week"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-muted-foreground hover:text-brand-dark",
              )}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                viewMode === "list"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-muted-foreground hover:text-brand-dark",
              )}
            >
              Danh Sách
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm font-medium text-brand-dark">
            <button className="rounded p-1 text-muted-foreground hover:bg-muted">
              <CaretLeft size={16} />
            </button>
            <span>21/07 – 27/07, 2026</span>
            <button className="rounded p-1 text-muted-foreground hover:bg-muted">
              <CaretRight size={16} />
            </button>
          </div>
        </div>

        {viewMode === "week" ? <WeekCalendar /> : <AppointmentList />}
      </div>

      {showLeaveModal && (
        <TimeOffModal onClose={() => setShowLeaveModal(false)} />
      )}
    </>
  );
}
