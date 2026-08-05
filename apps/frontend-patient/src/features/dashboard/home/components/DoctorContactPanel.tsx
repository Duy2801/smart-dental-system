"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import { ROUTES } from "../../common/routes";
import { T } from "../../common/typography";

export type DoctorProfile = {
  name: string;
  initials: string;
  slots: string[];
};

export function DoctorContactPanel({ doctor }: { doctor: DoctorProfile }) {
  const [slot, setSlot] = useState(doctor.slots[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([`Xin chào, tôi là trợ lý của ${doctor.name}. Bạn muốn bác sĩ tư vấn vấn đề gì?`]);

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = message.trim();
    if (!content) return;
    setMessages(current => [...current, content]);
    setMessage("");
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-slate-900"><DashboardIcon name="calendar" className="h-5 w-5 text-[#0058bc]"/>Lịch hẹn đề xuất</h2><p className={`mt-2 ${T.bodySm}`}>Các khung giờ gần nhất bác sĩ còn trống.</p><div className="mt-4 space-y-2">{doctor.slots.map(time => <button key={time} onClick={() => setSlot(time)} className={`w-full rounded-xl border px-4 py-3 text-left text-xs font-bold transition ${slot === time ? "border-[#0058bc] bg-blue-50 text-[#0058bc] ring-2 ring-blue-100" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}>{time}</button>)}</div><Link href={`${ROUTES.appointment}?doctor=${encodeURIComponent(doctor.name)}&slot=${encodeURIComponent(slot)}`} className="mt-4 block rounded-xl bg-[#0058bc] px-5 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-200">Đặt lịch · {slot}</Link></section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-5"><span className="relative grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-xs font-bold text-[#0058bc]">{doctor.initials}<i className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"/></span><div><h2 className="text-sm font-bold text-slate-900">Trao đổi với bác sĩ</h2><p className={`text-[10px] text-emerald-600`}>Trực tuyến · Thường phản hồi trong 5 phút</p></div></div><div className="h-52 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((text,index) => <div key={`${text}-${index}`} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${index === 0 ? "rounded-tl-sm bg-white text-slate-600 shadow-sm" : "ml-auto rounded-tr-sm bg-[#0058bc] text-white"}`}>{text}</div>)}</div><form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-100 p-3"><input value={message} onChange={event => setMessage(event.target.value)} placeholder="Nhập câu hỏi cho bác sĩ..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-400"/><button aria-label="Gửi tin nhắn" className="grid h-10 w-10 place-items-center rounded-xl bg-[#0058bc] text-white"><DashboardIcon name="send" className="h-4 w-4"/></button></form></section>
  </div>;
}
