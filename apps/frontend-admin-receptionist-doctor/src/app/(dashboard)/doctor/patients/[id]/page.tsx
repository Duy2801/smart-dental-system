import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import {
  ArrowLeft,
  Phone,
  EnvelopeSimple,
  MapPin,
  Warning,
  CalendarBlank,
  Stethoscope,
  ArrowUpRight,
} from "@phosphor-icons/react/dist/ssr";

type Props = {
  params: Promise<{ id: string }>;
};

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
  PENDING: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  CHECKED_IN: { label: "Đã check-in", color: "bg-violet-100 text-violet-700" },
  IN_PROGRESS: { label: "Đang khám", color: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
  NO_SHOW: { label: "Không đến", color: "bg-slate-100 text-slate-600" },
};

const MOCK_PATIENT = {
  id: "pt-006",
  patientCode: "BN-2006",
  fullName: "Đỗ Thu Hà",
  phone: "0977889900",
  email: "doha@example.com",
  dateOfBirth: "15/05/2000",
  gender: "Nữ",
  address: "123 Nguyễn Huệ, P.Bến Nghé, Q.1, TP.HCM",
  medicalHistory: "Dị ứng Penicillin. Huyết áp thấp mãn tính.",
  emergencyContactName: "Đỗ Văn Hùng (Bố)",
  emergencyContactPhone: "0988112233",
};

const MOCK_APPOINTMENTS = [
  {
    id: "a1",
    scheduledAt: "21/07/2026 11:00",
    serviceName: "Tái khám niềng răng (Kỳ 6)",
    doctorName: "BS. Lê Hoàng",
    status: "CHECKED_IN" as AppointmentStatus,
    recordId: "rec-006",
  },
  {
    id: "a2",
    scheduledAt: "15/06/2026 10:00",
    serviceName: "Tái khám niềng răng (Kỳ 5)",
    doctorName: "BS. Lê Hoàng",
    status: "COMPLETED" as AppointmentStatus,
    recordId: "rec-005",
  },
  {
    id: "a3",
    scheduledAt: "10/05/2026 09:30",
    serviceName: "Tái khám niềng răng (Kỳ 4)",
    doctorName: "BS. Lê Hoàng",
    status: "COMPLETED" as AppointmentStatus,
    recordId: "rec-004",
  },
  {
    id: "a4",
    scheduledAt: "05/04/2026 14:00",
    serviceName: "Siết mắc cài (Kỳ 3)",
    doctorName: "BS. Lê Hoàng",
    status: "COMPLETED" as AppointmentStatus,
    recordId: "rec-003",
  },
];

const MOCK_TREATMENT_PLAN = {
  id: "tp-001",
  title: "Niềng răng mắc cài kim loại",
  status: "IN_PROGRESS",
  startDate: "10/01/2026",
  expectedEndDate: "10/01/2028",
  completedSteps: 6,
  totalSteps: 24,
};

export default async function DoctorPatientDetailPage({ params }: Props) {
  const { id } = await params;
  const patient = MOCK_PATIENT;
  const progressPercent = Math.round(
    (MOCK_TREATMENT_PLAN.completedSteps / MOCK_TREATMENT_PLAN.totalSteps) * 100,
  );

  return (
    <div className="p-6 md:p-8">
      {/* Breadcrumb */}
      <Link
        href="/doctor/patients"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách
      </Link>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left column: Patient info */}
        <div className="flex flex-col gap-4 xl:col-span-1">
          {/* Info card */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand">
                {patient.fullName
                  .split(" ")
                  .slice(-2)
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {patient.fullName}
                </h1>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {patient.patientCode}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone size={15} className="shrink-0 text-brand" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <EnvelopeSimple size={15} className="shrink-0 text-brand" />
                <span>{patient.email}</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
                <span>{patient.address}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <CalendarBlank size={15} className="shrink-0 text-brand" />
                <span>
                  {patient.dateOfBirth} • {patient.gender}
                </span>
              </div>
            </div>

            {patient.medicalHistory && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Warning size={15} className="text-amber-600" weight="fill" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Tiền sử bệnh
                  </span>
                </div>
                <p className="text-sm text-amber-900">{patient.medicalHistory}</p>
              </div>
            )}

            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Liên hệ khẩn cấp
              </p>
              <p className="text-sm font-medium text-slate-900">
                {patient.emergencyContactName}
              </p>
              <p className="text-sm text-muted-foreground">
                {patient.emergencyContactPhone}
              </p>
            </div>
          </div>

          {/* Active treatment plan */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Stethoscope size={16} className="text-brand" weight="duotone" />
              <h3 className="text-sm font-semibold text-brand-dark">
                Kế hoạch điều trị đang active
              </h3>
            </div>

            <p className="mb-1 font-semibold text-slate-900">
              {MOCK_TREATMENT_PLAN.title}
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              {MOCK_TREATMENT_PLAN.startDate} →{" "}
              {MOCK_TREATMENT_PLAN.expectedEndDate}
            </p>

            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">Tiến độ</span>
                <span className="font-semibold text-brand-dark">
                  {MOCK_TREATMENT_PLAN.completedSteps}/
                  {MOCK_TREATMENT_PLAN.totalSteps} bước ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <Link
              href={`/doctor/treatment-plans/${MOCK_TREATMENT_PLAN.id}`}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
            >
              Xem kế hoạch chi tiết
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Right column: Appointment history */}
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border p-5">
              <h2 className="text-base font-semibold text-brand-dark">
                Lịch sử khám bệnh
              </h2>
            </div>

            <div className="divide-y divide-border/50">
              {MOCK_APPOINTMENTS.map((apt) => {
                const cfg = statusConfig[apt.status];
                return (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-5 transition-colors hover:bg-slate-50/60"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            cfg.color,
                          )}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900">
                        {apt.serviceName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{apt.scheduledAt}</span>
                        <span>•</span>
                        <span>{apt.doctorName}</span>
                      </div>
                    </div>

                    {apt.status === "COMPLETED" && (
                      <Link
                        href={`/doctor/patients/${id}/records`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition-colors hover:border-brand/40 hover:text-brand"
                      >
                        Xem hồ sơ
                        <ArrowUpRight size={12} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
