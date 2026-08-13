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
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className={`${T.overline} text-[#0863c5]`}>Quyền lợi bệnh nhân</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
            Chi tiết chương trình ưu đãi
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Ưu đãi được áp dụng trực tiếp trong luồng đặt lịch của Smart Dental.
          Khi đến bước xác nhận thông tin, bạn chỉ cần chọn mã phù hợp trong
          mục ưu đãi, hệ thống sẽ tự tính lại chi phí sau giảm.
        </p>

        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Giá trị tối thiểu
            </span>
            <p className="mt-1 text-base font-extrabold text-slate-900">
              {promotion.min_order_amount && promotion.min_order_amount > 0
                ? formatCurrency(promotion.min_order_amount)
                : "Không yêu cầu giá trị tối thiểu"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lượt còn khả dụng
            </span>
            <p className="mt-1 text-base font-extrabold text-slate-900">
              {promotion.max_uses > 0
                ? `${promotion.max_uses - promotion.used_count} lượt`
                : "Không giới hạn lượt dùng"}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className={`${T.overline} text-[#0863c5]`}>Hướng dẫn sử dụng</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
            Các bước kích hoạt ưu đãi
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <InstructionStep
            number="1"
            title="Bắt đầu đặt lịch"
            description="Bấm Đặt lịch dùng mã hoặc vào trang Đặt lịch khám, sau đó chọn người khám, dịch vụ và thời gian phù hợp."
          />
          <InstructionStep
            number="2"
            title="Chọn ưu đãi"
            description={`Ở bước xác nhận, mở mục Ưu đãi áp dụng và chọn mã ${promotion.code} trong danh sách.`}
          />
          <InstructionStep
            number="3"
            title="Xác nhận lịch khám"
            description="Kiểm tra số tiền sau giảm, bác sĩ và khung giờ khám rồi xác nhận đặt lịch."
          />
        </div>
      </section>
    </div>
  );
}

function InstructionStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-sm font-extrabold text-[#0863c5]">
        {number}
      </span>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
