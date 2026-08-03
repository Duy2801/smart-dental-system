import type { NotificationPreferences } from "../../types";
import type { DashboardIconName } from "../../../common/DashboardIcon";
import { DashboardIcon } from "../../../common/DashboardIcon";

type NotificationSettingsProps = {
  value: NotificationPreferences;
  onChange: (key: keyof NotificationPreferences) => void;
};

const settings: Array<{
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: DashboardIconName;
}> = [
  {
    key: "email",
    title: "Email nhắc hẹn",
    description: "Gửi trước 24 giờ",
    icon: "mail",
  },
  {
    key: "app",
    title: "Thông báo ứng dụng",
    description: "Thông báo tức thời",
    icon: "bell",
  },
  {
    key: "sms",
    title: "Tin nhắn SMS",
    description: "Dành cho lịch khẩn",
    icon: "chat",
  },
];

export function NotificationSettings({
  value,
  onChange,
}: NotificationSettingsProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-900">
        Cài đặt thông báo
      </h2>
      <div className="mt-4 divide-y divide-slate-100">
        {settings.map((setting) => (
          <div
            key={setting.key}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-[#0863c5]">
              <DashboardIcon name={setting.icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-700">
                {setting.title}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {setting.description}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={value[setting.key]}
              onClick={() => onChange(setting.key)}
              className={`relative h-6 w-11 rounded-full transition ${
                value[setting.key] ? "bg-[#0863c5]" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                  value[setting.key] ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
