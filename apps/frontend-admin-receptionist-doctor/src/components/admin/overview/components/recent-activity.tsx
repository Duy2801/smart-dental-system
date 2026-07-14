type ActivityType = "appointment" | "patient" | "payment";

type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
};

function ActivityIcon({ type }: { type: ActivityType }) {
  const className = "h-4 w-4 text-brand";

  switch (type) {
    case "appointment":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
      );
    case "patient":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
          />
        </svg>
      );
    case "payment":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
          />
        </svg>
      );
  }
}

type RecentActivityProps = {
  activities: Activity[];
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-base font-semibold text-brand-dark">
        Hoạt động gần đây
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Cập nhật mới nhất từ hệ thống
      </p>

      <ul className="mt-5 divide-y divide-border">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light">
              <ActivityIcon type={activity.type} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-dark">
                {activity.title}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {activity.description}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {activity.time}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
