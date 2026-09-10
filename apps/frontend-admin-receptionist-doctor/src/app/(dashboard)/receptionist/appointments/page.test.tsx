import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import ReceptionistAppointmentsPage from "./page";

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
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);
const originalTimezone = process.env.TZ;
const appointments = [
  {
    id: "past",
    appointmentCode: "APT-PAST",
    scheduledAt: "2026-09-08T02:00:00.000Z",
    status: "PENDING",
    patient: { id: "patient-1", fullName: "Nguyễn An" },
  },
  {
    id: "future",
    appointmentCode: "APT-FUTURE",
    scheduledAt: "2026-09-10T02:00:00.000Z",
    status: "CONFIRMED",
    patient: { id: "patient-2", fullName: "Trần Bình" },
  },
  {
    id: "checked-in",
    appointmentCode: "APT-CHECKED-IN",
    scheduledAt: "2026-09-09T02:00:00.000Z",
    status: "CHECKED_IN",
    patient: { id: "patient-3", fullName: "Lê Chi" },
  },
  {
    id: "completed",
    appointmentCode: "APT-COMPLETED",
    scheduledAt: "2026-09-09T03:00:00.000Z",
    status: "COMPLETED",
    paymentStatus: "PAY_AT_COUNTER_SELECTED",
    invoices: [{ id: "invoice-open", status: "ISSUED", invoiceType: "SERVICE" }],
    patient: { id: "patient-4", fullName: "Phạm Dũng" },
  },
];

describe("ReceptionistAppointmentsPage", () => {
  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTimezone;
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-09-09T03:00:00.000Z"));
    vi.clearAllMocks();
    mockedApi.get.mockImplementation((url: string) =>
      Promise.resolve({ data: url === "/doctors" ? [] : appointments }) as never,
    );
    mockedApi.patch.mockResolvedValue({ data: {} } as never);
  });

  it("only offers time-valid actions and names the clinical transition accurately", async () => {
    render(<ReceptionistAppointmentsPage />);

    const futureRow = await screen.findByRole("row", { name: /APT-FUTURE/ });
    expect(within(futureRow).queryByRole("button", { name: "Check-in" })).not.toBeInTheDocument();
    const pastRow = screen.getByRole("row", { name: /APT-PAST/ });
    expect(within(pastRow).queryByRole("button", { name: "Xác nhận" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bắt đầu khám" })).toBeInTheDocument();
    expect(screen.queryByText("Nhắc BS")).not.toBeInTheDocument();

    fireEvent.click(within(futureRow).getByLabelText("Tùy chọn"));
    expect(screen.queryByText("Đánh dấu vắng mặt")).not.toBeInTheDocument();
  });

  it("records patient-requested cancellation and links the correct invoice", async () => {
    render(<ReceptionistAppointmentsPage />);
    const futureRow = await screen.findByRole("row", { name: /APT-FUTURE/ });
    fireEvent.click(within(futureRow).getByLabelText("Tùy chọn"));
    fireEvent.click(screen.getByText("Khách báo hủy"));

    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith("/appointments/future/cancel", {
        reason: "Bệnh nhân yêu cầu hủy",
      }),
    );
    expect(screen.getByRole("link", { name: "Thu tiền" })).toHaveAttribute(
      "href",
      "/receptionist/billing?invoiceId=invoice-open",
    );
  });

  it("keeps the selected clinic date unchanged across machine timezones", async () => {
    process.env.TZ = "Pacific/Kiritimati";
    const { container } = render(<ReceptionistAppointmentsPage />);
    await screen.findByRole("row", { name: /APT-PAST/ });

    fireEvent.change(container.querySelector('input[type="date"]')!, {
      target: { value: "2026-09-12" },
    });

    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith("/appointments", {
        params: { date: "2026-09-12" },
      }),
    );
  });

  it("shows a doctor-loading failure instead of silently hiding the filter data", async () => {
    mockedApi.get.mockImplementation((url: string) =>
      url === "/doctors"
        ? Promise.reject(new Error("offline"))
        : (Promise.resolve({ data: appointments }) as never),
    );

    render(<ReceptionistAppointmentsPage />);

    expect(await screen.findByText("Không tải được danh sách bác sĩ.")).toBeInTheDocument();
  });
});
