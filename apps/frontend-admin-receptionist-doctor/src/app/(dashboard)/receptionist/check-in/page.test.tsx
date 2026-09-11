import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import CheckInPage from "./page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));
vi.mock("@/src/components/layout/header", () => ({
  Header: ({ children }: { children?: React.ReactNode }) => <header>{children}</header>,
}));
vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);

function appointment(id: string, patientName: string) {
  return {
    id,
    appointmentCode: `APT-${id}`,
    scheduledAt: "2026-09-09T02:00:00.000Z",
    endAt: "2026-09-09T02:30:00.000Z",
    status: "CONFIRMED",
    patient: { id: `patient-${id}`, fullName: patientName, phone: "0977889900" },
    doctor: { id: "doctor-1", user: { fullName: "Nguyễn Minh" } },
    service: { id: "service-1", name: "Khám tổng quát" },
  };
}

describe("CheckInPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.patch.mockResolvedValue({ data: {} } as never);
  });

  it("uses manual search only and sends the required medical-history confirmation", async () => {
    mockedApi.get.mockResolvedValue({ data: [appointment("1", "Nguyễn An")] } as never);
    render(<CheckInPage />);

    expect(screen.queryByText(/quét mã QR/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm lịch hẹn hôm nay" }), {
      target: { value: "APT-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tìm lịch hẹn" }));

    const confirmation = await screen.findByRole("checkbox", {
      name: /Tiền sử bệnh lý không thay đổi/i,
    });
    fireEvent.click(confirmation);
    fireEvent.change(screen.getByRole("textbox", { name: /Ghi chú lễ tân/i }), {
      target: { value: "Bệnh nhân đến đúng giờ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất Check-in" }));

    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith("/appointments/1/check-in", {
        medicalHistoryConfirmed: true,
        notes: "Bệnh nhân đến đúng giờ",
      }),
    );
  });

  it("does not let an older search response replace the latest result", async () => {
    let resolveOld!: (value: unknown) => void;
    mockedApi.get
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }) as never)
      .mockResolvedValueOnce({ data: [appointment("new", "Kết quả mới")] } as never);
    render(<CheckInPage />);

    const input = screen.getByRole("searchbox", { name: "Tìm lịch hẹn hôm nay" });
    fireEvent.change(input, { target: { value: "old" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "new" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("Kết quả mới")).toBeInTheDocument();
    resolveOld({ data: [appointment("old", "Kết quả cũ")] });
    await waitFor(() => expect(screen.queryByText("Kết quả cũ")).not.toBeInTheDocument());
  });
});
