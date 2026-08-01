"use client";

import { useQuery } from "@tanstack/react-query";
import { getLiveClinicConfigInfo } from "../home/api";

function getOpenHoursText(
  hours: NonNullable<Awaited<ReturnType<typeof getLiveClinicConfigInfo>>["businessHours"]>,
) {
  return hours
    .filter((day) => day.isOpen)
    .slice(0, 3)
    .map((day) => `${day.label}: ${day.start} - ${day.end}`);
}

export function DashboardFooterClinicInfo() {
  const { data: clinic, isLoading } = useQuery({
    queryKey: ["patient", "clinic-config"],
    queryFn: getLiveClinicConfigInfo,
  });

  if (isLoading) {
    return (
      <>
        <div>
          <p className="mb-2 font-bold text-slate-800">Địa chỉ phòng khám</p>
          <p className="text-[11px] text-slate-500">Đang tải...</p>
        </div>
        <div>
          <p className="mb-2 font-bold text-slate-800">Liên hệ & Hỗ trợ</p>
          <p className="text-[11px] text-slate-500">Đang tải...</p>
        </div>
        <div>
          <p className="mb-2 font-bold text-slate-800">Giờ mở cửa</p>
          <p className="text-[11px] text-slate-500">Đang tải...</p>
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
