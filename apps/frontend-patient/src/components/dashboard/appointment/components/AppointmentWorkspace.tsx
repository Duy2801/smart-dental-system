"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { DashboardIcon, type DashboardIconName } from "../../common/DashboardIcon";
import { BookingPanel } from "./booking/BookingPanel";
import { CurrentAppointmentCard } from "./sidebar/CurrentAppointmentCard";
import { NotificationSettings } from "./sidebar/NotificationSettings";
import { SupportCard } from "./sidebar/SupportCard";
import type { AppointmentService, BookingDate, CurrentAppointment, Dentist, NotificationPreferences } from "../types";

const services: AppointmentService[] = [
  { id: "cleaning", name: "Vệ sinh răng", description: "Làm sạch răng định kỳ", icon: "cleaning" },
  { id: "braces", name: "Chỉnh nha", description: "Tư vấn chỉnh nha", icon: "braces" },
  { id: "implant", name: "Cấy ghép", description: "Phục hồi răng đã mất", icon: "implant" },
  { id: "general", name: "Khám tổng quát", description: "Kiểm tra răng miệng", icon: "shield" },
  { id: "whitening", name: "Tẩy trắng răng", description: "Cải thiện màu răng", icon: "sparkles" },
  { id: "wisdom-tooth", name: "Nhổ răng khôn", description: "Tiểu phẫu an toàn", icon: "extraction" },
  { id: "root-canal", name: "Điều trị tủy", description: "Điều trị bảo tồn", icon: "rootCanal" },
  { id: "all-services", name: "Xem tất cả", description: "Mọi dịch vụ", icon: "grid" },
];

const doctors: Dentist[] = [
  { id: "doctor-hai", name: "ThS. BS. Trần Minh Hải", specialty: "Chỉnh nha & Invisalign", experience: "15 năm", initials: "MH", tone: "blue" },
  { id: "doctor-thao", name: "ThS. BS. Nguyễn Phương Thảo", specialty: "Thẩm mỹ & phục hình răng sứ", experience: "12 năm", initials: "PT", tone: "cyan" },
];

const dates: BookingDate[] = Array.from({ length: 31 }, (_, index) => ({ id: `2026-07-${String(index + 1).padStart(2, "0")}`, weekday: "", day: String(index + 1).padStart(2, "0"), month: "Thg 7" }));
const times = ["08:00", "09:00", "09:30", "10:30", "11:00", "14:00"];

type ManagedAppointment = {
  id: number; doctor: string; service: string; date: string; time: string;
  status: "confirmed" | "pending" | "completed" | "cancelled" | "missed";
  initials: string; preparation?: string[];
};

const initialAppointments: ManagedAppointment[] = [
  { id: 1, doctor: "BS. Nguyễn Minh Tuấn", service: "Niềng răng Invisalign · Tái khám định kỳ", date: "Thứ Ba, 24/07/2026", time: "09:30", status: "confirmed", initials: "MT", preparation: ["Mang theo khay niềng cũ", "Vệ sinh răng miệng sạch sẽ"] },
  { id: 2, doctor: "BS. Lê Thị Phương", service: "Vệ sinh răng & cạo vôi", date: "Thứ Sáu, 31/07/2026", time: "14:00", status: "pending", initials: "LP" },
  { id: 3, doctor: "BS. Nguyễn Minh Tuấn", service: "Khám tổng quát", date: "12/06/2026", time: "10:00", status: "completed", initials: "MT" },
  { id: 4, doctor: "BS. Lê Thị Phương", service: "Tẩy trắng răng", date: "18/05/2026", time: "15:30", status: "cancelled", initials: "LP" },
  { id: 5, doctor: "BS. Trần Minh Hải", service: "Tái khám chỉnh nha", date: "04/04/2026", time: "08:30", status: "missed", initials: "MH" },
];

