export type OverviewStatType = "currency" | "decimal" | "number";

export type OverviewStatCard = {
  label: string;
  value: number;
  suffix: string;
  trend: number;
  trendLabel: string;
  type: OverviewStatType;
  isStar?: boolean;
};

export type OverviewChartItem = {
  day: string;
  count: number;
};

export type OverviewActivity = {
  id: string;
  type: "appointment" | "patient" | "payment";
  title: string;
  description: string;
  time: string;
};

export type OverviewActionItem = {
  id: string;
  title: string;
  desc: string;
  time: string;
  action: string;
  href: string;
};

export type OverviewAppointment = {
  id: string;
  start_time: string;
  end_time: string;
  patient_name: string;
  service_name: string;
  doctor_name: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "CHECKED_IN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW"
    | "RESCHEDULED";
};

export type OverviewPopularService = {
  name: string;
  count: number;
  percent: number;
};

export type OverviewReexamRate = {
  rate: number;
  change: number;
};

export type OverviewDashboard = {
  statCards: OverviewStatCard[];
  appointmentsLast7Days: OverviewChartItem[];
  recentActivities: OverviewActivity[];
  actionItems: OverviewActionItem[];
  todayAppointments: OverviewAppointment[];
  popularServices: OverviewPopularService[];
  reexamRate: OverviewReexamRate;
};
