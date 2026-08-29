"use client";

import { useClinicConfigQuery } from "../home/hooks/useHomeQueries";
import type { getLiveClinicConfigInfo } from "../home/api";

function getOpenHoursText(
  hours: NonNullable<Awaited<ReturnType<typeof getLiveClinicConfigInfo>>["businessHours"]>,
): string[] {
  const openDays = hours.filter((day) => day.isOpen);
  if (!openDays.length) return ["Chưa cấu hình lịch làm việc"];

  const firstTime = `${openDays[0].start} - ${openDays[0].end}`;
  const allSameTime = openDays.every(
    (day) => `${day.start} - ${day.end}` === firstTime
  );

  if (allSameTime && openDays.length > 1) {
    const firstDayLabel = openDays[0].label;
    const lastDayLabel = openDays[openDays.length - 1].label;
    if (openDays.length === 7) {
      return [`Thứ 2 - Chủ Nhật: ${firstTime}`];
    }
    return [`${firstDayLabel} - ${lastDayLabel}: ${firstTime}`];
  }

  const result: string[] = [];
  let currentGroup: typeof openDays = [];

  for (let i = 0; i < openDays.length; i++) {
    const day = openDays[i];
    if (currentGroup.length === 0) {
      currentGroup.push(day);
    } else {
      const prev = currentGroup[currentGroup.length - 1];
      if (prev.start === day.start && prev.end === day.end) {
        currentGroup.push(day);
      } else {
        const timeStr = `${currentGroup[0].start} - ${currentGroup[0].end}`;
        if (currentGroup.length === 1) {
          result.push(`${currentGroup[0].label}: ${timeStr}`);
        } else {
          result.push(
            `${currentGroup[0].label} - ${currentGroup[currentGroup.length - 1].label}: ${timeStr}`
          );
        }
        currentGroup = [day];
      }
    }
  }

  if (currentGroup.length > 0) {
    const timeStr = `${currentGroup[0].start} - ${currentGroup[0].end}`;
    if (currentGroup.length === 1) {
      result.push(`${currentGroup[0].label}: ${timeStr}`);
    } else {
      result.push(
        `${currentGroup[0].label} - ${currentGroup[currentGroup.length - 1].label}: ${timeStr}`
      );
    }
  }

  return result;
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
      <div className="space-y-1">
        <p className="font-bold text-slate-800 text-xs">Địa chỉ phòng khám</p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {clinic?.address || "Chưa cập nhật địa chỉ"}
        </p>
      </div>
      <div className="space-y-1">
        <p className="font-bold text-slate-800 text-xs">Liên hệ & Hỗ trợ</p>
        <p className="text-[11px] text-slate-500">
          Hotline:{" "}
          <strong className="text-[#0058bc]">
            {clinic?.phone || "Chưa cập nhật"}
          </strong>
        </p>
        <p className="text-[11px] text-slate-500">
          Email: {clinic?.email || "Chưa cập nhật"}
        </p>
      </div>
      <div className="space-y-1">
        <p className="font-bold text-slate-800 text-xs">Giờ mở cửa</p>
        {openHours.length ? (
          openHours.map((item) => (
            <p key={item} className="text-[11px] text-slate-500">
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
