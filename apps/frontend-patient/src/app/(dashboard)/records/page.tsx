import type { Metadata } from "next";
import { PatientRecordsPageClient } from "@/components/dashboard/records";

export const metadata: Metadata = {
  title: "Hồ sơ bệnh án điện tử | Smart Dental",
  description: "Lịch sử điều trị và hồ sơ sức khỏe nha khoa của bệnh nhân.",
};

export default function PatientRecordsPage() {
  return <PatientRecordsPageClient />;
}
