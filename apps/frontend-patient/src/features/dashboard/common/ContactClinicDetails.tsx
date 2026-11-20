"use client";

import Link from "next/link";
import { useClinicConfigQuery } from "../home/hooks/useHomeQueries";
import { getOpenHoursText } from "./DashboardFooterClinicInfo";
import { ROUTES } from "./routes";

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-wider text-[#0863c5]">
        {title}
      </h2>
      <div className="mt-2 space-y-1 text-sm text-slate-700">{children}</div>
    </div>
  );
}

/** Thông tin liên hệ lấy từ cấu hình phòng khám (admin chỉnh trong Cài đặt). */
export function ContactClinicDetails() {
  const { data: clinic, isLoading, isError } = useClinicConfigQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-slate-200/70"
          />
        ))}
      </div>
    );
  }

  if (isError || !clinic) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Chưa tải được thông tin liên hệ. Vui lòng thử lại sau hoặc nhắn tin cho
        chúng tôi qua nút hỗ trợ ở góc màn hình.
      </p>
    );
  }

  const phone = clinic.phone?.trim();
  const email = clinic.email?.trim();
  const openHours = getOpenHoursText(clinic.businessHours ?? []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <InfoCard title="Hotline">
        {phone ? (
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="text-lg font-black text-slate-900 hover:text-[#0863c5]"
          >
            {phone}
          </a>
        ) : (
          <p>Chưa cập nhật</p>
        )}
      </InfoCard>
      <InfoCard title="Email">
        {email ? (
          <a
            href={`mailto:${email}`}
            className="break-all font-semibold hover:text-[#0863c5]"
          >
            {email}
          </a>
        ) : (
          <p>Chưa cập nhật</p>
        )}
      </InfoCard>
      <InfoCard title="Địa chỉ phòng khám">
        <p>{clinic.address || "Chưa cập nhật địa chỉ"}</p>
      </InfoCard>
      <InfoCard title="Giờ mở cửa">
        {openHours.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </InfoCard>
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:col-span-2">
        <p className="text-sm text-slate-700">
          Cần hỗ trợ nhanh? Bấm nút <strong>hỗ trợ</strong> ở góc dưới màn
          hình để nhắn tin trực tiếp với lễ tân, hoặc{" "}
          <Link
            href={ROUTES.appointment}
            className="font-bold text-[#0863c5] hover:underline"
          >
            đặt lịch khám
          </Link>{" "}
          ngay.
        </p>
      </div>
    </div>
  );
}
