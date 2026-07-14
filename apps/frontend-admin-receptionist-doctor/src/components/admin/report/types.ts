export type ReportStatType = "currency" | "number" | "percentage" | "decimal";

export type ReportStatCard = {
  label: string;
  value: number;
  type: ReportStatType;
  trend: number;
  trendLabel: string;
};

export type RevenueChartItem = {
  label: string;
  value: number;
};

export type TopService = {
  name: string;
  revenue: number;
};

export type BookingSource = {
  count: number;
  percentage: number;
};

export type BookingSources = {
  total: number;
  online: BookingSource;
  walkIn: BookingSource;
  aiChatbot: BookingSource;
};

export type ReportTimeFilter =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year";

export type ReportOverview = {
  statCards: ReportStatCard[];
  revenueChartData: RevenueChartItem[];
  topServices: TopService[];
  bookingSources: BookingSources;
  period: {
    start: string;
    end: string;
  };
};
