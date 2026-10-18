import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import { MedicalRecordImages } from "./MedicalRecordImages";

vi.mock("@/src/lib/api/client", () => ({
  default: { post: vi.fn().mockResolvedValue({ data: { images: [] } }) },
}));

vi.mock("@/src/providers/app-dialog-provider", () => ({
  useAppDialog: () => ({ showConfirm: vi.fn() }),
}));

describe("MedicalRecordImages", () => {
  it("uploads only panoramic X-rays without an unsupported type selector", async () => {
    const { container } = render(
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

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Phân tích AI/i }),
    ).not.toBeInTheDocument();

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(["xray"], "panorama.jpg", { type: "image/jpeg" })],
      },
    });
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledOnce());
    const form = vi.mocked(apiClient.post).mock.calls[0][1] as FormData;
    expect(form.get("type")).toBe("xray");
    expect(form.get("modality")).toBe("PANORAMIC");
  });
});
