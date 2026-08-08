import type { Dentist } from "../../types";

const tones = {
  blue: "from-blue-100 to-sky-200 text-blue-700",
  cyan: "from-cyan-100 to-teal-200 text-teal-700",
  violet: "from-violet-100 to-indigo-200 text-indigo-700",
};

type DoctorSelectorProps = {
  doctors: Dentist[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function DoctorSelector({
  doctors,
  selectedId,
  onSelect,
}: DoctorSelectorProps) {
  return (
    <fieldset>
      <legend className="sr-only">Chọn bác sĩ</legend>
      {doctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Không có bác sĩ trong khung giờ này. Vui lòng chọn ngày hoặc giờ khác.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {doctors.map((doctor) => {
          const selected = selectedId === doctor.id;
          return (
            <button
              key={doctor.id}
              type="button"
              onClick={() => onSelect(doctor.id)}
              aria-pressed={selected}
              className={`relative flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                selected
                  ? "border-[#0863c5] bg-blue-50/60 ring-2 ring-blue-100"
                  : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              }`}
            >
              <span
                className={`grid h-16 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xs font-bold ${tones[doctor.tone]}`}
              >
                {doctor.initials}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm text-slate-900">
                  {doctor.name}
                </strong>
                <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                  {doctor.specialty}
                </span>
                <span className="mt-2 block text-[10px] font-semibold text-amber-500">
                  {doctor.experience} kinh nghiệm
                </span>
              </span>
              <span
                className={`absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border-2 ${
                  selected ? "border-[#0863c5]" : "border-slate-300"
                }`}
              >
                {selected ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0863c5]" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
