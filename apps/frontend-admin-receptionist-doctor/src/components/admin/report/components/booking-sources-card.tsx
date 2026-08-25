import type { BookingSources } from "../types";

type BookingSourcesCardProps = {
  sources: BookingSources;
};

export function BookingSourcesCard({ sources }: BookingSourcesCardProps) {
  const sourceItems = [
    {
      label: "Đặt qua Web/App (Online)",
      color: "bg-brand",
      value: sources.online,
    },
    {
      label: "Đến trực tiếp (Walk-in)",
      color: "bg-orange-400",
      value: sources.walkIn,
    },
    {
      label: "AI Chatbot gợi ý",
      color: "bg-purple-500",
      value: sources.aiChatbot,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-base font-semibold text-brand-dark">
        Nguồn khách hàng (Lịch hẹn)
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Tổng {sources.total} lịch hẹn
      </p>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {sourceItems.map((item) => (
          <div
            key={item.label}
            className={`${item.color} transition-all`}
            style={{ width: `${item.value.percentage}%` }}
            title={item.label}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap justify-between gap-4 sm:grid sm:grid-cols-3">
        {sourceItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${item.color}`} />
            <div>
              <p className="text-sm font-medium text-brand-dark">
                {item.label}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="font-mono text-lg font-semibold text-brand-dark">
                  {item.value.percentage}%
                </p>
                <p className="text-xs text-muted-foreground">
                  ({item.value.count} ca)
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
