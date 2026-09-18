import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import { DentalXrayAnalyzer } from "./dental-xray-analyzer";

vi.mock("@/src/lib/api/client", () => ({
  default: { post: vi.fn(), patch: vi.fn() },
}));

const postMock = vi.mocked(apiClient.post);
const patchMock = vi.mocked(apiClient.patch);

describe("DentalXrayAnalyzer safety states", () => {
  beforeEach(() => {
    postMock.mockReset();
    patchMock.mockReset();
  });

  it("shows an empty state and never substitutes a demo X-ray", () => {
    const { container } = render(<DentalXrayAnalyzer patientImages={[]} />);

    expect(
      screen.getByText("Chưa có phim Panorama hỗ trợ AI"),
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src*="wikimedia"]'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    ).toBeDisabled();
    expect(screen.queryByText("--%")).not.toBeInTheDocument();
  });

  it("shows a service error instead of classifying a connection failure as invalid image", async () => {
    postMock.mockRejectedValueOnce(new Error("network down"));
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    );

    expect(
      await screen.findByText("Lỗi dịch vụ Vision AI"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("ẢNH KHÔNG PHẢI PHIM X-QUANG RĂNG"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Sức Khỏe Tốt/)).not.toBeInTheDocument();
  });

  it("does not allow switching images while an analysis request is running", () => {
    postMock.mockReturnValueOnce(new Promise(() => undefined));
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient-1.jpg",
            title: "Panorama 1",
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            url: "https://example.com/patient-2.jpg",
            title: "Panorama 2",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    );

    expect(screen.getByRole("button", { name: "Panorama 2" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Quản lý ảnh/i })).toBeDisabled();
  });

  it("keeps an AI storage failure distinct from an invalid radiograph", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: false,
        status: "ANALYSIS_FAILED",
        errorStatus: "ANALYSIS_FAILED",
        findings: [],
        totalFindings: 0,
        summary: "Không thể tải ảnh X-quang từ kho lưu trữ. Vui lòng thử lại.",
        treatmentRecommendations: [],
        disclaimer: "Chưa có kết quả phân tích.",
        analysisId: "analysis-failed",
        modelVersion: "model-v1",
        analyzedAt: "2026-09-14T00:00:00.000Z",
      },
    });
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    );

    expect(
      await screen.findByText("Lỗi dịch vụ Vision AI"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("ẢNH KHÔNG PHẢI PHIM X-QUANG RĂNG"),
    ).not.toBeInTheDocument();
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
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    );

    expect(
      await screen.findByText("Không phát hiện bất thường vượt ngưỡng"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sức Khỏe Tốt/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^100%$/, { selector: "span.text-3xl" }),
    ).not.toBeInTheDocument();
  });

  it("identifies the bounding box as a tooth region instead of a lesion boundary", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "PATHOLOGY_DETECTED",
        findings: [
          {
            findingId: "77777777-7777-4777-8777-777777777777",
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
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    );

    expect(
      await screen.findByText("Vùng răng AI đề nghị kiểm tra"),
    ).toBeInTheDocument();
    expect(screen.getByTitle(/Vùng răng 46/)).toBeInTheDocument();
  });

  it("allows the doctor to drag on the radiograph and create a manual region", async () => {
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
        analyzedAt: "2026-09-14T00:00:00.000Z",
      },
    });
    render(
      <DentalXrayAnalyzer
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    );
    await screen.findByText("Không phát hiện bất thường vượt ngưỡng");

    fireEvent.click(screen.getByRole("button", { name: "Khoanh vùng" }));
    const image = screen.getByAltText("Dental Radiograph");
    const drawingSurface = image.parentElement as HTMLDivElement;
    vi.spyOn(drawingSurface, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 50,
      left: 100,
      top: 50,
      right: 900,
      bottom: 450,
      width: 800,
      height: 400,
      toJSON: () => undefined,
    });

    fireEvent.mouseDown(drawingSurface, { clientX: 180, clientY: 90 });
    fireEvent.mouseMove(drawingSurface, { clientX: 420, clientY: 210 });
    fireEvent.mouseUp(drawingSurface);

    expect(
      screen.getByText("Thêm tổn thương thủ công"),
    ).toBeInTheDocument();
    expect(image).toHaveAttribute("draggable", "false");
  });

  it("requires the doctor to review and persist every finding before applying it", async () => {
    const onApply = vi.fn();
    patchMock.mockResolvedValueOnce({
      data: { reviewedAt: "2026-09-14T00:00:00.000Z" },
    });
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "PATHOLOGY_DETECTED",
        findings: [
          {
            findingId: "77777777-7777-4777-8777-777777777777",
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
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient.jpg",
          },
        ]}
        onApplyToMedicalRecord={onApply}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    );
    const applyButton = await screen.findByRole("button", {
      name: /vào bản nháp bệnh án/i,
    });

    expect(applyButton).toBeDisabled();
    expect(screen.getByText("Chờ bác sĩ duyệt")).toBeInTheDocument();
    expect(screen.queryByText(/Chỉ Số Sức Khỏe Răng/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Duyệt$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận rà soát/i }));

    expect(
      await screen.findByText("Đã lưu xác nhận rà soát"),
    ).toBeInTheDocument();
    expect(patchMock).toHaveBeenCalledWith(
      "/ai/doctor/xray-analyses/analysis-1/review",
      expect.objectContaining({
        findings: [
          expect.objectContaining({
            findingId: "77777777-7777-4777-8777-777777777777",
            fdiToothNumber: 46,
            doctorStatus: "ACCEPTED",
          }),
        ],
      }),
      expect.anything(),
    );

    fireEvent.click(applyButton);

    expect(onApply).toHaveBeenCalledOnce();
    expect(screen.getByText("Đã thêm vào bản nháp")).toBeInTheDocument();
    expect(
      screen.queryByText("Đã chèn vào Bệnh án EMR"),
    ).not.toBeInTheDocument();
  });

  it("locks finding and image mutations while the review is being persisted", async () => {
    patchMock.mockReturnValueOnce(new Promise(() => undefined));
    postMock.mockResolvedValueOnce({
      data: {
        isRadiograph: true,
        status: "PATHOLOGY_DETECTED",
        findings: [
          {
            findingId: "77777777-7777-4777-8777-777777777777",
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
        patientImages={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            url: "https://example.com/patient-1.jpg",
            title: "Panorama 1",
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            url: "https://example.com/patient-2.jpg",
            title: "Panorama 2",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    );
    fireEvent.click(await screen.findByRole("button", { name: /^Duyệt$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận rà soát/i }));

    expect(
      screen.getByRole("button", { name: /Phân tích Panorama AI/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Panorama 2" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Đã duyệt$/i })).toBeDisabled();
  });
});
