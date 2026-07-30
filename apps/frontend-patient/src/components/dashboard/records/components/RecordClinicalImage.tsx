import Image from "next/image";
import { DashboardIcon } from "../../common/DashboardIcon";

type RecordClinicalImageProps = {
  type: "xray" | "clinical";
  title: string;
  imageUrl?: string | null;
};

export function RecordClinicalImage({
  type,
  title,
  imageUrl,
}: RecordClinicalImageProps) {
  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="relative aspect-square bg-slate-50">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <DashboardIcon
                name={type === "xray" ? "tooth" : "document"}
                className="mx-auto h-12 w-12 text-slate-300"
              />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Chưa có ảnh
              </p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-white/90 px-3 py-2 backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}
