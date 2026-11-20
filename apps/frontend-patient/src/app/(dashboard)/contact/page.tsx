import type { Metadata } from "next";
import { ContactClinicDetails } from "@/features/dashboard/common/ContactClinicDetails";

export const metadata: Metadata = {
  title: "Liên hệ & Hỗ trợ",
  description:
    "Hotline, email, địa chỉ và giờ mở cửa của phòng khám nha khoa Smart Dental.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
        Liên hệ &amp; Hỗ trợ
      </h1>
      <p className="mt-2 mb-6 text-sm text-slate-500">
        Phòng khám luôn sẵn sàng giải đáp thắc mắc về lịch hẹn, thanh toán và
        dịch vụ nha khoa.
      </p>
      <ContactClinicDetails />
    </main>
  );
}
