import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import BillingPage from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/src/components/layout/header", () => ({
  Header: ({ children }: { children?: React.ReactNode }) => <header>{children}</header>,
}));
vi.mock("@/src/components/admin/finance/components/refund-management-modal", () => ({
  RefundManagementModal: () => <div>Refund modal</div>,
}));
vi.mock("@/src/providers/app-dialog-provider", () => ({
  useAppDialog: () => ({ showConfirm: vi.fn().mockResolvedValue(true) }),
}));
vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);
const originalTimezone = process.env.TZ;

function invoice(id: string, patient: string, remaining: number) {
  return {
    id,
    patient_id: `patient-${id}`,
    invoice_code: `INV-${id}`,
    patient_name: patient,
    doctor_name: "Nguyễn Minh",
    final_amount: remaining,
    paid_amount: 0,
    remaining_amount: remaining,
    discount_amount: 0,
    issued_at: "2026-09-09T02:00:00.000Z",
    status: "UNPAID",
    items: [{ description: "Khám", qty: 1, unit_price: remaining }],
  };
}

describe("BillingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TZ = "America/New_York";
    mockedApi.get.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.includes("UNPAID")
          ? [invoice("A", "Bệnh nhân A", 100_000), invoice("B", "Bệnh nhân B", 200_000)]
          : [],
      }) as never,
    );
    mockedApi.post.mockResolvedValue({
      data: {
        id: "payment-B",
        status: "PENDING",
        amount: 200_000,
        qrImageUrl: "https://example.test/qr.png",
        transferContent: "SEVQRB",
        bankAccountNo: "123",
        bankAccountName: "NHA KHOA",
        bankName: "BANK",
      },
    } as never);
  });

  afterEach(() => {
    process.env.TZ = originalTimezone;
  });

  it("does not create a pending payment until the receptionist explicitly creates QR", async () => {
    render(<BillingPage />);
    expect((await screen.findAllByText("Bệnh nhân A")).length).toBeGreaterThan(0);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("creates QR for the newly selected invoice with that invoice's full balance", async () => {
    render(<BillingPage />);
    fireEvent.click(await screen.findByRole("button", { name: /Bệnh nhân B/ }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo mã QR" }));

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith("/payments", {
        invoiceId: "B",
        method: "BANK_TRANSFER",
        amount: 200_000,
        promotionCode: undefined,
      }),
    );
  });

  it("prints the invoice area and formats its date in the clinic timezone", async () => {
    render(<BillingPage />);
    expect((await screen.findAllByText("Bệnh nhân A")).length).toBeGreaterThan(0);

    expect(screen.getByText(/INV-A.*09\/09\/2026/)).toBeInTheDocument();
    expect(screen.getByText("Chi tiết phiếu thu").closest("#print-area")).not.toBeNull();
  });
});
