import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import DoctorConsultationsPage from "./page";

vi.mock("@/src/components/layout/header", () => ({ Header: () => <header /> }));
vi.mock("@/src/providers/app-dialog-provider", () => ({
  useAppDialog: () => ({ showAlert: vi.fn(), showConfirm: vi.fn() }),
}));
vi.mock("@/src/lib/doctor/session", () => ({
  getDoctorInfoFromCookie: () => ({ doctorId: "doctor-1" }),
  getDoctorIdFromCookie: () => null,
}));
vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);

describe("DoctorConsultationsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders statuses returned by the backend without crashing", async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        {
          id: "consultation-1",
          patientId: "patient-1",
          patientName: "Nguyen An",
          patientCode: "BN-001",
          scheduledAt: "2026-09-14T09:00:00.000Z",
          durationMinutes: 30,
          status: "PENDING_PAYMENT",
          fee: 200_000,
          isPaid: false,
          notes: null,
        },
      ],
    } as never);

    render(<DoctorConsultationsPage />);

    expect(await screen.findByText("Nguyen An")).toBeInTheDocument();
    expect(screen.getByText("Chờ thanh toán")).toBeInTheDocument();
  });
});
