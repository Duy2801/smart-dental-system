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
  const invoiceCode = `HD-DT-${step.id.slice(0, 8).toUpperCase()}`;
  const amount = step.paidAmount || (stepIndex === 0 ? 1500000 : 5000000);
  const isPaid = step.status === "completed" || step.paidAmount > 0;
  const formattedAmount = new Intl.NumberFormat("vi-VN").format(amount);

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col overflow-hidden relative text-slate-800 my-4 animate-in slide-in-from-top-4 duration-300">
      {/* ========================================================================= */}
      {/* 1. HEADER: INLINE ENTERPRISE BRANDING */}
      {/* ========================================================================= */}
      <div className="px-6 py-5 bg-gradient-to-r from-[#1996e0] via-[#1485c7] to-cyan-600 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-xl shadow-inner text-white">
            🦷
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full">
                SMART DENTAL CLINIC
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-100">
                {invoiceCode}
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
              Hóa Đơn Tài Chính Dịch Vụ Nha Khoa
            </h3>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center gap-1.5 transition-all text-xs font-bold shrink-0 cursor-pointer border border-white/30 shadow-xs"
            title="Thu gọn bảng hóa đơn"
          >
            <span>Thu gọn</span>
            <span>▲</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT (NATURAL FLOW, NO INNER SCROLLBAR) */}
      {/* ========================================================================= */}
      <div className="p-6 space-y-6 text-xs bg-slate-50/50">

        {/* Box 1: Thông tin phòng khám & Bệnh nhân */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[10px] font-extrabold text-[#1996e0] uppercase tracking-wider block">
                Đơn Vị Phát Hành Hóa Đơn
              </span>
              <h4 className="text-sm font-black text-slate-900">
                Hệ Thống Nha Khoa Thông Minh Smart Dental System
              </h4>
              <p className="text-[11px] text-slate-500">
                Địa chỉ: 123 Đường 3/2, Quận 10, TP. Hồ Chí Minh • Hotline: 1900 6868
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-medium block">Ngày chứng từ:</span>
              <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                📅 {step.date}
              </span>
            </div>
          </div>

          {/* Thông tin Bệnh nhân & Phác đồ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Bệnh Nhân & Phác Đồ Điều Trị
              </span>
              <p className="text-xs font-bold text-slate-900">
                📋 {treatment.title}
              </p>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Phác đồ: <strong className="text-slate-700">{treatment.title}</strong>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Bác Sĩ Phụ Trách Dịch Vụ
              </span>
              <p className="text-xs font-bold text-slate-900">
                👨‍⚕️ {treatment.doctor}
              </p>
              <p className="text-[11px] text-slate-500">
                Chuyên khoa: Nha Khoa Tổng Quát & Chỉnh Hình
              </p>
            </div>
          </div>
        </div>

        {/* Box 2: Bảng chi tiết danh mục phí */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-100/90 border-b border-slate-200 text-slate-900 flex items-center justify-between">
            <h4 className="font-extrabold text-xs tracking-wide uppercase flex items-center gap-2 text-slate-800">
              <span>📑</span>
              <span>Chi Tiết Danh Mục Dịch Vụ & Vật Tư Y Tế</span>
            </h4>
            <span className="text-[10px] font-mono font-bold text-[#1996e0] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Bước {stepIndex + 1}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3">STT</th>
                  <th className="p-3">Nội Dung / Thủ Thuật Thực Hiện</th>
                  <th className="p-3 text-center">SL</th>
                  <th className="p-3 text-right">Đơn Giá</th>
                  <th className="p-3 text-right">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                {/* Line 1: Thủ thuật chính */}
                <tr className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-3 font-bold text-slate-400">01</td>
                  <td className="p-3 font-medium">
                    <strong className="text-slate-900 text-xs block">{step.title}</strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {step.description || "Thực hiện đúng quy trình chuẩn Y Khoa Nha Khoa."}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-center text-slate-600">01</td>
                  <td className="p-3 font-mono font-semibold text-right text-slate-600">
                    {formattedAmount}đ
                  </td>
                  <td className="p-3 font-mono font-extrabold text-right text-slate-900">
                    {formattedAmount}đ
                  </td>
                </tr>

                {/* Line 2: Vật tư y tế */}
                <tr className="hover:bg-blue-50/30 transition-colors bg-slate-50/40">
                  <td className="p-3 font-bold text-slate-400">02</td>
                  <td className="p-3 font-medium">
                    <strong className="text-slate-700 text-xs block">
                      Vật Tư Y Tế & Bộ Khí Cụ Vô Trùng Chuyên Dụng
                    </strong>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Bao gồm khay khám, găng tay, kim tiêm & chất hàn sinh học
                    </span>
                  </td>
                  <td className="p-3 font-bold text-center text-slate-600">01 gói</td>
                  <td className="p-3 font-mono font-semibold text-right text-slate-400">
                    Miễn phí
                  </td>
                  <td className="p-3 font-mono font-extrabold text-right text-emerald-600">
                    0đ
                  </td>
                </tr>

                {/* Line 3: Kiểm tra định kỳ */}
                <tr className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-3 font-bold text-slate-400">03</td>
                  <td className="p-3 font-medium">
                    <strong className="text-slate-700 text-xs block">
                      Tái Khám & Kiểm Tra Tiến Độ Phác Đồ
                    </strong>
                  </td>
                  <td className="p-3 font-bold text-center text-slate-600">01 buổi</td>
                  <td className="p-3 font-mono font-semibold text-right text-slate-400">
                    Đã bao gồm
                  </td>
                  <td className="p-3 font-mono font-extrabold text-right text-emerald-600">
                    0đ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Box 3: Thống kê tổng tiền & Trạng thái thanh toán */}
        <div className="bg-gradient-to-br from-[#1996e0] via-blue-700 to-indigo-900 text-white rounded-2xl p-5 shadow-lg border border-blue-600/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-200 block">
                Tổng Chi Phí Thanh Toán Thủ Thuật
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight drop-shadow-xs">
                  {formattedAmount}
                </span>
                <span className="text-sm font-bold text-cyan-200">VNĐ</span>
              </div>
            </div>

            {/* Status Chip */}
            <div className="shrink-0">
              {isPaid ? (
                <div className="bg-white/15 border border-white/30 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xs backdrop-blur-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold block text-cyan-100">
                      Trạng Thái Thanh Toán
                    </span>
                    <strong className="text-xs font-black text-white">
                      ✓ Đã Thanh Toán 100%
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/30 border border-amber-300/50 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xs backdrop-blur-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold block text-amber-200">
                      Trạng Thái Thanh Toán
                    </span>
                    <strong className="text-xs font-black text-amber-100">
                      ⏳ Chưa Thanh Toán
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notice Footer inside box */}
          <div className="pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-cyan-100">
            <span>🔒 Hóa đơn điện tử được xác thực bởi Smart Dental System</span>
            <span className="font-mono font-bold text-white">Mã tra cứu: {invoiceCode}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FOOTER MODAL: ACTION BUTTONS */}
      {/* ========================================================================= */}
      <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-300 shadow-xs"
          >
            <span>📥</span>
            <span>In / Tải Hóa Đơn (PDF)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 bg-[#1996e0] hover:bg-blue-600 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer border border-blue-500"
        >
          Thu Gọn Hóa Đơn
        </button>
      </div>
    </div>
  );
}
