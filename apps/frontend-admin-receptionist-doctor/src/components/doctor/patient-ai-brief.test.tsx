import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import { PatientAiBrief } from "./patient-ai-brief";

vi.mock("@/src/lib/api/client", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const getMock = vi.mocked(apiClient.get);

const savedBrief = {
  id: "brief-a",
  patientId: "patient-a",
  patientName: "Bệnh nhân A",
  bulletPoints: ["Thông tin lâm sàng riêng của A"],
  questionsToAsk: [],
  riskFlags: [],
  disclaimer: "Bác sĩ cần kiểm tra.",
  createdAt: "2026-09-14T00:00:00.000Z",
  createdByName: "Bác sĩ A",
  sources: [],
  provider: "test",
  model: "test",
  feedback: null,
  feedbackNote: null,
  isStale: false,
  bulletSources: {},
  riskSources: {},
};

describe("PatientAiBrief", () => {
  beforeEach(() => getMock.mockReset());

  it("hides the previous patient's brief while loading a new patient", async () => {
    getMock.mockResolvedValueOnce({ data: savedBrief }).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          window.setTimeout(() => resolve({ data: null }), 50);
        }),
    );

    const { rerender } = render(<PatientAiBrief patientId="patient-a" />);
    expect(
      await screen.findByText("Thông tin lâm sàng riêng của A"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nguồn: Chưa xác định/i)).toBeInTheDocument();

    rerender(<PatientAiBrief patientId="patient-b" />);

    expect(
      screen.queryByText("Thông tin lâm sàng riêng của A"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Đang tạo hồ sơ AI")).toBeInTheDocument();
  });

  it("warns about stale data and shows the source of each summary bullet", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        ...savedBrief,
        isStale: true,
        sources: [
          { key: "medical_history", label: "Tiền sử bệnh", available: true },
        ],
        bulletSources: {
          "Thông tin lâm sàng riêng của A": ["medical_history"],
        },
        riskFlags: ["Có tiền sử dị ứng cần xác minh"],
        riskSources: {
          "Có tiền sử dị ứng cần xác minh": ["medical_history"],
        },
      },
    });

    render(<PatientAiBrief patientId="patient-a" />);

    expect(await screen.findByText(/Hồ sơ AI này đã cũ/i)).toBeInTheDocument();
    expect(screen.getAllByText("Nguồn: Tiền sử bệnh")).toHaveLength(2);
  });
});
