import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import Link from "next/link";

// --- Mock Data chuẩn db.md ---
const todayStats = [
  { label: "Tổng ca khám hôm nay", value: "8", suffix: "ca" },
  { label: "Bệnh nhân đang chờ", value: "3", suffix: "người" },
  { label: "Ca đã hoàn thành", value: "2", suffix: "ca" },
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
  { id: "1", start_time: "08:00", end_time: "09:00", patient_id: "P001", patient_name: "Nguyễn Văn A", service_name: "Khám tổng quát", status: "COMPLETED" as AppointmentStatus },
  { id: "2", start_time: "09:30", end_time: "10:30", patient_id: "P002", patient_name: "Trần Thị B", service_name: "Nhổ răng khôn", status: "COMPLETED" as AppointmentStatus },
  { id: "3", start_time: "11:00", end_time: "12:00", patient_id: "P003", patient_name: "Phạm Dũng", service_name: "Tái khám niềng răng", status: "CONFIRMED" as AppointmentStatus },
  { id: "4", start_time: "14:00", end_time: "15:00", patient_id: "P004", patient_name: "Hoàng Oanh", service_name: "Cấy ghép Implant", status: "CONFIRMED" as AppointmentStatus },
  { id: "5", start_time: "15:30", end_time: "16:30", patient_id: "P005", patient_name: "Lê Cường", service_name: "Tẩy trắng răng", status: "PENDING" as AppointmentStatus },
];

const clinicalActions = [
  { id: "c1", type: "medical_record", title: "Hồ sơ chưa hoàn thiện", desc: "Bệnh nhân Nguyễn Văn A (Ca 08:00) chưa có ghi chú bệnh án.", action: "Viết bệnh án", link: "/doctor/treatments/new" },
  { id: "c2", type: "prescription", title: "Đơn thuốc chưa kê", desc: "Bệnh nhân Trần Thị B (Nhổ răng khôn) cần kê đơn thuốc giảm đau.", action: "Kê đơn", link: "/doctor/prescriptions" },
  { id: "c3", type: "treatment_plan", title: "Cập nhật tiến độ", desc: "Kế hoạch điều trị của Phạm Dũng (Niềng răng) cần cập nhật ngày tái khám.", action: "Cập nhật", link: "/doctor/treatment-plans" },
];

export default function DoctorDashboardPage() {
  const currentDate = new Date().toLocaleDateString("vi-VN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <Header
        title="Chào BS. Trần Minh,"
        description={currentDate}
      />

      <div className="space-y-6 p-6 md:p-8">
        
        {/* Top Stat Cards (Chuyên môn) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {todayStats.map((stat, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <p className="font-mono text-3xl font-bold text-brand-dark">{stat.value}</p>
                <span className="text-base font-semibold text-muted-foreground">{stat.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Cột trái: Lịch làm việc hôm nay (2/3) */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-sm flex flex-col">
            <div className="border-b border-border p-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-brand-dark">Lịch làm việc hôm nay</h3>
              <Link href="/doctor/schedule" className="text-sm font-medium text-brand hover:underline">Xem lịch tuần</Link>
            </div>
            
            <div className="p-5 flex-1">
              <div className="relative border-l-2 border-muted/50 ml-3 md:ml-4 space-y-6 pb-2">
                {todayAppointments.map((item) => (
                  <div key={item.id} className="relative pl-6 sm:pl-8 group">
                    <span className="absolute -left-[5px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-brand ring-4 ring-white" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-border/50 bg-slate-50/50 hover:bg-white hover:border-brand/30 hover:shadow-sm transition-all">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-sm font-bold text-brand">
                          {item.start_time} - {item.end_time}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-brand-dark">{item.patient_name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{item.patient_id}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <svg className="w-3.5 h-3.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                          <span className="text-sm font-medium text-muted-foreground">{item.service_name}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:items-end gap-3 shrink-0">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border", statusConfig[item.status].color)}>
                          {statusConfig[item.status].label}
                        </span>
                        
                        {item.status === "CONFIRMED" && (
                          <Link href="/doctor/treatments/new" className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]">
                            Khám bệnh
                          </Link>
                        )}
                        {item.status === "COMPLETED" && (
                          <Link href="/doctor/prescriptions" className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]">
                            Cập nhật hồ sơ
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Hồ sơ cần xử lý (1/3) */}
          <div className="rounded-2xl border border-border bg-white shadow-sm flex flex-col h-fit">
            <div className="border-b border-border p-5">
              <h3 className="text-base font-semibold text-brand-dark flex items-center gap-2">
                Hồ sơ cần xử lý
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">3</span>
              </h3>
            </div>
            
            <div className="p-2 flex-1">
              <div className="divide-y divide-border">
                {clinicalActions.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors rounded-xl flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-brand/10 text-brand">
                        {item.type === "medical_record" && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>}
                        {item.type === "prescription" && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5 19 12a2.828 2.828 0 1 0-4-4l-8.5 8.5V21h4.5z"/><line x1="16" x2="16" y1="4" y2="20"/><line x1="10" x2="10" y1="4" y2="20"/></svg>}
                        {item.type === "treatment_plan" && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-brand-dark">{item.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1 flex justify-end">
                      <Link href={item.link} className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors">
                        {item.action}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
