import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import ReceptionistDashboard from "./page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));
vi.mock("@/src/components/layout/header", () => ({
  Header: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/src/providers/app-dialog-provider", () => ({
  useAppDialog: () => ({ showConfirm: vi.fn().mockResolvedValue(true) }),
}));
vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);

describe("ReceptionistDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({
      data: [
        {
          id: "future",
          appointmentCode: "APT-FUTURE",
          scheduledAt: "2099-09-09T02:00:00.000Z",
          status: "CONFIRMED",
          patient: { id: "patient-1", fullName: "Nguyễn An" },
        },
        {
          id: "checked-in",
          appointmentCode: "APT-CHECKED-IN",
          scheduledAt: "2026-09-09T02:00:00.000Z",
          status: "CHECKED_IN",
          patient: { id: "patient-2", fullName: "Trần Bình" },
        },
        {
          id: "completed",
          appointmentCode: "APT-COMPLETED",
          scheduledAt: "2026-09-09T03:00:00.000Z",
          status: "COMPLETED",
          paymentStatus: "PAY_AT_COUNTER_SELECTED",
          invoices: [{ id: "invoice-open", status: "ISSUED" }],
          patient: { id: "patient-3", fullName: "Lê Chi" },
        },
      ],
    } as never);
    mockedApi.patch.mockResolvedValue({ data: {} } as never);
  });

  it("names the clinical transition accurately", async () => {
    render(<ReceptionistDashboard />);
    const start = await screen.findByRole("button", { name: "Bắt đầu khám" });

    fireEvent.click(start);

    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith(
        "/appointments/checked-in/start",
        undefined,
      ),
    );
    expect(screen.queryByText("Nhắc BS")).not.toBeInTheDocument();
  });

  it("does not offer no-show before the appointment time", async () => {
    render(<ReceptionistDashboard />);
    const futureRow = await screen.findByRole("group", { name: "Lịch hẹn APT-FUTURE" });
    fireEvent.click(within(futureRow).getByLabelText("Tùy chọn"));

    expect(screen.queryByText("Đánh dấu vắng mặt")).not.toBeInTheDocument();
  });

  it("links collection to the appointment open invoice", async () => {
    render(<ReceptionistDashboard />);

    expect(await screen.findByRole("link", { name: "Thu tiền" })).toHaveAttribute(
      "href",
      "/receptionist/billing?invoiceId=invoice-open",
    );
  });

  it("records that the patient requested cancellation", async () => {
    render(<ReceptionistDashboard />);
    const futureRow = await screen.findByRole("group", { name: "Lịch hẹn APT-FUTURE" });
    fireEvent.click(within(futureRow).getByLabelText("Tùy chọn"));
    fireEvent.click(screen.getByText("Khách báo hủy"));

    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith(
        "/appointments/future/cancel",
        { reason: "Bệnh nhân yêu cầu hủy" },
      ),
    );
  });

  it("keeps current data visible during a background refresh", async () => {
    render(<ReceptionistDashboard />);
    await screen.findByText("Nguyễn An");
    mockedApi.get.mockReturnValue(new Promise(() => {}) as never);

    fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));

    expect(screen.getByText("Nguyễn An")).toBeInTheDocument();
  });
});
