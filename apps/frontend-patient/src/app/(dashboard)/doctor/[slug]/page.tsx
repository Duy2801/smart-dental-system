import type { Metadata } from "next";
import { DoctorDetailExperience } from "@/features/dashboard/doctor/DoctorDetailExperience";

type DoctorPageProps = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Hồ sơ bác sĩ | Smart Dental",
  description: "Thông tin chuyên môn, bằng cấp và đánh giá của bác sĩ.",
};

export default async function DoctorDetailPage({ params }: DoctorPageProps) {
  const { slug } = await params;
  return <DoctorDetailExperience doctorId={slug} />;
}
