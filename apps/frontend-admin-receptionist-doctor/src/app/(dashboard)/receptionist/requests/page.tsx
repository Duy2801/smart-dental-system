"use client";

import { useState, useMemo } from "react";
import { Header } from "@/src/components/layout/header";
import { cn } from "@/src/lib/utils/cn";
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  CurrencyCircleDollar,
  User,
  Stethoscope,
  CalendarBlank,
  Phone,
  MagnifyingGlass,
  Check,
  X,
  ChatCircleDots,
  ShieldCheck,
  WarningCircle,
  Funnel,
  Sparkle,
} from "@phosphor-icons/react";

export type RequestType =
  | "RESCHEDULE_APPOINTMENT"
  | "REFUND_CONSULTATION"
  | "DOCTOR_LEAVE_RESCHEDULE"
  | "SPECIAL_SUPPORT";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ChangeRequest = {
  id: string;
  requestCode: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: string;
  // Requester
  requestedByRole: "PATIENT" | "DOCTOR";
  requesterName: string;
  requesterPhone: string;
  patientId?: string;
  patientCode?: string;
  doctorId?: string;
  doctorName?: string;
  // Content & Details
  serviceName: string;
  currentSchedule: string;
  requestedSchedule?: string;
  reason: string;
  fee?: number;
  refundAmount?: number;
  refundPercent?: number;
  adminNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

// Initial realistic dataset
const INITIAL_REQUESTS: ChangeRequest[] = [
  {
    id: "req-1",
    requestCode: "YCQ-8492",
    type: "RESCHEDULE_APPOINTMENT",
    status: "PENDING",
    createdAt: "24/08/2026 14:30",
    requestedByRole: "PATIENT",
    requesterName: "Nguyễn Văn Hùng",
    requesterPhone: "0901 234 567",
    patientCode: "BN-0042",
    doctorName: "BS. Trần Quang Minh",
    serviceName: "Trám răng thẩm mỹ Composite",
    currentSchedule: "25/08/2026 - 09:30",
    requestedSchedule: "26/08/2026 - 15:00",
    reason: "Bệnh nhân có lịch công tác đột xuất vào sáng mai, xin phép dời sang chiều Thứ 4.",
  },
  {
    id: "req-2",
    requestCode: "YCQ-8493",
    type: "REFUND_CONSULTATION",
    status: "PENDING",
    createdAt: "24/08/2026 13:15",
    requestedByRole: "PATIENT",
    requesterName: "Lê Thị Thu Thảo",
    requesterPhone: "0912 888 999",
    patientCode: "BN-0108",
    doctorName: "BS. Hoàng Văn Nam",
    serviceName: "Tư vấn răng hàm mặt trực tuyến (Video Call)",
    currentSchedule: "26/08/2026 - 20:00",
    fee: 200000,
    refundPercent: 100,
    refundAmount: 200000,
    reason: "Bệnh nhân đã đến khám trực tiếp tại bệnh viện gần nhà, yêu cầu hủy buổi tư vấn trước 48h và hoàn phí theo chính sách.",
  },
  {
    id: "req-3",
    requestCode: "YCQ-8490",
    type: "DOCTOR_LEAVE_RESCHEDULE",
    status: "PENDING",
    createdAt: "24/08/2026 11:00",
    requestedByRole: "DOCTOR",
    requesterName: "BS.CKII Nguyễn Minh Quân",
    requesterPhone: "0987 654 321",
    doctorName: "BS.CKII Nguyễn Minh Quân",
    serviceName: "Toàn bộ ca khám chiều ngày 25/08 (3 bệnh nhân)",
    currentSchedule: "25/08/2026 (14:00 - 17:30)",
    reason: "Bác sĩ được triệu tập tham gia hội chẩn ca phẫu thuật hàm mặt khẩn cấp tại viện TW. Nhờ lễ tân liên hệ dời lịch 3 ca chiều mai sang ngày 27/08.",
  },
  {
    id: "req-4",
    requestCode: "YCQ-8488",
    type: "REFUND_CONSULTATION",
    status: "APPROVED",
    createdAt: "23/08/2026 09:10",
    requestedByRole: "PATIENT",
    requesterName: "Phạm Hải Đăng",
    requesterPhone: "0934 112 233",
    patientCode: "BN-0091",
    doctorName: "BS. Lê Quốc Bảo",
    serviceName: "Tư vấn Video Call Niềng Răng",
    currentSchedule: "23/08/2026 - 19:30",
    fee: 150000,
    refundPercent: 50,
    refundAmount: 75000,
    reason: "Bệnh nhân bận việc đột xuất trước 6 tiếng, xin hủy ca.",
    adminNote: "Đã hoàn tiền 50% qua chuyển khoản ngân hàng Vietcombank.",
    resolvedAt: "23/08/2026 10:00",
    resolvedBy: "Lễ tân Mai Anh",
  },
  {
    id: "req-5",
    requestCode: "YCQ-8485",
    type: "RESCHEDULE_APPOINTMENT",
    status: "APPROVED",
    createdAt: "22/08/2026 16:40",
    requestedByRole: "PATIENT",
    requesterName: "Hoàng Minh Tâm",
    requesterPhone: "0977 445 566",
    patientCode: "BN-0033",
    doctorName: "BS. Trần Quang Minh",
    serviceName: "Cắt chỉ & Tái khám sau cấy Implant",
    currentSchedule: "23/08/2026 - 10:00",
    requestedSchedule: "23/08/2026 - 16:30",
    reason: "Bệnh nhân bị kẹt xe vào buổi sáng, xin dời sang cuối giờ chiều cùng ngày.",
    adminNote: "Đã cập nhật lại lịch hẹn sang 16:30 trên hệ thống.",
    resolvedAt: "22/08/2026 17:00",
    resolvedBy: "Lễ tân Lan Hương",
  },
  {
    id: "req-6",
    requestCode: "YCQ-8481",
    type: "SPECIAL_SUPPORT",
    status: "REJECTED",
    createdAt: "22/08/2026 08:30",
    requestedByRole: "PATIENT",
    requesterName: "Đỗ Thanh Hằng",
    requesterPhone: "0909 778 899",
    patientCode: "BN-0120",
    serviceName: "Yêu cầu xuất lại hóa đơn đỏ bảo hiểm",
    currentSchedule: "Hóa đơn ngày 15/08/2026",
    reason: "Yêu cầu thay đổi thông tin tên công ty bảo hiểm trên hóa đơn đã quyết toán tháng trước.",
    adminNote: "Không thể chỉnh sửa hóa đơn đã đóng kỳ khai thuế tháng 7 theo quy định tài chính.",
    resolvedAt: "22/08/2026 09:15",
    resolvedBy: "Lễ tân Mai Anh",
  },
];

const TYPE_CONFIG: Record<
  RequestType,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  RESCHEDULE_APPOINTMENT: {
    label: "Đổi lịch khám",
    icon: <ArrowsClockwise size={16} weight="bold" />,
    color: "text-blue-700 border-blue-200 bg-blue-50",
    bg: "bg-blue-600",
  },
  REFUND_CONSULTATION: {
    label: "Hoàn tiền / Hủy ca",
    icon: <CurrencyCircleDollar size={16} weight="bold" />,
    color: "text-emerald-700 border-emerald-200 bg-emerald-50",
    bg: "bg-emerald-600",
  },
  DOCTOR_LEAVE_RESCHEDULE: {
    label: "Bác sĩ dời ca",
    icon: <Stethoscope size={16} weight="bold" />,
    color: "text-amber-700 border-amber-200 bg-amber-50",
    bg: "bg-amber-600",
  },
  SPECIAL_SUPPORT: {
    label: "Hỗ trợ & Khiếu nại",
    icon: <ChatCircleDots size={16} weight="bold" />,
    color: "text-purple-700 border-purple-200 bg-purple-50",
    bg: "bg-purple-600",
  },
};

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Chờ duyệt",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock size={13} weight="bold" />,
  },
  APPROVED: {
    label: "Đã duyệt",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle size={13} weight="fill" />,
  },
  REJECTED: {
    label: "Đã từ chối",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <XCircle size={13} weight="fill" />,
  },
};

