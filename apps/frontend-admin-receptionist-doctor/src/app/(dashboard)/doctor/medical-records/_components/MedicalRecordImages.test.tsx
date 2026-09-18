import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MedicalRecordImages } from "./MedicalRecordImages";

vi.mock("@/src/providers/app-dialog-provider", () => ({
  useAppDialog: () => ({ showConfirm: vi.fn() }),
}));

describe("MedicalRecordImages", () => {
  it("classifies X-rays by modality and keeps AI analysis in the dedicated review workflow", () => {
    render(
      <MedicalRecordImages
        recordId="11111111-1111-4111-8111-111111111111"
        value={[
          {
            id: "22222222-2222-4222-8222-222222222222",
            url: "https://example.com/panorama.jpg",
            type: "xray",
            modality: "PANORAMIC",
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Loại phim X-quang" }),
    ).toHaveValue("PANORAMIC");
    expect(
      screen.getByRole("option", { name: /Cận chóp — chưa hỗ trợ AI/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Phân tích AI/i }),
    ).not.toBeInTheDocument();
  });
});
