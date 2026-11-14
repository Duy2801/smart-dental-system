import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { OverviewPageContent } from "./overview-page-content";
import type { OverviewAppointment, OverviewDashboard } from "./types";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("@/src/components/layout/header", () => ({
  Header: () => <header />,
}));

const dashboard: OverviewDashboard = {
  statCards: [],
  appointmentsLast7Days: [],
  recentActivities: [],
  actionItems: [],
  todayAppointments: [],
  popularServices: [],
  reexamRate: { rate: 0, change: 0 },
};

function appointment(
  status: OverviewAppointment["status"],
): OverviewAppointment {
  return {
    id: status,
    start_time: "09:00",
    end_time: "09:30",
    patient_name: `Patient ${status}`,
    service_name: "Khám răng",
    doctor_name: "Bác sĩ A",
    status,
  };
}

describe("admin overview today schedule", () => {
  it("renders appointments waiting for cancellation approval", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        ...dashboard,
        todayAppointments: [appointment("CANCELLATION_REQUESTED")],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQuery>);

    render(<OverviewPageContent />);

    expect(
      screen.getByText("Patient CANCELLATION_REQUESTED"),
    ).toBeInTheDocument();
    expect(screen.getByText("Chờ xác nhận hủy")).toBeInTheDocument();
  });

  it("keeps the dashboard visible for an unfamiliar API status", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        ...dashboard,
        todayAppointments: [
          appointment("FUTURE_STATUS" as OverviewAppointment["status"]),
        ],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQuery>);

    render(<OverviewPageContent />);

    expect(screen.getByText("Patient FUTURE_STATUS")).toBeInTheDocument();
    expect(screen.getByText("FUTURE_STATUS")).toBeInTheDocument();
  });

  it("hides average rating cards and renders the 4 remaining stat cards", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        ...dashboard,
        statCards: [
          {
            label: "Doanh thu hôm nay",
            value: 0,
            suffix: "đ",
            trend: 0,
            trendLabel: "so với hôm qua",
            type: "currency",
          },
          {
            label: "Lịch khám hôm nay",
            value: 0,
            suffix: "ca",
            trend: 0,
            trendLabel: "so với hôm qua",
            type: "number",
          },
          {
            label: "Bệnh nhân mới",
            value: 0,
            suffix: "người",
            trend: 0,
            trendLabel: "so với hôm qua",
            type: "number",
          },
          {
            label: "Bác sĩ hoạt động",
            value: 9,
            suffix: "người",
            trend: 0,
            trendLabel: "đang hoạt động",
            type: "number",
          },
          {
            label: "Đánh giá trung bình",
            value: 0,
            suffix: "*",
            trend: 0,
            trendLabel: "điểm thang 10",
            type: "decimal",
          },
          {
            label: "Đánh giá sao",
            value: 4.5,
            suffix: "*",
            trend: 0,
            trendLabel: "điểm thang 10",
            type: "decimal",
            isStar: true,
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQuery>);

    render(<OverviewPageContent />);

    expect(screen.getByText("Doanh thu hôm nay")).toBeInTheDocument();
    expect(screen.getByText("Lịch khám hôm nay")).toBeInTheDocument();
    expect(screen.getByText("Bệnh nhân mới")).toBeInTheDocument();
    expect(screen.getByText("Bác sĩ hoạt động")).toBeInTheDocument();
    expect(screen.queryByText("Đánh giá trung bình")).not.toBeInTheDocument();
    expect(screen.queryByText("Đánh giá sao")).not.toBeInTheDocument();
  });
});
