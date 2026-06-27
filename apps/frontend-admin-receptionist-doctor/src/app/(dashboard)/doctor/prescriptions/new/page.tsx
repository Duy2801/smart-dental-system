"use client";

import React, { useState } from "react";
import Link from "next/link";

// Inline SVGs
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

const PrinterIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
);

export default function NewPrescriptionPage() {
  // State quản lý danh sách thuốc được thêm vào đơn
  const [medications, setMedications] = useState([
    { id: 1, name: "", quantity: "", dosage: "", instructions: "" }
  ]);

  const addMedication = () => {
    setMedications([...medications, { id: Date.now(), name: "", quantity: "", dosage: "", instructions: "" }]);
  };

  const removeMedication = (id: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter(m => m.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Breadcrumb & Header */}
        <div className="mb-6 space-y-4">
          <Link href="/doctor/prescriptions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeftIcon /> Quay lại danh sách
          </Link>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-dark">Kê đơn thuốc mới</h1>
              <p className="mt-1 text-sm text-muted-foreground">Tạo và xuất đơn thuốc điện tử cho bệnh nhân.</p>
            </div>
            <div className="flex gap-3">
              <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-slate-50">
                Lưu nháp
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark">
                <PrinterIcon className="h-4 w-4" /> Lưu & Xuất PDF
              </button>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="space-y-6">
          
          {/* Thông tin bệnh nhân & Chẩn đoán */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">1. Thông tin chẩn đoán</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-dark">Bệnh nhân <span className="text-red-500">*</span></label>
                <select className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">-- Chọn bệnh nhân --</option>
                  <option value="1">Lê Hoàng C - 0987654321</option>
                  <option value="2">Nguyễn Văn A - 0901234567</option>
                  <option value="3">Phạm Thị D - 0911223344</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-dark">Ngày kê đơn</label>
                <input type="date" defaultValue="2026-06-27" className="w-full rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-muted-foreground outline-none" readOnly />
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-brand-dark">Chẩn đoán lâm sàng <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ví dụ: Viêm tủy răng 38..." className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>
            </div>
          </div>

          {/* Danh sách thuốc */}
          <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-slate-50/30 px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">2. Danh sách thuốc</h2>
            </div>
            
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="pb-3 pr-4 font-medium uppercase">Tên thuốc <span className="text-red-500">*</span></th>
                    <th className="pb-3 pr-4 font-medium uppercase w-28">Số lượng</th>
                    <th className="pb-3 pr-4 font-medium uppercase w-36">Liều lượng</th>
                    <th className="pb-3 pr-4 font-medium uppercase">Cách dùng</th>
                    <th className="pb-3 font-medium uppercase w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {medications.map((med) => (
                    <tr key={med.id}>
                      <td className="py-3 pr-4">
                        <input type="text" placeholder="Ví dụ: Paracetamol 500mg" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand" />
                      </td>
                      <td className="py-3 pr-4">
                        <input type="text" placeholder="10 viên" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand" />
                      </td>
                      <td className="py-3 pr-4">
                        <input type="text" placeholder="Sáng 1, Tối 1" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand" />
                      </td>
                      <td className="py-3 pr-4">
                        <input type="text" placeholder="Uống sau khi ăn no" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand" />
                      </td>
                      <td className="py-3 text-center">
                        <button 
                          onClick={() => removeMedication(med.id)}
                          disabled={medications.length === 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-colors"
                          title="Xóa thuốc này"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-4 border-t border-border/50 pt-4">
                <button 
                  onClick={addMedication}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
                >
                  <PlusIcon className="h-4 w-4" /> Thêm thuốc
                </button>
              </div>
            </div>
          </div>

          {/* Lời dặn */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">3. Lời dặn của bác sĩ</h2>
            <textarea 
              rows={4}
              placeholder="Nhập lời dặn dò bệnh nhân (ví dụ: kiêng cữ đồ lạnh, lịch tái khám sau 3 ngày, v.v.)..."
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand resize-y"
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}
