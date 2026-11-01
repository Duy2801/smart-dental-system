import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { OverviewPageContent } from "./overview-page-content";
import type { OverviewAppointment, OverviewDashboard } from "./types";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  keepPreviousData: vi.fn(),
}));
vi.mock("@/src/components/layout/header", () => ({
  Header: ({ children }: { children?: ReactNode }) => <header>{children}</header>,
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

  it("reloads the dashboard for the date chosen in the picker", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: dashboard,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQuery>);

    render(<OverviewPageContent />);
    expect(screen.getByText("Lịch trình hôm nay")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Chọn ngày xem tổng quan"), {
      target: { value: "2026-11-05" },
    });

    const lastCall = vi.mocked(useQuery).mock.calls.at(-1)?.[0] as {
      queryKey: unknown[];
    };
    expect(lastCall.queryKey).toEqual(["admin", "overview", "2026-11-05"]);
    expect(screen.getByText("Lịch trình ngày 05/11/2026")).toBeInTheDocument();
    expect(
      screen.getByText("Ngày 05/11/2026 không có lịch hẹn nào"),
    ).toBeInTheDocument();
  });
});
