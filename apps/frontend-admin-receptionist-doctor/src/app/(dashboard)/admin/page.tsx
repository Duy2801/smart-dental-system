import { Header } from "@/src/components/layout/header";
import { AppointmentsChart } from "@/src/components/admin/appointments-chart";
import {
  adminStats,
  appointmentsLast7Days,
  recentActivities,
} from "@/src/components/admin/mock-data";
import { PopularServices } from "@/src/components/admin/popular-services";
import { QuickLinks } from "@/src/components/admin/quick-links";
import { RecentActivity } from "@/src/components/admin/recent-activity";
import { ReexamRate } from "@/src/components/admin/reexam-rate";
import { StatCard } from "@/src/components/admin/stat-card";

export default function AdminDashboardPage() {
  return (
    <>
      <Header
        title="Tổng quan quản trị"
        description="Theo dõi hoạt động phòng khám và quản lý hệ thống"
      />

      <div className="space-y-6 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {adminStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              suffix={stat.isCurrency ? "đ" : undefined}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <AppointmentsChart data={appointmentsLast7Days} />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity activities={recentActivities} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PopularServices />
          <ReexamRate />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-dark">
            Truy cập nhanh
          </h3>
          <QuickLinks />
        </div>
      </div>
    </>
  );
}
