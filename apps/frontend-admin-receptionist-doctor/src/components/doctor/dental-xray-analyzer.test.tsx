import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import { DentalXrayAnalyzer } from "./dental-xray-analyzer";

vi.mock("@/src/lib/api/client", () => ({
  default: { post: vi.fn() },
}));

const postMock = vi.mocked(apiClient.post);

describe("DentalXrayAnalyzer safety states", () => {
  beforeEach(() => postMock.mockReset());

  it("shows an empty state and never substitutes a demo X-ray", () => {
    const { container } = render(<DentalXrayAnalyzer patientImages={[]} />);

    expect(screen.getByText("Chưa có phim X-quang")).toBeInTheDocument();
    expect(container.querySelector('img[src*="wikimedia"]')).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Phân tích X-quang AI/i })).toBeDisabled();
  });

  it("shows a service error instead of classifying a connection failure as invalid image", async () => {
    postMock.mockRejectedValueOnce(new Error("network down"));
    render(<DentalXrayAnalyzer patientImages={[{ id: "11111111-1111-4111-8111-111111111111", url: "https://example.com/patient.jpg" }]} />);

    fireEvent.click(screen.getByRole("button", { name: /Phân tích X-quang AI/i }));

    expect(await screen.findByText("Lỗi dịch vụ Vision AI")).toBeInTheDocument();
    expect(screen.queryByText("ẢNH KHÔNG PHẢI PHIM X-QUANG RĂNG")).not.toBeInTheDocument();
    expect(screen.queryByText(/Sức Khỏe Tốt/)).not.toBeInTheDocument();
  });

  it("shows a neutral state when no finding exceeds the model threshold", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "HEALTHY",
        findings: [],
        totalFindings: 0,
        summary: "Model chưa phát hiện bất thường vượt ngưỡng.",
        diagnosisSuggestion: null,
        treatmentRecommendations: [],
        annotatedImageUrl: null,
        disclaimer: "Bác sĩ cần đối chiếu lâm sàng.",
        analysisId: "analysis-1",
        modelVersion: "model-v1",
        analyzedAt: "2026-08-28T00:00:00.000Z",
      },
    });
    render(<DentalXrayAnalyzer patientImages={[{ id: "11111111-1111-4111-8111-111111111111", url: "https://example.com/patient.jpg" }]} />);

    fireEvent.click(screen.getByRole("button", { name: /Phân tích X-quang AI/i }));

    expect(await screen.findByText("Không phát hiện bất thường vượt ngưỡng")).toBeInTheDocument();
    expect(screen.queryByText(/Sức Khỏe Tốt/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^100%$/, { selector: "span.text-3xl" })).not.toBeInTheDocument();
  });

  it("identifies the bounding box as a tooth region instead of a lesion boundary", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "PATHOLOGY_DETECTED",
        findings: [
          {
            fdiToothNumber: 46,
            findingType: "Caries",
            confidence: 0.91,
            severity: "UNASSESSED",
            boundingBox: { x: 40, y: 30, width: 12, height: 24 },
          },
        ],
        totalFindings: 1,
        summary: "Có một vị trí cần bác sĩ kiểm tra.",
        diagnosisSuggestion: null,
        treatmentRecommendations: [],
        annotatedImageUrl: null,
        disclaimer: "Bác sĩ cần đối chiếu lâm sàng.",
        analysisId: "analysis-1",
        modelVersion: "model-v1",
        analyzedAt: "2026-08-28T00:00:00.000Z",
      },
    });
    render(<DentalXrayAnalyzer patientImages={[{ id: "11111111-1111-4111-8111-111111111111", url: "https://example.com/patient.jpg" }]} />);

    fireEvent.click(screen.getByRole("button", { name: /Phân tích X-quang AI/i }));

    expect(await screen.findByText("Vùng răng AI đề nghị kiểm tra")).toBeInTheDocument();
    expect(screen.getByTitle(/Vùng răng 46/)).toBeInTheDocument();
  });

  it("describes an applied result as a draft instead of a saved EMR entry", async () => {
    const onApply = vi.fn();
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "PATHOLOGY_DETECTED",
        findings: [
          {
            fdiToothNumber: 46,
            findingType: "Caries",
            confidence: 0.91,
            severity: "UNASSESSED",
            boundingBox: { x: 40, y: 30, width: 12, height: 24 },
          },
        ],
        totalFindings: 1,
        summary: "Có một vị trí cần bác sĩ kiểm tra.",
        diagnosisSuggestion: null,
        treatmentRecommendations: [],
        annotatedImageUrl: null,
        disclaimer: "Bác sĩ cần đối chiếu lâm sàng.",
        analysisId: "analysis-1",
        modelVersion: "model-v1",
        analyzedAt: "2026-08-28T00:00:00.000Z",
      },
    });
    render(
      <DentalXrayAnalyzer
        patientImages={[{ id: "11111111-1111-4111-8111-111111111111", url: "https://example.com/patient.jpg" }]}
        onApplyToMedicalRecord={onApply}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Phân tích X-quang AI/i }));
    fireEvent.click(
      await screen.findByRole("button", { name: /vào bản nháp bệnh án/i })
    );

    expect(onApply).toHaveBeenCalledOnce();
    expect(screen.getByText("Đã thêm vào bản nháp")).toBeInTheDocument();
    expect(screen.queryByText("Đã chèn vào Bệnh án EMR")).not.toBeInTheDocument();
  });
});
