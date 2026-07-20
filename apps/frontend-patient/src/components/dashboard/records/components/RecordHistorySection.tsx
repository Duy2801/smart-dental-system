import type { TreatmentRecordView } from "./recordMappers";
import { RecordTreatmentCard } from "./RecordTreatmentCard";

type RecordHistorySectionProps = {
  treatments: TreatmentRecordView[];
};

export function RecordHistorySection({
  treatments,
}: RecordHistorySectionProps) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0058bc]">
            Hành trình chăm sóc
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Lịch sử điều trị
          </h2>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="hidden sm:inline">Lọc theo</span>
          <select
            aria-label="Lọc theo loại điều trị"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-[#0058bc] outline-none focus:border-blue-400"
          >
            <option>Tất cả điều trị</option>
            <option>Implant</option>
            <option>Chỉnh nha</option>
            <option>Nội nha</option>
            <option>Nha khoa thẩm mỹ</option>
          </select>
        </label>
      </div>
      <div>
        {treatments.length ? (
          treatments.map((treatment, index) => (
            <RecordTreatmentCard
              key={treatment.id}
              treatment={treatment}
              index={index}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Chưa có dữ liệu điều trị.
          </div>
        )}
      </div>
    </section>
  );
}
