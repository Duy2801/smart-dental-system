type DayData = {
  day: string;
  count: number;
};

type AppointmentsChartProps = {
  data: DayData[];
};

export function AppointmentsChart({ data }: AppointmentsChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-base font-semibold text-brand-dark">
        Lịch hẹn 7 ngày qua
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tổng {data.reduce((sum, d) => sum + d.count, 0)} lịch hẹn
      </p>

      <div className="mt-6 flex h-44 items-end justify-between gap-2">
        {data.map((item) => {
          const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

          return (
            <div
              key={item.day}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-xs font-medium text-brand-dark">
                {item.count}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-brand transition-all"
                  style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0" }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
