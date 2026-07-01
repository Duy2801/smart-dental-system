import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import { AppointmentsChart } from "@/src/components/admin/appointments-chart";
import { appointmentsLast7Days } from "@/src/components/admin/mock-data";
import { PopularServices } from "@/src/components/admin/popular-services";
import { ReexamRate } from "@/src/components/admin/reexam-rate";

// --- Mock Data chuẩn db.md ---
const todayStats = [
  { label: "Doanh thu hôm nay", value: "18.500.000", suffix: "đ", trend: 15, trendLabel: "so với hôm qua", isStar: false },
  { label: "Lịch khám hôm nay", value: "28", suffix: "ca", trend: -2, trendLabel: "so với hôm qua", isStar: false },
  { label: "Bệnh nhân mới", value: "5", suffix: "người", trend: 10, trendLabel: "so với hôm qua", isStar: false },
  { label: "Đánh giá trung bình", value: "4.8", suffix: "★", trend: 1, trendLabel: "so với hôm qua", isStar: true },
];

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
const statusConfig: Record<AppointmentStatus, { label: string, color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700 border-blue-200" },
  COMPLETED: { label: "Đã hoàn thành", color: "bg-green-100 text-green-700 border-green-200" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700 border-red-200" },
  NO_SHOW: { label: "Không đến", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const todayAppointments = [
  { id: "1", start_time: "09:00", end_time: "09:45", patient_name: "Nguyễn Văn A", service_name: "Trám răng thẩm mỹ", doctor_name: "BS. Trần Minh", status: "COMPLETED" as AppointmentStatus },
  { id: "2", start_time: "10:00", end_time: "11:00", patient_name: "Trần Thị B", service_name: "Nhổ răng khôn", doctor_name: "BS. Lê Hoa", status: "CONFIRMED" as AppointmentStatus },
  { id: "3", start_time: "13:30", end_time: "14:15", patient_name: "Phạm Dũng", service_name: "Niềng răng (Tái khám)", doctor_name: "BS. Nguyễn Yến", status: "CONFIRMED" as AppointmentStatus },
];

const actionItems = [
  { id: "a1", type: "appointment", title: "Lịch hẹn Online mới", desc: "Bệnh nhân Lê Cường đặt qua App (PENDING).", time: "10 phút trước", action: "Xác nhận" },
  { id: "a2", type: "invoice", title: "Hóa đơn chưa thu", desc: "Hóa đơn HD260603 trị giá 2.500.000đ (UNPAID).", time: "2 giờ trước", action: "Thu tiền" },
];

export default function AdminDashboardPage() {
  const currentDate = new Date().toLocaleDateString("vi-VN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <Header title="Tổng quan Quản lý" description={currentDate}>
        <button type="button" className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98] shadow-sm ml-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Đặt lịch hẹn mới
        </button>
      </Header>

      <div className="space-y-6 p-6 md:p-8">
        
        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {todayStats.map((stat, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <p className="font-mono text-3xl font-bold text-brand-dark">{stat.value}</p>
                <span className={cn("text-base font-semibold", stat.isStar ? "text-yellow-500" : "text-muted-foreground")}>{stat.suffix}</span>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <span className={cn("flex items-center font-medium px-1.5 py-0.5 rounded-full bg-opacity-10", stat.trend >= 0 ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100")}>
                  {stat.trend >= 0 ? "+" : "-"}{Math.abs(stat.trend)}%
                </span>
                <span className="ml-2 text-muted-foreground">{stat.trendLabel}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Actions Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Biểu đồ lịch khám - Yêu cầu chức năng */}
          <div className="lg:col-span-2">
            <AppointmentsChart data={appointmentsLast7Days} />
          </div>

          {/* Action Items */}
          <div className="rounded-2xl border border-border bg-white shadow-sm flex flex-col h-full max-h-[400px]">
            <div className="border-b border-border p-5 shrink-0">
              <h3 className="text-base font-semibold text-brand-dark flex items-center gap-2">
                Cần xử lý gấp
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">2</span>
              </h3>
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
              <div className="divide-y divide-border">
                {actionItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-muted/10 transition-colors rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-semibold text-brand-dark line-clamp-1">{item.title}</h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{item.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="mt-1 flex justify-end">
                      <button type="button" className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors">
                        {item.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê chuyên sâu - Yêu cầu chức năng */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PopularServices />
          <ReexamRate />
        </div>

        {/* Lịch trình hôm nay (Timeline) */}
        <div className="rounded-2xl border border-border bg-white shadow-sm flex flex-col">
          <div className="border-b border-border p-5 flex items-center justify-between">
            <h3 className="text-base font-semibold text-brand-dark">Lịch trình hôm nay</h3>
            <a href="/admin/schedules" className="text-sm font-medium text-brand hover:underline">Tất cả lịch</a>
          </div>
          
          <div className="p-5 flex-1">
            <div className="relative border-l-2 border-muted/50 ml-3 md:ml-4 space-y-6 pb-2">
              {todayAppointments.map((item) => (
                <div key={item.id} className="relative pl-6 sm:pl-8 group">
                  <span className="absolute -left-[5px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-brand ring-4 ring-white" />
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 rounded-xl border border-transparent hover:border-border hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-sm font-bold text-brand">
                        {item.start_time} - {item.end_time}
                      </span>
                      <span className="text-base font-semibold text-brand-dark">{item.patient_name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{item.service_name}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-sm text-brand">{item.doctor_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border", statusConfig[item.status].color)}>
                        {statusConfig[item.status].label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