const statusInfo = {
  confirmed: { label: "Đã xác nhận", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Hoàn thành", className: "bg-blue-50 text-blue-700 border-blue-200" },
  cancelled: { label: "Đã hủy", className: "bg-rose-50 text-rose-700 border-rose-200" },
  missed: { label: "Vắng mặt", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

function StatCard({ icon, value, label, detail, tone }: { icon: DashboardIconName; value: string; label: string; detail: string; tone: string }) {
  return <article className="group relative overflow-hidden rounded-[22px] border border-white bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(37,99,235,.12)]"><div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-40 ${tone.split(" ")[0]}`}/><div className="relative flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><DashboardIcon name={icon} className="h-5 w-5"/></span><span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">{detail}</span></div><div className="relative mt-5 flex items-end justify-between"><div><strong className="block text-3xl tracking-tight text-slate-900">{value}</strong><p className="mt-1 text-xs font-medium text-slate-500">{label}</p></div><span className="text-lg text-slate-200 transition group-hover:translate-x-1 group-hover:text-blue-400">→</span></div></article>;
}

function AppointmentCard({ appointment, onCancel, onReschedule }: { appointment: ManagedAppointment; onCancel: () => void; onReschedule: () => void }) {
  const status = statusInfo[appointment.status];
  const dateParts = appointment.date.match(/(\d{2})\/(\d{2})/);
  return <article className="group flex flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_22px_50px_rgba(37,99,235,.12)]"><div className="h-1 bg-gradient-to-r from-[#0058bc] via-sky-400 to-cyan-300"/><header className="flex items-start justify-between gap-3 border-b border-slate-100 p-5"><div className="flex min-w-0 gap-3"><span className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#0058bc] to-cyan-400 text-xs font-bold text-white shadow-lg shadow-blue-100">{appointment.initials}</span><div className="min-w-0"><h3 className="truncate text-sm font-bold text-slate-900">{appointment.doctor}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#0058bc]">{appointment.service}</p></div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${status.className}`}><span className="mr-1">●</span>{status.label}</span></header><div className="flex flex-1 flex-col p-5"><div className="grid grid-cols-[82px_1fr] gap-4"><div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 text-center"><p className="bg-[#0058bc] py-1.5 text-[9px] font-bold uppercase tracking-wider text-white">Tháng {dateParts?.[2] ?? "07"}</p><strong className="block py-2 text-3xl text-[#0058bc]">{dateParts?.[1] ?? "24"}</strong></div><div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#0058bc]"><DashboardIcon name="clock" className="h-4 w-4"/></span>{appointment.time}</div></div>{appointment.preparation && <div className="mt-5 rounded-2xl border border-cyan-100 bg-gradient-to-r from-blue-50/70 to-cyan-50/70 p-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#0058bc]"><DashboardIcon name="document" className="h-4 w-4"/>Chuẩn bị trước khám</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{appointment.preparation.map((item,index) => <p key={item} className="text-[11px] text-slate-600"><span className={index === 0 ? "text-emerald-500" : "text-slate-300"}>{index === 0 ? "●" : "○"}</span> {item}</p>)}</div></div>}<div className="mt-auto flex gap-2 border-t border-slate-100 pt-5"><button className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0058bc]" aria-label="Thêm vào lịch"><DashboardIcon name="calendar" className="h-4 w-4"/></button><button onClick={onReschedule} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#0058bc]">Đổi lịch hẹn</button><button onClick={onCancel} className="rounded-xl px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50">Hủy</button></div></div></article>;
}

export function AppointmentWorkspace({ initialMode = "manage" }: { initialMode?: "manage" | "booking" }) {
  const [mode, setMode] = useState<"manage" | "booking">(initialMode);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedServiceId, setSelectedServiceId] = useState("cleaning");
  const [selectedDoctorId, setSelectedDoctorId] = useState("doctor-hai");
  const [selectedDateId, setSelectedDateId] = useState("2026-07-14");
  const [selectedTime, setSelectedTime] = useState("09:30");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreferences>({ email: true, app: true, sms: false });

  const upcoming = appointments.filter(item => item.status === "confirmed" || item.status === "pending");
  const history = useMemo(() => appointments.filter(item => !["confirmed", "pending"].includes(item.status)).filter(item => statusFilter === "all" || item.status === statusFilter).filter(item => `${item.doctor} ${item.service}`.toLowerCase().includes(query.toLowerCase())), [appointments, query, statusFilter]);
  const current: CurrentAppointment | null = upcoming[0] ? { service: upcoming[0].service, date: upcoming[0].date, time: upcoming[0].time, doctor: upcoming[0].doctor, status: statusInfo[upcoming[0].status].label } : null;

  function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const service = services.find(item => item.id === selectedServiceId); const doctor = doctors.find(item => item.id === selectedDoctorId); const date = dates.find(item => item.id === selectedDateId); if (!service || !doctor || !date) return;
    setAppointments(currentItems => [{ id: Date.now(), doctor: doctor.name, service: service.name, date: `Ngày ${date.day}/07/2026`, time: selectedTime, status: "pending", initials: doctor.initials }, ...currentItems]);
    setSuccessMessage("Đã ghi nhận lịch hẹn. Phòng khám sẽ xác nhận trong ít phút.");
  }

  if (mode === "booking") return <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><button onClick={() => setMode("manage")} className="mb-4 text-xs font-bold text-[#0058bc] hover:underline">← Quay lại quản lý lịch hẹn</button><h1 className="text-3xl font-bold tracking-tight text-slate-900">Đặt lịch hẹn mới</h1><p className="mt-2 text-sm text-slate-500">Chọn dịch vụ, thời gian và bác sĩ phù hợp với bạn.</p></div></div><div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.7fr)_360px]"><BookingPanel services={services} doctors={doctors} dates={dates} times={times} selectedServiceId={selectedServiceId} selectedDoctorId={selectedDoctorId} selectedDateId={selectedDateId} selectedTime={selectedTime} successMessage={successMessage} onSelectService={id => { setSelectedServiceId(id); setSuccessMessage(null); }} onSelectDoctor={id => { setSelectedDoctorId(id); setSuccessMessage(null); }} onSelectDate={id => { setSelectedDateId(id); setSuccessMessage(null); }} onSelectTime={time => { setSelectedTime(time); setSuccessMessage(null); }} onSubmit={createAppointment}/><aside className="space-y-5 lg:sticky lg:top-24"><CurrentAppointmentCard appointment={current}/><NotificationSettings value={notifications} onChange={key => setNotifications(value => ({ ...value, [key]: !value[key] }))}/><SupportCard/></aside></div></main>;

  return <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8"><header className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#064f9f] via-[#0668cb] to-[#0795d7] px-6 py-8 text-white shadow-[0_22px_60px_rgba(0,88,188,.22)] sm:px-9 sm:py-10"><div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border-[50px] border-white/5"/><div className="absolute bottom-0 right-[28%] h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl"/><div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-blue-50 backdrop-blur"><DashboardIcon name="calendar" className="h-4 w-4"/>Trung tâm lịch hẹn</div><h1 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Quản lý lịch hẹn của bạn</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">Theo dõi lịch trình, chuẩn bị trước khám và quản lý toàn bộ hành trình chăm sóc nụ cười tại một nơi.</p><span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-300"/>Còn 2 ngày đến lịch hẹn kế tiếp</span></div><div className="flex flex-wrap gap-3"><button className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20">Cài đặt thông báo</button><button onClick={() => setMode("booking")} className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-[#0058bc] shadow-xl transition hover:-translate-y-0.5"><span className="text-lg leading-none">＋</span>Đặt lịch mới</button></div></div></header>

    <div className="relative z-10 -mt-3 grid gap-4 px-2 md:grid-cols-2 lg:grid-cols-4"><StatCard icon="appointment" value={String(appointments.length)} label="Tổng số lịch hẹn" detail={`${upcoming.length} sắp tới`} tone="bg-blue-50 text-blue-600"/><StatCard icon="checkup" value={String(appointments.filter(item => item.status === "completed").length)} label="Đã hoàn thành" detail="Thành công" tone="bg-emerald-50 text-emerald-600"/><article className="relative overflow-hidden rounded-[22px] border border-blue-100 bg-gradient-to-r from-[#f0f7ff] to-[#e8fbff] p-6 shadow-[0_10px_35px_rgba(15,23,42,.05)] md:col-span-2"><div className="absolute -right-8 -bottom-12 h-36 w-36 rounded-full bg-blue-200/25"/><div className="relative flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0058bc] text-white shadow-lg shadow-blue-200"><DashboardIcon name="sparkles" className="h-5 w-5"/></span><div><p className="text-xs font-bold uppercase tracking-wider text-[#0058bc]">Nhắc lịch thông minh</p><p className="mt-2 text-sm leading-6 text-slate-600">Buổi khám ngày 24/07 rất quan trọng để điều chỉnh dây cung. Hãy vệ sinh kỹ bằng bàn chải kẽ trước khi đến.</p><button className="mt-3 text-xs font-bold text-[#0058bc] hover:underline">Xem hướng dẫn chuẩn bị →</button></div></div></article></div>

    <section className="mt-8 rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,.04)]"><div className="mb-3 flex items-center justify-between px-1"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Tìm kiếm & lọc lịch hẹn</p><button onClick={() => { setQuery(""); setStatusFilter("all"); }} className="text-[10px] font-bold text-[#0058bc]">Đặt lại bộ lọc</button></div><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><DashboardIcon name="search" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm theo bác sĩ hoặc dịch vụ..." className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></div><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600 outline-none focus:border-blue-400"><option value="all">Tất cả trạng thái</option><option value="completed">Đã hoàn thành</option><option value="cancelled">Đã hủy</option><option value="missed">Vắng mặt</option></select><select className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600 outline-none focus:border-blue-400"><option>Tất cả bác sĩ</option><option>BS. Nguyễn Minh Tuấn</option><option>BS. Lê Thị Phương</option></select></div></section>

    <section className="mt-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0058bc]">Lịch trình của bạn</p><div className="mt-1 flex items-center gap-3"><h2 className="text-xl font-bold text-slate-900">Lịch hẹn sắp tới</h2><span className="rounded-full bg-[#0058bc] px-2.5 py-1 text-[10px] font-bold text-white">{upcoming.length}</span></div></div><button onClick={() => setMode("booking")} className="text-xs font-bold text-[#0058bc] hover:underline">＋ Thêm lịch hẹn</button></div><div className="grid gap-5 lg:grid-cols-2">{upcoming.map(item => <AppointmentCard key={item.id} appointment={item} onReschedule={() => setMode("booking")} onCancel={() => setAppointments(items => items.map(currentItem => currentItem.id === item.id ? { ...currentItem, status: "cancelled" } : currentItem))}/>)}</div></section>

    <section className="mt-12"><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Hồ sơ lịch hẹn</p><h2 className="mt-1 text-xl font-bold text-slate-900">Lịch sử thăm khám</h2></div><div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.04)]"><div className="hidden grid-cols-[1.4fr_.8fr_auto] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 md:grid"><span>Dịch vụ & bác sĩ</span><span>Thời gian</span><span>Trạng thái</span></div>{history.map(item => { const status = statusInfo[item.status]; return <article key={item.id} className="grid gap-4 border-b border-slate-100 p-5 transition last:border-0 hover:bg-blue-50/30 md:grid-cols-[1.4fr_.8fr_auto] md:items-center"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-blue-100 text-xs font-bold text-[#0058bc]">{item.initials}</span><div><h3 className="text-sm font-bold text-slate-800">{item.service}</h3><p className="mt-1 text-xs text-slate-500">{item.doctor}</p></div></div><p className="flex items-center gap-2 text-xs text-slate-500"><DashboardIcon name="calendar" className="h-4 w-4 text-slate-400"/>{item.date} · {item.time}</p><span className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-bold ${status.className}`}>{status.label}</span></article>; })}{history.length === 0 && <div className="p-12 text-center"><DashboardIcon name="calendar" className="mx-auto h-10 w-10 text-slate-300"/><p className="mt-3 text-sm text-slate-400">Không tìm thấy lịch hẹn phù hợp.</p></div>}</div></section>
  </main>;
}
