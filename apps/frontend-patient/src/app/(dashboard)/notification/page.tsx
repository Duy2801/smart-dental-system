import type { Metadata } from "next";
import { NotificationWorkspace } from "@/features/dashboard/notification/components/NotificationWorkspace";

export const metadata: Metadata = {
  title: "Thông Báo | Smart Dental System",
  description: "Trung tâm quản lý thông báo lịch hẹn, thanh toán và khuyến mãi dành cho bệnh nhân.",
};

export default function NotificationPage() {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <NotificationWorkspace />
    </main>
  );
}
