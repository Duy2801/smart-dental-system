import { Suspense } from "react";
import { Metadata } from "next";
import { PromotionWorkspace } from "@/features/dashboard/promotion";

export const metadata: Metadata = {
  title: "Ưu Đãi & Khuyến Mãi Nha Khoa | Smart Dental",
  description: "Tổng hợp các chương trình ưu đãi, mã giảm giá và voucher chăm sóc răng miệng hấp dẫn tại Smart Dental.",
};

export default function PromotionsPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-sm font-semibold text-slate-500">Đang tải ưu đãi...</div>}>
      <PromotionWorkspace />
    </Suspense>
  );
}
