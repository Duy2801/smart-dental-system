import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  FileText,
  Pill,
  CalendarDots,
} from "@phosphor-icons/react/dist/ssr";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const statusConfig: Record<
  AppointmentStatus,
  { label: string; color: string }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  CHECKED_IN: {
    label: "Đã check-in",
    color: "bg-violet-100 text-violet-700 border-violet-200",
  },
  IN_PROGRESS: {
    label: "Đang khám",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-600 border-red-200",
  },
  NO_SHOW: {
    label: "Không đến",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const todayStats = [
  {
    label: "Tổng ca hôm nay",
    value: "8",
    suffix: "ca",
    icon: CalendarCheck,
    iconColor: "text-brand",
    bgColor: "bg-brand/8",
  },
  {
    label: "Đang chờ khám",
    value: "3",
    suffix: "người",
    icon: Clock,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    label: "Đã hoàn thành",
    value: "2",
    suffix: "ca",
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
  },
];

const todayAppointments = [
  {
    id: "1",
    startTime: "08:00",
    endTime: "09:00",
    patientCode: "BN-2001",
    patientName: "Nguyễn Văn A",
    serviceName: "Khám tổng quát",
    status: "COMPLETED" as AppointmentStatus,
  },
  {
    id: "2",
    startTime: "09:30",
    endTime: "10:30",
    patientCode: "BN-2002",
    patientName: "Trần Thị B",
    serviceName: "Nhổ răng khôn",
    status: "COMPLETED" as AppointmentStatus,
  },
  {
    id: "3",
    startTime: "11:00",
    endTime: "12:00",
    patientCode: "BN-2003",
    patientName: "Phạm Dũng",
    serviceName: "Tái khám niềng răng",
    status: "CHECKED_IN" as AppointmentStatus,
  },
  {
    id: "4",
    startTime: "14:00",
    endTime: "15:00",
    patientCode: "BN-2004",
    patientName: "Hoàng Oanh",
    serviceName: "Cấy ghép Implant",
    status: "CONFIRMED" as AppointmentStatus,
  },
  {
    id: "5",
    startTime: "15:30",
    endTime: "16:30",
    patientCode: "BN-2005",
    patientName: "Lê Cường",
    serviceName: "Tẩy trắng răng",
    status: "PENDING" as AppointmentStatus,
  },
];

const actionItems = [
  {
    id: "c1",
    type: "medical_record" as const,
    title: "Hồ sơ chưa hoàn thiện",
    desc: "BN Nguyễn Văn A (ca 08:00) chưa có ghi chú bệnh án.",
    action: "Viết bệnh án",
    link: "/doctor/medical-records",
  },
  {
    id: "c2",
    type: "prescription" as const,
    title: "Đơn thuốc chưa kê",
    desc: "BN Trần Thị B (Nhổ răng khôn) cần kê đơn thuốc giảm đau.",
    action: "Kê đơn",
    link: "/doctor/prescriptions/new",
  },
  {
    id: "c3",
    type: "treatment_plan" as const,
    title: "Cập nhật tiến độ",
    desc: "Kế hoạch của Phạm Dũng (Niềng răng) cần cập nhật ngày tái khám.",
    action: "Cập nhật",
    link: "/doctor/treatment-plans",
  },
];

const actionIconMap = {
  medical_record: FileText,
  prescription: Pill,
  treatment_plan: CalendarDots,
};

export default function DoctorDashboardPage() {
  const currentDate = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Header title="Chào BS. Trần Minh," description={currentDate} />

      <div className="space-y-6 p-6 md:p-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {todayStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      stat.bgColor,
                    )}
                  >
                    <Icon size={18} className={stat.iconColor} weight="duotone" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <p className="font-mono text-3xl font-bold text-brand-dark">
                    {stat.value}
                  </p>
                  <span className="text-base font-semibold text-muted-foreground">
                    {stat.suffix}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Timeline lịch hẹn hôm nay */}
          <div className="flex flex-col rounded-2xl border border-border bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h3 className="text-base font-semibold text-brand-dark">
                Lịch làm việc hôm nay
              </h3>
              <Link
                href="/doctor/schedule"
                className="text-sm font-medium text-brand hover:underline"
              >
                Xem lịch tuần →
              </Link>
            </div>

            <div className="flex-1 p-5">
              <div className="relative ml-3 space-y-5 border-l-2 border-muted/50 pb-2 md:ml-4">
                {todayAppointments.map((item) => {
                  const cfg = statusConfig[item.status];
                  return (
                    <div key={item.id} className="group relative pl-6 sm:pl-8">
                      <span className="absolute -left-[5px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-brand ring-4 ring-white" />
                      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-slate-50/50 p-4 transition-all hover:border-brand/30 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-sm font-bold text-brand">
                            {item.startTime} – {item.endTime}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-brand-dark">
                              {item.patientName}
                            </span>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                              {item.patientCode}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {item.serviceName}
                          </span>
                        </div>

                        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              cfg.color,
                            )}
                          >
                            {cfg.label}
                          </span>

                          {item.status === "CHECKED_IN" && (
                            <Link
                              href="/doctor/medical-records"
                              className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
                            >
                              Bắt đầu khám
                            </Link>
                          )}
                          {item.status === "IN_PROGRESS" && (
                            <button className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 active:scale-[0.98]">
                              Kết thúc khám
                            </button>
                          )}
                          {item.status === "COMPLETED" && (
                            <Link
                              href="/doctor/medical-records"
                              className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
                            >
                              Cập nhật hồ sơ
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hồ sơ cần xử lý */}
          <div className="flex h-fit flex-col rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-brand-dark">
                Hồ sơ cần xử lý
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                  3
                </span>
              </h3>
            </div>

            <div className="flex-1 p-2">
              <div className="divide-y divide-border">
                {actionItems.map((item) => {
                  const Icon = actionIconMap[item.type];
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-xl p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-lg bg-brand/10 p-1.5 text-brand">
                          <Icon size={16} weight="duotone" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-brand-dark">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1 flex justify-end">
                        <Link
                          href={item.link}
                          className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-white"
                        >
                          {item.action}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
