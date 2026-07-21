"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/src/components/layout/header";
import { MagnifyingGlass, ArrowRight, Users } from "@phosphor-icons/react";

const MOCK_PATIENTS = [
  {
    id: "pt-001",
    patientCode: "BN-2001",
    fullName: "Nguyễn Văn A",
    phone: "0901234567",
    lastVisitDate: "20/07/2026",
    lastService: "Khám tổng quát",
    totalVisits: 5,
    gender: "Nam",
    age: 34,
  },
  {
    id: "pt-002",
    patientCode: "BN-2002",
    fullName: "Trần Thị B",
    phone: "0911223344",
    lastVisitDate: "21/07/2026",
    lastService: "Nhổ răng khôn",
    totalVisits: 3,
    gender: "Nữ",
    age: 29,
  },
  {
    id: "pt-003",
    patientCode: "BN-2003",
    fullName: "Phạm Dũng",
    phone: "0977001122",
    lastVisitDate: "21/07/2026",
    lastService: "Tái khám niềng răng",
    totalVisits: 12,
    gender: "Nam",
    age: 22,
  },
  {
    id: "pt-004",
    patientCode: "BN-2004",
    fullName: "Hoàng Thị Oanh",
    phone: "0933445566",
    lastVisitDate: "18/07/2026",
    lastService: "Cấy ghép Implant",
    totalVisits: 7,
    gender: "Nữ",
    age: 45,
  },
  {
    id: "pt-005",
    patientCode: "BN-2005",
    fullName: "Lê Minh Cường",
    phone: "0944556677",
    lastVisitDate: "15/07/2026",
    lastService: "Tẩy trắng răng",
    totalVisits: 2,
    gender: "Nam",
    age: 31,
  },
  {
    id: "pt-006",
    patientCode: "BN-2006",
    fullName: "Đỗ Thu Hà",
    phone: "0977889900",
    lastVisitDate: "10/07/2026",
    lastService: "Tái khám niềng răng (Kỳ 6)",
    totalVisits: 18,
    gender: "Nữ",
    age: 26,
  },
];

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_PATIENTS.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.patientCode.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search),
  );

  return (
    <>
      <Header
        title="Bệnh nhân của tôi"
        description="Danh sách bệnh nhân đã từng khám với bạn"
      />

      <div className="p-6 md:p-8">
        {/* Search */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Tìm theo tên, mã BN, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {filtered.length} bệnh nhân
          </span>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Mã BN</th>
                  <th className="px-5 py-3.5">Họ tên</th>
                  <th className="px-5 py-3.5">Giới / Tuổi</th>
                  <th className="px-5 py-3.5">Lần khám gần nhất</th>
                  <th className="px-5 py-3.5">Dịch vụ gần nhất</th>
                  <th className="px-5 py-3.5 text-center">Số lần khám</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Users
                          size={40}
                          className="text-slate-300"
                          weight="duotone"
                        />
                        <p className="text-sm">
                          Không tìm thấy bệnh nhân nào
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((pt) => (
                    <tr
                      key={pt.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                          {pt.patientCode}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {pt.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pt.phone}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {pt.gender}, {pt.age}T
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {pt.lastVisitDate}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {pt.lastService}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                          {pt.totalVisits}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/doctor/patients/${pt.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
                        >
                          Xem hồ sơ
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
