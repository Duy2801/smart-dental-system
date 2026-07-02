import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardIcon } from "@/components/dashboard/common/DashboardIcon";
import { DoctorContactPanel } from "@/components/dashboard/home";
import { doctorProfiles } from "@/components/dashboard/home/doctorProfiles";

type DoctorPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return doctorProfiles.map(doctor => ({ slug: doctor.slug }));
}

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doctor = doctorProfiles.find(item => item.slug === slug);
  return { title: doctor ? `${doctor.name} | Smart Dental` : "Không tìm thấy bác sĩ", description: doctor?.biography };
}

export default async function DoctorDetailPage({ params }: DoctorPageProps) {
  const { slug } = await params;
  const doctor = doctorProfiles.find(item => item.slug === slug);
  if (!doctor) notFound();

  return <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
    <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500"><Link href="/home" className="hover:text-[#0058bc]">Trang chủ</Link><span>/</span><span>Đội ngũ bác sĩ</span><span>/</span><span className="font-semibold text-slate-800">{doctor.name}</span></nav>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="grid lg:grid-cols-[360px_1fr]"><div className={`relative grid min-h-[420px] place-items-center overflow-hidden bg-gradient-to-br ${doctor.tone}`}><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,.3),transparent_45%)]"/><DashboardIcon name="user" className="absolute -bottom-8 h-96 w-96 text-white/15"/><span className="relative grid h-28 w-28 place-items-center rounded-full border-2 border-white/30 bg-white/15 text-3xl font-extrabold text-white backdrop-blur">{doctor.initials}</span><div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur"><p className="text-xs text-white/70">Nơi công tác</p><p className="mt-1 text-sm font-bold">{doctor.workplace}</p></div></div><div className="p-7 sm:p-10"><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0058bc]">{doctor.title}</span><h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#0058bc] sm:text-4xl">{doctor.name}</h1><p className="mt-3 text-base text-slate-600"><strong className="text-slate-900">Chức vụ:</strong> {doctor.position}</p><p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">{doctor.biography}</p><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-blue-50 p-4"><strong className="text-2xl text-[#0058bc]">{doctor.patientCount.toLocaleString("vi-VN")}+</strong><p className="mt-1 text-[11px] text-slate-500">Khách hàng đã khám</p></div><div className="rounded-2xl bg-emerald-50 p-4"><strong className="text-2xl text-emerald-600">{doctor.satisfaction}%</strong><p className="mt-1 text-[11px] text-slate-500">Đánh giá hài lòng</p></div><div className="rounded-2xl bg-amber-50 p-4"><strong className="text-2xl text-amber-500">★ {doctor.rating}</strong><p className="mt-1 text-[11px] text-slate-500">{doctor.reviewCount} đánh giá</p></div><div className="rounded-2xl bg-violet-50 p-4"><strong className="text-2xl text-violet-600">{doctor.experience.split(" ")[0]}</strong><p className="mt-1 text-[11px] text-slate-500">Năm kinh nghiệm</p></div></div></div></div></section>

    <div className="mt-7 grid items-start gap-7 lg:grid-cols-[1fr_380px]"><div className="space-y-7"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="flex items-center gap-3 text-xl font-bold text-slate-900"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0058bc]"><DashboardIcon name="sparkles" className="h-5 w-5"/></span>Chuyên môn điều trị</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{doctor.skills.map(skill => <div key={skill} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-700"><span className="text-emerald-500">✓</span>{skill}</div>)}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="flex items-center gap-3 text-xl font-bold text-slate-900"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0058bc]"><DashboardIcon name="document" className="h-5 w-5"/></span>Chứng chỉ & Văn bằng</h2><ol className="mt-6 space-y-4">{doctor.certificates.map((certificate,index) => <li key={certificate} className="flex gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0058bc] text-xs font-bold text-white">{index + 1}</span><div className="border-b border-slate-100 pb-4 text-sm leading-6 text-slate-600">{certificate}</div></li>)}</ol></section></div><aside className="lg:sticky lg:top-24"><DoctorContactPanel doctor={doctor}/></aside></div>
  </main>;
}
