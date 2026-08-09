"use client";

import { T } from "@/features/dashboard/common/typography";
import { formatCurrency } from "@/utils/helpers";
import type { PromotionDto } from "../types";

interface PromotionInstructionsProps {
  promotion: PromotionDto;
}

export function PromotionInstructions({ promotion }: PromotionInstructionsProps) {
  return (
    <div className="space-y-7">
      {/* Overview & Program Highlights */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-4">
        <div>
          <p className={`${T.overline} text-[#0058bc]`}>Quyền lợi bệnh nhân</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
            Chi tiết chương trình ưu đãi
          </h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Chương trình được áp dụng cho tất cả bệnh nhân đăng ký dịch vụ trực tuyến thông qua cổng Smart Dental. Mã ưu đãi giúp tối ưu chi phí điều trị mà vẫn đảm bảo tiêu chuẩn chăm sóc nha khoa chất lượng cao.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Đơn hàng tối thiểu
            </span>
            <p className="mt-1 text-base font-extrabold text-slate-900">
              {promotion.min_order_amount && promotion.min_order_amount > 0
                ? formatCurrency(promotion.min_order_amount)
                : "Không giới hạn giá trị đơn"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Số lượt phát hành
            </span>
            <p className="mt-1 text-base font-extrabold text-slate-900">
              {promotion.max_uses > 0
                ? `${promotion.max_uses - promotion.used_count} lượt khả dụng`
                : "Không giới hạn số lượt"}
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step How To Apply Instructions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <div>
          <p className={`${T.overline} text-[#0058bc]`}>Hướng dẫn sử dụng</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
            Các bước kích hoạt ưu đãi
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-sm font-extrabold text-[#0058bc]">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-900">Sao chép mã ưu đãi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhấn nút Sao chép mã <strong>{promotion.code}</strong> để lưu vào bộ nhớ tạm.
            </p>
          </div>

          <div className="space-y-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-sm font-extrabold text-[#0058bc]">
              2
            </span>
            <h3 className="text-sm font-bold text-slate-900">Chọn dịch vụ & thời gian</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chọn dịch vụ nha khoa bạn muốn điều trị và chọn khung giờ khám phù hợp.
            </p>
          </div>

          <div className="space-y-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-sm font-extrabold text-[#0058bc]">
              3
            </span>
            <h3 className="text-sm font-bold text-slate-900">Xác nhận lịch khám</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mã ưu đãi sẽ tự động áp dụng và tính chi phí giảm trừ khi hoàn tất đặt lịch.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
