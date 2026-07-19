import type { Metadata } from "next";
import { ServiceDetailExperience } from "@/components/dashboard/service";

type ServiceDetailPageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Chi tiết dịch vụ | Smart Dental",
  description: "Thông tin mô tả, chi phí, quy trình và đặt lịch dịch vụ nha khoa.",
};

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { id } = await params;
  return <ServiceDetailExperience serviceId={id} />;
}
