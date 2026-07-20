import { DashboardIcon } from "../../common/DashboardIcon";

type RecordClinicalImageProps = {
  type: "xray" | "clinical";
  title: string;
};

export function RecordClinicalImage({ type, title }: RecordClinicalImageProps) {
  return (
    <div
      className={`relative grid aspect-square place-items-center overflow-hidden rounded-xl border border-slate-200 ${type === "xray" ? "bg-[#071d2d]" : "bg-gradient-to-br from-rose-100 via-white to-blue-100"}`}
    >
      <div
        className={`absolute inset-0 ${type === "xray" ? "bg-[radial-gradient(circle_at_50%_50%,rgba(103,232,249,.2),transparent_55%)]" : ""}`}
      />
      {type === "xray" ? (
        <DashboardIcon name="tooth" className="h-20 w-20 text-cyan-100/55" />
      ) : (
        <div className="flex rounded-[50%] border-[7px] border-rose-200 bg-rose-100 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-8 w-4 rounded-b-lg bg-white shadow" />
          ))}
        </div>
      )}
      <span className="absolute bottom-2 right-2 rounded bg-black/55 px-2 py-1 text-[9px] font-bold text-white">
        {title}
      </span>
    </div>
  );
}
