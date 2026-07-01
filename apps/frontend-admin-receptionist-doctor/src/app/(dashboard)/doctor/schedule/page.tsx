"use client";

import { useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";

type ViewMode = "week" | "list";
type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

// --- Mock Data chuẩn db.md ---
const weekDays = [
  { date: "24/06", day: "Thứ 2" },
  { date: "25/06", day: "Thứ 3" },
  { date: "26/06", day: "Thứ 4" },
  { date: "27/06", day: "Thứ 5", isToday: true },
  { date: "28/06", day: "Thứ 6" },
  { date: "29/06", day: "Thứ 7" },
  { date: "30/06", day: "Chủ Nhật" },
];

// Tạo danh sách giờ từ 08:00 đến 20:00
const hours = Array.from({ length: 13 }, (_, i) => i + 8); 

// Bảng doctor_availability: record_type = 'SCHEDULE'
const mockAvailability = [
  { dayIdx: 0, startHour: 8, endHour: 17 }, // Thứ 2: 8h-17h
  { dayIdx: 1, startHour: 8, endHour: 17 }, // Thứ 3: 8h-17h
  { dayIdx: 2, startHour: 13, endHour: 20 }, // Thứ 4: 13h-20h
  { dayIdx: 3, startHour: 8, endHour: 17 }, // Thứ 5: 8h-17h
  { dayIdx: 4, startHour: 8, endHour: 12 }, // Thứ 6: 8h-12h
  { dayIdx: 5, startHour: 8, endHour: 12 }, // Thứ 7: 8h-12h
];

// Bảng appointments
const mockAppointments = [
  { id: "1", dayIdx: 0, startHour: 8, duration: 1, patient: "Nguyễn Văn A", service: "Khám tổng quát", status: "COMPLETED" },
  { id: "2", dayIdx: 0, startHour: 9.5, duration: 1.5, patient: "Trần Thị B", service: "Nhổ răng khôn", status: "COMPLETED" },
  { id: "3", dayIdx: 1, startHour: 10, duration: 1, patient: "Phạm Dũng", service: "Tái khám niềng răng", status: "CONFIRMED" },
  { id: "4", dayIdx: 3, startHour: 14, duration: 1.5, patient: "Hoàng Oanh", service: "Cấy ghép Implant", status: "PENDING" },
  { id: "5", dayIdx: 4, startHour: 8.5, duration: 1, patient: "Lê Cường", service: "Tẩy trắng răng", status: "CONFIRMED" },
];

const statusConfig: Record<AppointmentStatus, { label: string, color: string, border: string, ring: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-amber-50 text-amber-700", border: "border-l-amber-500", ring: "ring-1 ring-inset ring-amber-600/20" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-700", border: "border-l-blue-500", ring: "ring-1 ring-inset ring-blue-600/20" },
  COMPLETED: { label: "Đã hoàn thành", color: "bg-green-50 text-green-700", border: "border-l-green-500", ring: "ring-1 ring-inset ring-green-600/20" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-50 text-red-700", border: "border-l-red-500", ring: "ring-1 ring-inset ring-red-600/10" },
  NO_SHOW: { label: "Không đến", color: "bg-gray-50 text-gray-700", border: "border-l-gray-500", ring: "ring-1 ring-inset ring-gray-600/20" },
};

export default function DoctorSchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  return (
    <>
      <Header
        title="Lịch làm việc của tôi"
        description="Quản lý ca trực và lịch hẹn với bệnh nhân"
      >
        <button 
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98] shadow-sm ml-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Đăng ký ngày nghỉ
        </button>
      </Header>

      <div className="space-y-6 p-6 md:p-8">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-1">
            <button
              onClick={() => setViewMode("week")}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", viewMode === "week" ? "bg-white text-brand-dark shadow-sm" : "text-muted-foreground hover:text-brand-dark")}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", viewMode === "list" ? "bg-white text-brand-dark shadow-sm" : "text-muted-foreground hover:text-brand-dark")}
            >
              Danh Sách
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-brand-dark">
            <button className="p-1 hover:bg-muted rounded text-muted-foreground">&lt;</button>
            24/06 - 30/06, 2026
            <button className="p-1 hover:bg-muted rounded text-muted-foreground">&gt;</button>
          </div>
        </div>

        {/* Weekly Calendar View */}
        {viewMode === "week" && (
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col h-[700px]">
            
            {/* Header: Days of week */}
            <div className="grid grid-cols-8 border-b border-border bg-slate-50/50">
              <div className="border-r border-border p-4 flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">Giờ (GMT+7)</span>
              </div>
              {weekDays.map((day, i) => (
                <div key={i} className="border-r border-border/40 p-4 text-center last:border-r-0">
                  <span className={cn("text-[11px] font-medium uppercase tracking-wider", day.isToday ? "text-brand" : "text-muted-foreground")}>{day.day}</span>
                  <div className={cn("mt-1 text-sm font-bold", day.isToday ? "text-brand" : "text-slate-900")}>{day.date}</div>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto relative bg-white">
              <div 
                className="grid grid-cols-8"
                style={{
                  gridTemplateRows: `repeat(${hours.length * 2}, minmax(30px, 1fr))`, // 30 mins per row
                }}
              >
                {/* Time labels (Column 1) */}
                {hours.map((hour, idx) => (
                  <div 
                    key={hour} 
                    className="col-start-1 border-r border-b border-border/30 text-right pr-3 pt-1 text-[11px] font-mono text-muted-foreground/60 bg-white"
                    style={{ gridRow: `${idx * 2 + 1} / span 2` }}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}

                {/* Day Columns & Grid Lines */}
                {weekDays.map((_, dayIdx) => (
                  <div 
                    key={`col-${dayIdx}`} 
                    className="border-r border-border/30 last:border-r-0 relative"
                    style={{ gridColumn: dayIdx + 2, gridRow: `1 / span ${hours.length * 2}` }}
                  >
                    {/* Render grid lines for each hour inside the column */}
                    {hours.map((_, hIdx) => (
                      <div key={hIdx} className="h-[60px] border-b border-border/30 w-full" />
                    ))}
                  </div>
                ))}

                {/* Background Blocks: Doctor Availability (Ca trực) */}
                {mockAvailability.map((avail, idx) => (
                  <div
                    key={`avail-${idx}`}
                    className="bg-slate-50/40 border-x border-dashed border-border/30 mx-[1px]"
                    style={{
                      gridColumn: avail.dayIdx + 2,
                      gridRow: (avail.startHour - 8) * 2 + 1,
                      gridRowEnd: `span ${(avail.endHour - avail.startHour) * 2}`
                    }}
                  />
                ))}

                {/* Event Cards: Appointments */}
                {mockAppointments.map((apt) => {
                  const config = statusConfig[apt.status as AppointmentStatus];
                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "m-1 p-2.5 rounded-xl shadow-sm text-xs flex flex-col gap-0.5 overflow-hidden transition-all duration-200 hover:shadow-md hover:z-10 hover:-translate-y-0.5 cursor-pointer relative",
                        config.color,
                        config.ring
                      )}
                      style={{
                        gridColumn: apt.dayIdx + 2,
                        gridRow: (apt.startHour - 8) * 2 + 1,
                        gridRowEnd: `span ${apt.duration * 2}`
                      }}
                      title={`${apt.patient} - ${apt.service}`}
                    >
                      <span className="font-mono text-[10px] opacity-70 truncate leading-none mb-0.5">
                        {apt.startHour.toString().replace('.5', ':30').includes(':') ? apt.startHour.toString().replace('.5', ':30') : apt.startHour + ':00'} - {(apt.startHour + apt.duration).toString().replace('.5', ':30').includes(':') ? (apt.startHour + apt.duration).toString().replace('.5', ':30') : (apt.startHour + apt.duration) + ':00'}
                      </span>
                      <span className="font-semibold truncate text-[13px] leading-tight text-slate-900">{apt.patient}</span>
                      <span className="truncate text-[11px] opacity-80 leading-tight">{apt.service}</span>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="rounded-2xl border border-border bg-white shadow-sm flex flex-col">
            
            {/* List Toolbar */}
            <div className="border-b border-border p-4 sm:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 rounded-t-2xl">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative w-full max-w-xs">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc SĐT..."
                    className="w-full rounded-md border border-border py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
                <select className="rounded-md border border-border py-1.5 px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="COMPLETED">Đã khám</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm text-brand-dark font-medium border border-border rounded-md px-3 py-1.5 bg-white">
                <svg className="w-4 h-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                Hôm nay, 27/06
              </div>
            </div>

            {/* High-Density List */}
            <div className="divide-y divide-border/40">
              {mockAppointments.map((apt) => {
                const config = statusConfig[apt.status as AppointmentStatus];
                const startTimeStr = apt.startHour.toString().replace('.5', ':30');
                const endTimeStr = (apt.startHour + apt.duration).toString().replace('.5', ':30');
                const isConfirmed = apt.status === "CONFIRMED";
                const isCompleted = apt.status === "COMPLETED";

                return (
                  <div key={apt.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 transition-colors duration-200 hover:bg-slate-50/70 gap-4 bg-white">
                    
                    {/* Time & Patient Info */}
                    <div className="flex items-start gap-6 sm:w-2/5 shrink-0">
                      <div className="flex flex-col text-sm w-20 shrink-0">
                        <span className="font-mono font-bold text-brand-dark">{startTimeStr.includes(':') ? startTimeStr : startTimeStr + ':00'}</span>
                        <span className="font-mono text-muted-foreground">{endTimeStr.includes(':') ? endTimeStr : endTimeStr + ':00'}</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{apt.patient}</span>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md border border-border/40">P{apt.id.padStart(3, '0')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          090{Math.floor(Math.random() * 10000000)}
                        </div>
                      </div>
                    </div>

                    {/* Service & Note */}
                    <div className="flex flex-col gap-1 sm:w-1/4 shrink-0">
                      <span className="text-sm font-medium text-slate-900">{apt.service}</span>
                      <span className="text-xs text-muted-foreground italic truncate" title="Bệnh nhân báo sẽ đến sớm">
                        "Bệnh nhân hẹn {startTimeStr.includes(':') ? startTimeStr : startTimeStr + ':00'}"
                      </span>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3 shrink-0">
                      <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider", config.color, config.ring)}>
                        {config.label}
                      </span>
                      
                      <div className="w-[120px] flex justify-end">
                        {isConfirmed && (
                          <button className="rounded-lg bg-brand px-5 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-brand-dark hover:shadow-sm active:scale-[0.98]">
                            Khám ngay
                          </button>
                        )}
                        {isCompleted && (
                          <button className="rounded-lg border border-border bg-white px-5 py-2 text-xs font-medium text-brand-dark transition-all duration-200 hover:bg-slate-50 hover:shadow-sm opacity-50 group-hover:opacity-100 active:scale-[0.98]">
                            Xem hồ sơ
                          </button>
                        )}
                        {(!isConfirmed && !isCompleted) && (
                          <span className="pr-3 text-xs text-muted-foreground font-medium opacity-50 group-hover:opacity-100 transition-opacity">Chưa bắt đầu</span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-border bg-slate-50/30 p-4 sm:px-6 text-center text-xs text-muted-foreground rounded-b-2xl">
              Đang hiển thị {mockAppointments.length} ca khám trong ngày 27/06.
            </div>
          </div>
        )}

      </div>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowLeaveModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-brand-dark">Đăng ký ngày nghỉ</h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-muted-foreground hover:text-brand-dark">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setShowLeaveModal(false); }}>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-dark">Ngày xin nghỉ</label>
                <input type="date" required className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Từ giờ</label>
                  <input type="time" required className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Đến giờ</label>
                  <input type="time" required className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-dark">Lý do nghỉ</label>
                <textarea rows={3} placeholder="Ví dụ: Bận việc gia đình, đi hội thảo chuyên môn..." required className="resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
              </div>

              <div className="mt-4 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted">
                  Hủy
                </button>
                <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark">
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
