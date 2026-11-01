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
});
