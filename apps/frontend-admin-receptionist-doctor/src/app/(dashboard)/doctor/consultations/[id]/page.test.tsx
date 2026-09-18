import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import ConsultationRoomPage from "./page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "consultation-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/src/providers/app-dialog-provider", () => ({
  useAppDialog: () => ({ showAlert: vi.fn(), showConfirm: vi.fn() }),
}));
vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(apiClient);

describe("ConsultationRoomPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockImplementation((url) =>
      Promise.resolve({
        data: String(url).startsWith("/video-consultations/")
          ? {
              id: "consultation-1",
              patientId: "patient-1",
              patientName: "Nguyen An",
              patientCode: "BN-001",
              patientPhone: null,
              medicalHistory: null,
              scheduledAt: "2026-09-14T09:00:00.000Z",
              durationMinutes: 30,
              status: "PENDING_PAYMENT",
              meetingUrl: null,
              roomPin: null,
              fee: 200_000,
              isPaid: false,
              notes: null,
              chatbotSessions: [],
            }
          : {},
      } as never),
    );
  });

  it("renders a backend consultation status without crashing", async () => {
    render(<ConsultationRoomPage />);

    expect(await screen.findByText("Nguyen An")).toBeInTheDocument();
    expect(screen.getByText("Chờ thanh toán")).toBeInTheDocument();
  });
});
