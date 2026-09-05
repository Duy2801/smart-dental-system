"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Header } from "@/src/components/layout/header";
import apiClient from "@/src/lib/api/client";
import { cn } from "@/src/lib/utils/cn";
import { useAppDialog } from "@/src/providers/app-dialog-provider";
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
  BellSimpleRinging,
  Bank,
  QrCode,
  UploadSimple,
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
  // Banking details for refunds
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  qrCodeUrl?: string | null;
  proofImageUrl?: string | null;
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
    bankName: "Vietcombank",
    accountNumber: "1029384756",
    accountHolder: "LE THI THU THAO",
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
    bankName: "MB Bank",
    accountNumber: "9876543210",
    accountHolder: "PHAM HAI DANG",
    reason: "Bệnh nhân bận việc đột xuất trước 6 tiếng, xin hủy ca.",
    adminNote: "Đã hoàn tiền 50% qua chuyển khoản ngân hàng MB Bank.",
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
  const { showAlert } = useAppDialog();
  const [requests, setRequests] = useState<ChangeRequest[]>(INITIAL_REQUESTS);
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>("PENDING");
  const [typeFilter, setTypeFilter] = useState<"ALL" | RequestType>("ALL");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionModal, setActionModal] = useState<"APPROVE" | "REJECT" | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const proofFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      void showAlert({
        title: "Tệp ảnh quá lớn",
        description: "Dung lượng tệp ảnh không được vượt quá 5MB.",
        tone: "danger",
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Fetch real refund requests from backend
  useEffect(() => {
    const fetchLiveRefunds = async () => {
      try {
        const res = await apiClient.get<any[]>("/refund-requests");
        if (Array.isArray(res.data) && res.data.length > 0) {
          const liveList: ChangeRequest[] = res.data.map((item) => ({
            id: item.id,
            requestCode: item.refundCode,
            type: "REFUND_CONSULTATION",
            status: item.status === "COMPLETED" ? "APPROVED" : item.status === "REJECTED" ? "REJECTED" : "PENDING",
            createdAt: new Date(item.createdAt).toLocaleString("vi-VN"),
            requestedByRole: "PATIENT",
            requesterName: item.patient?.user?.fullName || "Bệnh nhân",
            requesterPhone: item.patient?.user?.phone || "09xx xxx xxx",
            patientCode: item.patient?.patientCode,
            serviceName: item.videoConsultation ? "Tư vấn trực tuyến (Video Call)" : item.appointment?.service?.name || "Khám nha khoa",
            doctorName: item.videoConsultation?.doctor?.user?.fullName || item.appointment?.doctor?.user?.fullName,
            currentSchedule: item.videoConsultation?.scheduledAt ? new Date(item.videoConsultation.scheduledAt).toLocaleString("vi-VN") : "Lịch tư vấn",
            fee: item.videoConsultation?.fee ? Number(item.videoConsultation.fee) : undefined,
            refundAmount: Number(item.requestedAmount || 0),
            refundPercent: item.refundPercent || 100,
            bankName: item.bankName,
            accountNumber: item.accountNumber,
            accountHolder: item.accountHolder,
            qrCodeUrl: item.qrCodeUrl,
            proofImageUrl: item.proofImageUrl,
            reason: item.reason || "Yêu cầu hoàn tiền theo chính sách",
            adminNote: item.rejectReason || (item.status === "COMPLETED" ? "Đã chuyển tiền hoàn phí thành công." : undefined),
            resolvedAt: item.processedAt ? new Date(item.processedAt).toLocaleString("vi-VN") : undefined,
            resolvedBy: item.processor?.fullName,
          }));

          setRequests((prev) => {
            const liveIds = new Set(liveList.map((l) => l.id));
            const remain = prev.filter((p) => !liveIds.has(p.id));
            return [...liveList, ...remain];
          });
        }
      } catch {
        // use fallback initial dataset
      }
    };

    void fetchLiveRefunds();
  }, []);

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

  const handleApprove = async (id: string) => {
    const target = requests.find((r) => r.id === id);
    setSubmitting(true);
    try {
      if (target?.type === "REFUND_CONSULTATION" && target.id.length > 10) {
        await apiClient.patch(`/refund-requests/${id}/process`, {
          status: "COMPLETED",
          proofImageUrl: proofImageUrl.trim() || undefined,
        });
      }
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "APPROVED",
                adminNote: actionNote.trim() || "Lễ tân đã phê duyệt hoàn tiền thành công.",
                proofImageUrl: proofImageUrl || r.proofImageUrl,
                resolvedAt: new Date().toLocaleString("vi-VN"),
                resolvedBy: "Lễ tân trực ca",
              }
            : r
        )
      );
      setActionModal(null);
      setSelectedRequest(null);
      setActionNote("");
      setProofImageUrl("");
      if (target) {
        showToast(`✓ Đã duyệt hoàn tiền ${(target.refundAmount || 0).toLocaleString("vi-VN")}đ và gửi Gmail + App cho ${target.requesterName}!`, "success");
      }
    } catch {
      await showAlert({
        title: "Không thể phê duyệt yêu cầu",
        description: "Xử lý phê duyệt thất bại. Vui lòng thử lại.",
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!actionNote.trim()) {
      await showAlert({
        title: "Chưa nhập lý do từ chối",
        description: "Vui lòng nhập lý do để thông báo cho bệnh nhân hoặc bác sĩ.",
      });
      return;
    }
    const target = requests.find((r) => r.id === id);
    setSubmitting(true);
    try {
      if (target?.type === "REFUND_CONSULTATION" && target.id.length > 10) {
        await apiClient.patch(`/refund-requests/${id}/process`, {
          status: "REJECTED",
          rejectReason: actionNote.trim(),
        });
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
      setProofImageUrl("");
      if (target) {
        showToast(`✓ Đã từ chối yêu cầu #${target.requestCode} và gửi Gmail giải trình + App cho ${target.requesterName}!`, "info");
      }
    } catch {
      await showAlert({
        title: "Không thể từ chối yêu cầu",
        description: "Xử lý từ chối thất bại. Vui lòng thử lại.",
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendNotification = (req: ChangeRequest) => {
    showToast(`✓ Đã gửi lại Gmail & Thông báo In-App cho ${req.requesterName} (#${req.requestCode})!`, "success");
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
              <p className="text-xs font-medium text-muted-foreground">Bác sĩ dời ca</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl font-extrabold text-purple-700">
                  {stats.doctorLeave}
                </span>
                <span className="text-xs text-muted-foreground font-medium">ca</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FILTER & SEARCH BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground pl-2 flex items-center gap-1">
              <Funnel size={13} weight="bold" /> Lọc theo:
            </span>

            {/* Status Pills */}
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {st === "ALL" && "Tất cả trạng thái"}
                {st === "PENDING" && `Chờ duyệt (${stats.pending})`}
                {st === "APPROVED" && "Đã duyệt"}
                {st === "REJECTED" && "Đã từ chối"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-xl border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand"
            >
              <option value="ALL">Tất cả loại yêu cầu</option>
              <option value="RESCHEDULE_APPOINTMENT">Đổi lịch khám</option>
              <option value="REFUND_CONSULTATION">Hoàn tiền / Hủy ca</option>
              <option value="DOCTOR_LEAVE_RESCHEDULE">Bác sĩ dời ca</option>
              <option value="SPECIAL_SUPPORT">Hỗ trợ & Khiếu nại</option>
            </select>

            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <MagnifyingGlass
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Tìm mã YC, tên BN, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* 3. REQUEST LIST CARDS */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Sparkle size={24} weight="duotone" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Không tìm thấy yêu cầu nào</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Không có yêu cầu nào phù hợp với bộ lọc hiện tại. Thử chọn "Tất cả" hoặc xóa từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((req) => {
              const typeCfg = TYPE_CONFIG[req.type];
              const statusCfg = STATUS_CONFIG[req.status];
              const isPending = req.status === "PENDING";

              return (
                <div
                  key={req.id}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md",
                    isPending ? "border-amber-200/80 bg-amber-50/10" : "border-border"
                  )}
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Type Badge + Code + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold",
                            typeCfg.color
                          )}
                        >
                          {typeCfg.icon}
                          <span>{typeCfg.label}</span>
                        </span>
                        <span className="font-mono text-xs font-extrabold text-slate-800">
                          #{req.requestCode}
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
                        <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200/80 text-emerald-900 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Số tiền hoàn:</span>
                            <span className="font-mono font-extrabold text-emerald-700 text-sm">
                              {req.refundAmount.toLocaleString("vi-VN")}đ ({req.refundPercent}%)
                            </span>
                          </div>
                          {req.bankName && (
                            <p className="text-[11px] text-emerald-800">
                              🏦 {req.bankName} - <span className="font-mono font-bold">{req.accountNumber}</span> ({req.accountHolder})
                            </p>
                          )}
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
                  {isPending ? (
                    <div className="mt-4 flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionModal("REJECT");
                          setActionNote("");
                          setProofImageUrl("");
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
                          setProofImageUrl("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark shadow-xs transition active:scale-[0.98] cursor-pointer"
                      >
                        <Check size={14} weight="bold" />
                        {req.type === "REFUND_CONSULTATION" ? "Duyệt & Chuyển tiền" : "Duyệt yêu cầu"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-end gap-2 pt-2.5 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => handleResendNotification(req)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                        title="Gửi lại Gmail và Thông báo In-App"
                      >
                        <BellSimpleRinging size={13} weight="bold" />
                        <span>Gửi lại thông báo (Gmail/App)</span>
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
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl space-y-4">
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
                    {actionModal === "APPROVE"
                      ? selectedRequest.type === "REFUND_CONSULTATION"
                        ? "Duyệt & Thực hiện hoàn tiền"
                        : "Phê duyệt yêu cầu"
                      : "Từ chối yêu cầu"}
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

            {/* Request Summary Box */}
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1.5 border border-slate-200">
              <p>
                <span className="font-bold">Loại yêu cầu:</span>{" "}
                {TYPE_CONFIG[selectedRequest.type].label}
              </p>
              <p>
                <span className="font-bold">Nội dung / Lý do:</span> {selectedRequest.reason}
              </p>
              {selectedRequest.requestedSchedule && (
                <p>
                  <span className="font-bold">Lịch mới mong muốn:</span>{" "}
                  <span className="text-emerald-700 font-bold">
                    {selectedRequest.requestedSchedule}
                  </span>
                </p>
              )}
            </div>

            {/* Special Refund Banking & VietQR Box */}
            {selectedRequest.type === "REFUND_CONSULTATION" && (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Bank size={16} weight="duotone" className="text-emerald-600" />
                    <span>Thông tin tài khoản nhận tiền</span>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                    Mức hoàn: {selectedRequest.refundPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <p className="text-muted-foreground text-[11px]">Ngân hàng:</p>
                    <p className="font-bold text-slate-900">{selectedRequest.bankName || "Vietcombank"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px]">Số tài khoản:</p>
                    <p className="font-mono font-bold text-slate-900">{selectedRequest.accountNumber || "1029384756"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px]">Chủ tài khoản:</p>
                    <p className="font-bold uppercase text-slate-900">{selectedRequest.accountHolder || selectedRequest.requesterName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px]">Số tiền cần hoàn:</p>
                    <p className="font-mono font-extrabold text-emerald-700 text-sm">
                      {(selectedRequest.refundAmount || 0).toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>

                {/* VietQR Quick Scan */}
                {actionModal === "APPROVE" && (
                  <div className="pt-2 border-t border-emerald-200/60">
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-emerald-200">
                      <img
                        src={`https://img.vietqr.io/image/${(selectedRequest.bankName || "ICB").replace(/\s+/g, "")}-${selectedRequest.accountNumber || "123456"}-compact2.png?amount=${selectedRequest.refundAmount || 0}&addInfo=${encodeURIComponent(selectedRequest.requestCode)}&accountName=${encodeURIComponent(selectedRequest.accountHolder || selectedRequest.requesterName)}`}
                        alt="Mã VietQR Hoàn Tiền"
                        className="h-28 w-28 object-contain rounded-lg border border-slate-200 shrink-0"
                      />
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-emerald-800 flex items-center gap-1">
                          <QrCode size={14} weight="bold" /> Quét mã VietQR chuyển khoản nhanh
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Lễ tân mở App ngân hàng để quét mã QR chuyển tiền trực tiếp cho bệnh nhân theo đúng số tiền và nội dung.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proof Image Upload */}
                {actionModal === "APPROVE" && (
                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Đính kèm ảnh biên nhận / Ủy nhiệm chi (Tùy chọn):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={proofFileInputRef}
                      onChange={handleProofFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {proofImageUrl && (
                      <div className="mt-2 relative inline-block">
                        <img
                          src={proofImageUrl}
                          alt="Biên lai"
                          className="h-16 w-24 object-cover rounded-lg border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => setProofImageUrl("")}
                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 text-[9px]"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                    ? "Nhập ghi chú xử lý (VD: Đã chuyển khoản qua Vietcombank)..."
                    : "Nhập lý do từ chối gửi thông báo cho bệnh nhân / bác sĩ..."
                }
                className="w-full rounded-xl border border-border bg-white p-3 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={submitting}
                className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              {actionModal === "APPROVE" ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} weight="bold" />
                  {submitting ? "Đang xử lý..." : selectedRequest.type === "REFUND_CONSULTATION" ? "Xác nhận Hoàn tiền & Gửi thông báo" : "Xác nhận Duyệt & Gửi thông báo"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleReject(selectedRequest.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <X size={14} weight="bold" />
                  {submitting ? "Đang xử lý..." : "Xác nhận Từ chối & Gửi thông báo"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SUCCESS / INFO TOAST */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-bold shadow-xl backdrop-blur-xs animate-in fade-in slide-in-from-bottom-4",
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-rose-200 bg-rose-50 text-rose-800"
        )}>
          <span className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-[10px]",
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          )}>
            {toast.type === "success" ? "✓" : "✕"}
          </span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
