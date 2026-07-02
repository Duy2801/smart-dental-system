import Image from "next/image";
import type { ClinicalImage } from "../types";
import { DashboardIcon } from "../../common/DashboardIcon";

export function ClinicalGallery({ images }: { images: ClinicalImage[] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-900">Hình ảnh cận lâm sàng</h2>
        <button type="button" className="text-xs font-semibold text-[#0863c5] hover:underline">
          Xem tất cả
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image) => (
          <article key={image.id} className="group relative h-32 overflow-hidden rounded-xl bg-slate-100 sm:h-36">
            <Image
              src={image.image}
              alt={image.imageAlt}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
              <p className="text-[10px] font-bold uppercase tracking-wide">{image.title}</p>
              <p className="mt-0.5 text-[9px] text-white/70">{image.subtitle}</p>
            </div>
          </article>
        ))}
        <button
          type="button"
          className="grid h-32 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#0863c5] sm:h-36"
        >
          <span className="text-center">
            <DashboardIcon name="document" className="mx-auto h-6 w-6" />
            <span className="mt-2 block text-[10px] font-semibold">Tải ảnh mới</span>
          </span>
        </button>
      </div>
    </section>
  );
}
