type DayData = {
  day: string;
  count: number;
};

type AppointmentsChartProps = {
  data: DayData[];
};

export function AppointmentsChart({ data }: AppointmentsChartProps) {
  const maxCount = Math.max(...data.map((item) => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-base font-semibold text-brand-dark">
        Lịch hẹn 7 ngày qua
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tổng {total} lịch hẹn
      </p>

      {total === 0 ? (
        <div className="mt-6 flex h-44 items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
          Chưa có lịch hẹn trong 7 ngày gần nhất.
        </div>
      ) : null}

      {total > 0 ? (
        <div className="mt-6 grid h-52 grid-cols-7 items-end gap-3">
          {data.map((item) => {
            const heightPercent =
              maxCount > 0 ? (item.count / maxCount) * 100 : 0;

            return (
              <div
                key={item.day}
                className="flex h-full min-w-0 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-medium text-brand-dark">
                  {item.count}
                </span>
                <div className="flex h-32 w-full items-end rounded-t-md bg-brand-light/40">
                  <div
                    className="w-full rounded-t-md bg-brand transition-all"
                    style={{
                      height: `${heightPercent}%`,
                      minHeight: heightPercent > 0 ? "8px" : "0",
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
