import { Header } from "@/src/components/layout/header";
import { SettingsPageContent } from "@/src/components/admin/settings-page-content";

export default function AdminSettingsPage() {
  return (
    <>
      <Header title="Cài đặt hệ thống" description="Giờ làm việc, ngày nghỉ lễ, mẫu thông báo phòng khám" />
      <SettingsPageContent />
    </>
  );
}
