import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import { RefundManagementModal } from "./refund-management-modal";

vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);

describe("RefundManagementModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({
      data: [{
        id: "refund-1",
        refundCode: "REF-001",
        patientId: "patient-1",
        bankName: "VietQR",
        accountNumber: "123456",
        accountHolder: "NGUYEN VAN A",
        qrCodeUrl: "https://example.test/refund-qr.png",
        requestedAmount: 100_000,
        refundPercent: 100,
        status: "COMPLETED",
        createdAt: "2026-09-13T10:00:00.000Z",
      }],
    } as never);
  });

  it("opens the refund QR in an enlarged viewer and closes it with Escape", async () => {
    render(<RefundManagementModal onClose={vi.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Phóng to mã QR chuyển tiền" }));
    expect(screen.getByRole("dialog", { name: "Xem ảnh mã QR chuyển tiền" })).toBeInTheDocument();
    expect(screen.getByAltText("Mã QR chuyển tiền phóng to")).toHaveAttribute(
      "src",
      "https://example.test/refund-qr.png",
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Xem ảnh mã QR chuyển tiền" })).not.toBeInTheDocument();
  });
});
