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
    <div
      className={`relative grid aspect-square place-items-center overflow-hidden rounded-2xl border border-slate-200 ${type === "xray" ? "bg-[#071d2d]" : "bg-gradient-to-br from-rose-50 via-white to-blue-50"}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className={`absolute inset-0 ${type === "xray" ? "bg-[radial-gradient(circle_at_50%_50%,rgba(103,232,249,.2),transparent_55%)]" : ""}`}
          />
          {type === "xray" ? (
            <div className="grid place-items-center text-center">
              <DashboardIcon name="tooth" className="mx-auto h-16 w-16 text-cyan-100/55" />
              <p className="mt-2 text-[10px] font-semibold text-cyan-100/70">
                Chưa có ảnh
              </p>
            </div>
          ) : (
            <div className="grid place-items-center text-center">
              <div className="flex rounded-[50%] border-[7px] border-rose-200 bg-rose-100 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="h-8 w-4 rounded-b-lg bg-white shadow" />
                ))}
              </div>
              <p className="mt-2 text-[10px] font-semibold text-slate-400">
                Chưa có ảnh
              </p>
            </div>
          )}
        </>
      )}
      <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-bold text-white">
        {title}
      </span>
    </div>
  );
}
