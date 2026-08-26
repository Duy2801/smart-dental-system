"use client";

import { useClinicConfigQuery } from "../home/hooks/useHomeQueries";
import type { getLiveClinicConfigInfo } from "../home/api";

function getOpenHoursText(
  hours: NonNullable<Awaited<ReturnType<typeof getLiveClinicConfigInfo>>["businessHours"]>,
) {
  return hours
    .filter((day) => day.isOpen)
    .slice(0, 3)
    .map((day) => `${day.label}: ${day.start} - ${day.end}`);
}

export function DashboardFooterClinicInfo() {
  const { data: clinic, isLoading } = useClinicConfigQuery();

  if (isLoading) {
    return (
      <>
        <div className="space-y-2">
          <p className="font-bold text-slate-800 text-xs">Địa chỉ phòng khám</p>
          <div className="h-3.5 w-44 rounded-md bg-slate-200/80 animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="font-bold text-slate-800 text-xs">Liên hệ & Hỗ trợ</p>
          <div className="h-3.5 w-36 rounded-md bg-slate-200/80 animate-pulse" />
          <div className="h-3.5 w-40 rounded-md bg-slate-200/80 animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="font-bold text-slate-800 text-xs">Giờ mở cửa</p>
          <div className="h-3.5 w-32 rounded-md bg-slate-200/80 animate-pulse" />
        </div>
      </>
    );
  }

  const openHours = getOpenHoursText(clinic?.businessHours ?? []);

  return (
    <>
      <div>
        <p className="mb-2 font-bold text-slate-800">Địa chỉ phòng khám</p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {clinic?.address || "Chưa cập nhật địa chỉ"}
        </p>
      </div>
      <div>
        <p className="mb-2 font-bold text-slate-800">Liên hệ & Hỗ trợ</p>
        <p className="text-[11px] text-slate-500">
          Hotline:{" "}
          <strong className="text-[#0058bc]">
            {clinic?.phone || "Chưa cập nhật"}
          </strong>
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Email: {clinic?.email || "Chưa cập nhật"}
        </p>
      </div>
      <div>
        <p className="mb-2 font-bold text-slate-800">Giờ mở cửa</p>
        {openHours.length ? (
          openHours.map((item) => (
            <p key={item} className="mt-1 text-[11px] text-slate-500">
              {item}
            </p>
          ))
        ) : (
          <p className="text-[11px] text-slate-500">
            Chưa cấu hình lịch làm việc
          </p>
        )}
      </div>
    </>
  );
}
