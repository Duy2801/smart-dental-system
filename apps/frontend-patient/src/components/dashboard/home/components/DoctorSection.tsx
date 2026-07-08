import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";

export type Doctor = {
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  initials: string;
  tone: "blue" | "violet";
};

const avatarTones = {
  blue: "from-sky-100 to-blue-200 text-blue-700",
  violet: "from-violet-100 to-indigo-200 text-indigo-700",
};

export function DoctorSection({ doctors }: { doctors: Doctor[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-900">Đội ngũ chuyên gia</h2>
        <Link href="/service" className="text-sm font-semibold text-[#0863c5] hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {doctors.map((doctor) => (
          <article
            key={doctor.name}
            className="flex gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className={`relative grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br text-base font-bold ${avatarTones[doctor.tone]}`}>
              <DashboardIcon name="user" className="absolute -bottom-2 h-20 w-20 opacity-20" />
              <span className="relative">{doctor.initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="truncate text-base font-bold text-slate-900">{doctor.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{doctor.specialty}</p>
                </div>
                <span className="text-xs font-bold text-amber-500">★ {doctor.rating}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{doctor.experience} kinh nghiệm</p>
              <Link
                href="/appointment"
                className="mt-4 flex h-9 items-center justify-center gap-1 rounded-lg bg-[#0863c5] text-xs font-bold text-white hover:bg-[#0756aa]"
              >
                Đặt lịch ngay <DashboardIcon name="chevron" className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
