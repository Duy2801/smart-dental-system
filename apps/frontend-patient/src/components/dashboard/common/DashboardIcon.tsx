import type { ReactNode } from "react";

export type DashboardIconName =
  | "appointment"
  | "arrow"
  | "bell"
  | "braces"
  | "calendar"
  | "chat"
  | "chevron"
  | "clock"
  | "cleaning"
  | "checkup"
  | "document"
  | "heart"
  | "home"
  | "grid"
  | "implant"
  | "mail"
  | "search"
  | "shield"
  | "sparkles"
  | "send"
  | "extraction"
  | "tooth"
  | "rootCanal"
  | "user";

type DashboardIconProps = {
  name: DashboardIconName;
  className?: string;
};

export function DashboardIcon({ name, className = "h-5 w-5" }: DashboardIconProps) {
  const toothShape = "M7.2 3.8c2-1 3.6.4 4.8.4s2.8-1.4 4.8-.4c3.5 1.8 2.2 6.7 1 9.7-1.4 3.7-2.1 7.5-4.2 7.5-1.6 0-.4-6-1.6-6s0 6-1.6 6c-2.1 0-2.8-3.8-4.2-7.5-1.2-3-2.5-7.9 1-9.7Z";
  const paths: Record<DashboardIconName, ReactNode> = {
    appointment: <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm4 8 2 2 4-4" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4" />,
    braces: (
      <>
        <path d={toothShape} />
        <path d="M7 10.5h10M8.5 9v3m3.5-3v3m3.5-3v3" strokeWidth="1.4" />
      </>
    ),
    calendar: <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />,
    chat: <path d="M5 18.5 3.5 21l4.2-1.4A9 9 0 1 0 5 18.5Zm3-7h8m-8 4h5" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2" />,
    cleaning: (
      <>
        <path d={toothShape} />
        <path d="m18 3 .5 1.5L20 5l-1.5.5L18 7l-.5-1.5L16 5l1.5-.5L18 3Z" />
      </>
    ),
    checkup: (
      <>
        <path d={toothShape} />
        <path d="m8.5 11.5 2 2 4.5-4.5" strokeWidth="2" />
      </>
    ),
    document: <path d="M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6m-6 4h6" />,
    heart: <path d="M20.5 9.2c0 5.1-8.5 10-8.5 10s-8.5-4.9-8.5-10A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8Z" />,
    implant: (
      <>
        <path d="M8 4c1.7-1.2 2.8.3 4 .3s2.3-1.5 4-.3c2.2 1.6 1.3 5.6.4 7.6-.8 1.7-1.5 2.4-2.3 2.7H9.9c-.8-.3-1.5-1-2.3-2.7C6.7 9.6 5.8 5.6 8 4Z" />
        <path d="M10 14.5h4M10.5 17h3M11 19.5h2M12 14.5V22" />
      </>
    ),
    grid: <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />,
    mail: <path d="M4 6h16v12H4V6Zm.5.5L12 13l7.5-6.5" />,
    home: <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z" />,
    search: <path d="m20 20-4.5-4.5M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />,
    shield: <path d="M12 3 5 6v5.5c0 4.5 2.8 7.5 7 9.5 4.2-2 7-5 7-9.5V6l-7-3Zm-3 9 2 2 4-4" />,
    sparkles: <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Zm6 10 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13ZM6 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />,
    send: <path d="m3 11 18-8-8 18-2-8-8-2Zm8 2 4-4" />,
    extraction: (
      <>
        <path d={toothShape} />
        <path d="m4 20 5-5m6-6 5-5M6 18l-2-2m16-8-2-2" strokeWidth="2" />
      </>
    ),
    tooth: <path d={toothShape} />,
    rootCanal: (
      <>
        <path d={toothShape} />
        <path d="M12 7v9m-2-6 2 2 2-2" strokeWidth="1.5" />
      </>
    ),
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9c.7-4.3 3.4-6.5 8-6.5s7.3 2.2 8 6.5" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
