import { Metadata } from "next";
import { PromotionWorkspace } from "@/features/dashboard/promotion";

export const metadata: Metadata = {
  title: "Ưu Đãi & Khuyến Mãi Nha Khoa | Smart Dental",
  description: "Tổng hợp các chương trình ưu đãi, mã giảm giá và voucher chăm sóc răng miệng hấp dẫn tại Smart Dental.",
};

export default function PromotionsPage() {
  return <PromotionWorkspace />;
}
