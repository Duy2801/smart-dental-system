import type { Metadata } from "next";
import { PromotionDetailExperience } from "@/features/dashboard/promotion";

type PromotionDetailPageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Chi tiết ưu đãi nha khoa | Smart Dental",
  description: "Thông tin mô tả, điều kiện áp dụng và dịch vụ khuyến mãi tại Smart Dental.",
};

export default async function PromotionDetailPage({
  params,
}: PromotionDetailPageProps) {
  const { id } = await params;
  return <PromotionDetailExperience promotionId={id} />;
}
