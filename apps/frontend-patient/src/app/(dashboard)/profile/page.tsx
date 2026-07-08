"use client";

import { useState } from "react";
import { DashboardIcon } from "@/components/dashboard/common/DashboardIcon";

const healthItems = [
  { label: "Nhóm máu", value: "O+" },
  { label: "Dị ứng", value: "Chưa ghi nhận" },
  { label: "Lần khám gần nhất", value: "12/06/2026" },
];

export default function ProfilePage() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#0863c5] to-cyan-500 px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/15 text-xl font-extrabold backdrop-blur">
                AN
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-100">Hồ sơ bệnh nhân</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em]">An Nguyễn</h1>
                <p className="mt-1 text-sm text-blue-100">Mã bệnh nhân: SDS-260724</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMessage("Thông tin hồ sơ đã được lưu tạm thời.")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#0863c5] shadow-sm transition hover:bg-blue-50"
            >
              <DashboardIcon name="document" className="h-4 w-4" />
              Cập nhật hồ sơ
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px] lg:p-8">
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Thông tin cá nhân</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Số điện thoại", "090 123 4567"],
                  ["Email", "annguyen@example.com"],
                  ["Ngày sinh", "18/09/1998"],
                  ["Địa chỉ", "Quận 1, TP.HCM"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {message && (
              <div role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
                {message}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <DashboardIcon name="heart" className="h-4 w-4 text-[#0863c5]" />
              Tóm tắt sức khỏe
            </h2>
            <div className="mt-4 space-y-3">
              {healthItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 text-sm">
                  <span className="text-slate-500">{item.label}</span>
                  <strong className="text-right text-slate-900">{item.value}</strong>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