export default function ReceptionistRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>(INITIAL_REQUESTS);
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>("PENDING");
  const [typeFilter, setTypeFilter] = useState<"ALL" | RequestType>("ALL");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionModal, setActionModal] = useState<"APPROVE" | "REJECT" | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === "PENDING").length;
    const reschedule = requests.filter((r) => r.type === "RESCHEDULE_APPOINTMENT").length;
    const refund = requests.filter((r) => r.type === "REFUND_CONSULTATION").length;
    const doctorLeave = requests.filter((r) => r.type === "DOCTOR_LEAVE_RESCHEDULE").length;
    return { pending, reschedule, refund, doctorLeave };
  }, [requests]);

  // Filtered requests
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.requestCode.toLowerCase().includes(q) ||
        r.requesterName.toLowerCase().includes(q) ||
        r.requesterPhone.includes(q) ||
        (r.patientCode && r.patientCode.toLowerCase().includes(q)) ||
        (r.doctorName && r.doctorName.toLowerCase().includes(q)) ||
        r.serviceName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    });
  }, [requests, statusFilter, typeFilter, search]);

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "APPROVED",
              adminNote: actionNote.trim() || "Lễ tân đã phê duyệt yêu cầu thành công.",
              resolvedAt: new Date().toLocaleString("vi-VN"),
              resolvedBy: "Lễ tân trực ca",
            }
          : r
      )
    );
    setActionModal(null);
    setSelectedRequest(null);
    setActionNote("");
  };

  const handleReject = (id: string) => {
    if (!actionNote.trim()) {
      alert("Vui lòng nhập lý do từ chối để thông báo cho bệnh nhân / bác sĩ.");
      return;
    }
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "REJECTED",
              adminNote: actionNote.trim(),
              resolvedAt: new Date().toLocaleString("vi-VN"),
              resolvedBy: "Lễ tân trực ca",
            }
          : r
      )
    );
    setActionModal(null);
    setSelectedRequest(null);
    setActionNote("");
  };

  return (
    <>
      <Header
        title="Trung tâm Xử lý Yêu cầu"
        description="Tiếp nhận, phê duyệt và xử lý các yêu cầu đổi lịch, hoàn tiền, dời ca từ Bệnh nhân và Bác sĩ"
      />

      <div className="space-y-6 p-6 md:p-8">
        {/* 1. TOP 4 METRICS CARDS */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Yêu cầu chờ duyệt</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-extrabold text-amber-700">
                  {stats.pending}
                </span>
                <span className="text-xs text-muted-foreground font-medium">yêu cầu</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ArrowsClockwise size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Yêu cầu đổi lịch</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-extrabold text-blue-700">
                  {stats.reschedule}
                </span>
                <span className="text-xs text-muted-foreground font-medium">lượt</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CurrencyCircleDollar size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Yêu cầu hoàn tiền</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-extrabold text-emerald-700">
                  {stats.refund}
                </span>
                <span className="text-xs text-muted-foreground font-medium">đơn</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Stethoscope size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Bác sĩ dời ca trực</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-extrabold text-purple-700">
                  {stats.doctorLeave}
                </span>
                <span className="text-xs text-muted-foreground font-medium">ca</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FILTER CONTROLS & SEARCH */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 transition cursor-pointer flex items-center gap-1.5",
                statusFilter === "PENDING"
                  ? "bg-white text-amber-700 shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Chờ xử lý ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 transition cursor-pointer",
                statusFilter === "APPROVED"
                  ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Đã duyệt
            </button>
            <button
              onClick={() => setStatusFilter("REJECTED")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 transition cursor-pointer",
                statusFilter === "REJECTED"
                  ? "bg-white text-rose-700 shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Đã từ chối
            </button>
            <button
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 transition cursor-pointer",
                statusFilter === "ALL"
                  ? "bg-white text-brand-dark shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Tất cả ({requests.length})
            </button>
          </div>

          {/* Type Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs">
              <Funnel size={14} className="text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "ALL" | RequestType)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả loại yêu cầu</option>
                <option value="RESCHEDULE_APPOINTMENT">Đổi lịch khám</option>
                <option value="REFUND_CONSULTATION">Hoàn tiền / Hủy ca</option>
                <option value="DOCTOR_LEAVE_RESCHEDULE">Bác sĩ dời ca</option>
                <option value="SPECIAL_SUPPORT">Hỗ trợ đặc biệt</option>
              </select>
            </div>

            <div className="relative w-full max-w-xs">
              <MagnifyingGlass
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                placeholder="Tìm mã YCQ, tên, SĐT, dịch vụ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {/* 3. REQUEST CARDS LIST */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-20 text-center shadow-xs">
            <ShieldCheck size={44} className="mb-3 text-slate-300" weight="duotone" />
            <h3 className="text-sm font-bold text-slate-900">Không có yêu cầu nào phù hợp</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Tất cả các yêu cầu đổi lịch và hoàn tiền đều đã được tiếp nhận và xử lý xong.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((req) => {
              const typeCfg = TYPE_CONFIG[req.type];
              const statusCfg = STATUS_CONFIG[req.status];
              const isPending = req.status === "PENDING";

              return (
                <div
                  key={req.id}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md",
                    isPending
                      ? "border-amber-200/80 ring-1 ring-amber-100"
                      : "border-border/80"
                  )}
                >
                  <div className="space-y-3.5">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold",
                            typeCfg.color
                          )}
                        >
                          {typeCfg.icon}
                          <span>{typeCfg.label}</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {req.requestCode}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
                          statusCfg.color
                        )}
                      >
                        {statusCfg.icon}
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>

                    {/* Requester Info */}
                    <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">
                          {req.requestedByRole === "DOCTOR" ? (
                            <Stethoscope size={20} className="text-purple-600" />
                          ) : (
                            <User size={20} className="text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {req.requesterName}
                            </span>
                            {req.patientCode && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] text-slate-600 font-bold">
                                {req.patientCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone size={12} /> {req.requesterPhone}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">{req.createdAt}</span>
                          </p>
                        </div>
                      </div>

                      <a
                        href={`tel:${req.requesterPhone}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-border bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-brand/10 hover:text-brand hover:border-brand/30 transition cursor-pointer"
                        title="Gọi điện thoại trực tiếp"
                      >
                        <Phone size={12} weight="bold" />
                        <span className="hidden sm:inline">Gọi điện</span>
                      </a>
                    </div>

                    {/* Details Box */}
                    <div className="rounded-xl bg-slate-50/80 p-3.5 text-xs space-y-2 border border-slate-200/60">
                      <div>
                        <span className="text-muted-foreground font-medium">Dịch vụ / Ca khám:</span>{" "}
                        <span className="font-bold text-slate-900">{req.serviceName}</span>
                        {req.doctorName && (
                          <span className="text-slate-600"> ({req.doctorName})</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div>
                          <span className="text-muted-foreground">Lịch hẹn hiện tại:</span>{" "}
                          <span className="font-bold text-rose-700 line-through">
                            {req.currentSchedule}
                          </span>
                        </div>
                        {req.requestedSchedule && (
                          <div>
                            <span className="text-muted-foreground">Mong muốn dời sang:</span>{" "}
                            <span className="font-bold text-emerald-700">
                              {req.requestedSchedule}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Refund specific information */}
                      {req.refundAmount !== undefined && (
                        <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200/80 text-emerald-900">
                          <span className="font-bold">Số tiền hoàn đề xuất:</span>{" "}
                          <span className="font-mono font-extrabold text-emerald-700 text-sm">
                            {req.refundAmount.toLocaleString("vi-VN")}đ
                          </span>{" "}
                          <span className="text-[11px] font-medium text-emerald-800">
                            ({req.refundPercent}% theo quy định hủy trước lịch)
                          </span>
                        </div>
                      )}

                      <div className="pt-1">
                        <span className="text-muted-foreground font-medium">Lý do:</span>{" "}
                        <span className="text-slate-800 italic">"{req.reason}"</span>
                      </div>

                      {/* Admin Note if resolved */}
                      {req.adminNote && (
                        <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-800">Kết quả xử lý:</span>{" "}
                          {req.adminNote}
                          {req.resolvedBy && (
                            <span className="text-muted-foreground block mt-0.5">
                              Xử lý bởi: {req.resolvedBy} lúc {req.resolvedAt}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  {isPending && (
                    <div className="mt-4 flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionModal("REJECT");
                          setActionNote("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <X size={14} weight="bold" />
                        Từ chối
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionModal("APPROVE");
                          setActionNote("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark shadow-xs transition active:scale-[0.98] cursor-pointer"
                      >
                        <Check size={14} weight="bold" />
                        Duyệt yêu cầu
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL APPROVE / REJECT CONFIRMATION */}
      {actionModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {actionModal === "APPROVE" ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle size={20} weight="fill" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <WarningCircle size={20} weight="fill" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {actionModal === "APPROVE" ? "Phê duyệt yêu cầu" : "Từ chối yêu cầu"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Mã: {selectedRequest.requestCode} • {selectedRequest.requesterName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1.5 border border-slate-200">
              <p>
                <span className="font-bold">Loại yêu cầu:</span>{" "}
                {TYPE_CONFIG[selectedRequest.type].label}
              </p>
              <p>
                <span className="font-bold">Nội dung:</span> {selectedRequest.reason}
              </p>
              {selectedRequest.requestedSchedule && (
                <p>
                  <span className="font-bold">Lịch mới:</span>{" "}
                  <span className="text-emerald-700 font-bold">
                    {selectedRequest.requestedSchedule}
                  </span>
                </p>
              )}
              {selectedRequest.refundAmount !== undefined && (
                <p>
                  <span className="font-bold">Số tiền hoàn:</span>{" "}
                  <span className="text-emerald-700 font-bold font-mono">
                    {selectedRequest.refundAmount.toLocaleString("vi-VN")}đ
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {actionModal === "APPROVE" ? "Ghi chú phê duyệt (Tùy chọn)" : "Lý do từ chối (Bắt buộc)"}
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionModal === "APPROVE"
                    ? "Nhập ghi chú xử lý (VD: Đã cập nhật vào lịch khám của bác sĩ)..."
                    : "Nhập lý do từ chối gửi thông báo cho bệnh nhân / bác sĩ..."
                }
                className="w-full rounded-xl border border-border bg-white p-3 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>

              {actionModal === "APPROVE" ? (
                <button
                  type="button"
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  <Check size={14} weight="bold" />
                  Xác nhận Duyệt
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleReject(selectedRequest.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  <X size={14} weight="bold" />
                  Xác nhận Từ chối
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
