import Link from "next/link";
import type { AppointmentReminder } from "../types";
import { DashboardIcon } from "../../common/DashboardIcon";

export function ReminderCard({ reminder }: { reminder: AppointmentReminder }) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#0863c5] to-[#064b9c] p-5 text-white shadow-lg shadow-blue-100">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-100">
        <DashboardIcon name="bell" className="h-4 w-4" /> Nhắc nhở quan trọng
      </p>
      <h2 className="mt-3 text-xl font-bold">Tái khám lành thương</h2>
      <p className="mt-2 text-xs leading-5 text-blue-100">
        Bác sĩ {reminder.doctor} đang chờ bạn để kiểm tra tình trạng tích hợp trụ.
      </p>
      <div className="mt-5 flex items-center gap-4 rounded-xl bg-white/10 p-4">
        <div className="rounded-lg bg-white/15 px-3 py-2 text-center">
          <span className="block text-[9px] font-bold uppercase">{reminder.month}</span>
          <strong className="text-2xl leading-none">{reminder.day}</strong>
        </div>
        <div>
          <p className="text-sm font-bold">{reminder.time}</p>
          <p className="mt-1 text-[10px] text-blue-100">{reminder.room}</p>
        </div>
      </div>
      <Link
        href="/appointment"
        className="mt-4 flex h-10 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#0863c5] hover:bg-blue-50"
      >
        Xác nhận lịch hẹn
      </Link>
    </section>
  );
}
