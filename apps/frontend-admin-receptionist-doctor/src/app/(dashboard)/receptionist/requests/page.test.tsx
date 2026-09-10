import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import ReceptionistRequestsPage from "./page";

vi.mock("@/src/components/layout/header", () => ({
  Header: () => <header />,
}));
vi.mock("@/src/providers/app-dialog-provider", () => ({
  useAppDialog: () => ({
    showAlert: vi.fn().mockResolvedValue(undefined),
    showConfirm: vi.fn().mockResolvedValue(true),
  }),
}));
vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);
const liveRefund = {
  id: "4d2c19ca-e12e-4f74-a101-1de00d61cc99",
  refundCode: "REF-000001",
  status: "PENDING",
  createdAt: "2026-09-09T18:00:00.000Z",
  requestedAmount: 200_000,
  refundPercent: 100,
  bankName: "Vietcombank",
  accountNumber: "123456789",
  accountHolder: "NGUYEN AN",
  reason: "Không còn nhu cầu",
  patient: { patientCode: "BN-001", user: { fullName: "Nguyễn An", phone: "0901234567" } },
};

describe("ReceptionistRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.patch.mockResolvedValue({ data: {} } as never);
  });

  it("shows an honest empty state instead of demo requests", async () => {
    mockedApi.get.mockResolvedValue({ data: [] } as never);
    render(<ReceptionistRequestsPage />);

    expect(await screen.findByText("Không có yêu cầu hoàn tiền")).toBeInTheDocument();
    expect(screen.queryByText(/YCQ-8492/)).not.toBeInTheDocument();
  });

  it("shows the load failure instead of silently falling back to sample data", async () => {
    mockedApi.get.mockRejectedValue(new Error("offline"));
    render(<ReceptionistRequestsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không tải được danh sách yêu cầu hoàn tiền",
    );
  });

  it("processes a real refund request through the backend", async () => {
    mockedApi.get.mockResolvedValue({ data: [liveRefund] } as never);
    render(<ReceptionistRequestsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /REF-000001/ }));
    fireEvent.click(screen.getByRole("button", { name: "Duyệt hoàn tiền" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận hoàn tiền" }));

    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith(
        `/refund-requests/${liveRefund.id}/process`,
        { status: "COMPLETED", proofImageUrl: undefined },
      ),
    );
  });
});
