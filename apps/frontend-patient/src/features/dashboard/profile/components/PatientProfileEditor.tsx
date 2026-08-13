"use client";

import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";

export function PatientProfileEditor() {
  return (
    <Link
      href="/profile/edit"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0863c5]"
    >
      <DashboardIcon name="document" className="h-4 w-4" />
      Chỉnh sửa hồ sơ
    </Link>
  );
}
