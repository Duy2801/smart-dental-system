"use client";

import { useEffect } from "react";
import type { TimelineStepView, TreatmentRecordView } from "./recordMappers";

interface StepInvoiceModalProps {
  treatment: TreatmentRecordView;
  step: TimelineStepView;
  stepIndex: number;
  onClose: () => void;
}

export function StepInvoiceModal({
  treatment,
  step,
  stepIndex,
  onClose,
}: StepInvoiceModalProps) {
  // Lock document scroll on opening
  useEffect(() => {
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, []);

  const invoiceCode = `HD-DT-${step.id.slice(0, 8).toUpperCase()}`;
  const amount = step.paidAmount || (stepIndex === 0 ? 1500000 : 5000000);
  const isPaid = step.status === "completed" || step.paidAmount > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* Header Cố Định */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Hóa Đơn Thanh Toán Điều Trị
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-1">
              Hóa đơn dịch vụ - {step.title}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Mã hóa đơn: <strong className="text-slate-700">{invoiceCode}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center transition-colors text-sm shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Nội dung Hóa đơn */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Thông tin đơn vị & Bác sĩ */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between border-b pb-2 border-slate-200/60">
              <span className="font-bold text-slate-800">Nha Khoa Smart Dental System</span>
              <span className="text-[11px] text-slate-500">{step.date}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
              <div>
                <span className="text-slate-400 text-[10px] block">Quy trình phác đồ:</span>
                <strong className="text-slate-800">{treatment.title}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Bác sĩ phụ trách:</span>
                <strong className="text-slate-800">{treatment.doctor}</strong>
              </div>
            </div>
          </div>

          {/* Chi tiết khoản phí */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span>🧾</span> Chi tiết danh mục dịch vụ điều trị:
            </h4>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[11px]">
                    <th className="p-3 font-bold">Nội dung / Thủ thuật</th>
                    <th className="p-3 font-bold text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="p-3 font-medium">
                      {step.title}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {step.description}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-right">
                      {new Intl.NumberFormat("vi-VN").format(amount)}đ
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-500">
                      Vật tư y tế & Khí cụ nha khoa chuyên dụng
                    </td>
                    <td className="p-3 font-mono font-semibold text-right text-emerald-600">
                      Miễn phí
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tổng tiền & Trạng thái */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-900 font-semibold block">Tổng tiền hóa đơn:</span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono">
                {new Intl.NumberFormat("vi-VN").format(amount)}đ
              </span>
            </div>

            <span
              className={`px-3 py-1 rounded-full font-bold text-xs ${
                isPaid
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              {isPaid ? "✓ Đã Thanh Toán 100%" : "⏳ Chưa Thanh Toán"}
            </span>
          </div>
        </div>

        {/* Footer Cố Định */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 backdrop-blur-xs flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => alert(`Đã tải hóa đơn PDF [${invoiceCode}] về máy!`)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <span>📥</span> Tải Hóa Đơn (PDF)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
