import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { PromoFormModal } from "./promo-form-modal";

vi.mock("@/src/components/admin/service_pricing/service-pricing-api", () => ({
  getServices: vi.fn().mockResolvedValue([
    {
      id: "s1",
      name: "Niềng răng",
      slug: "nieng-rang",
      category: "Chỉnh nha",
      treatmentMethods: [{ id: "m1", name: "Mắc cài kim loại" }],
    },
  ]),
}));

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PromoFormModal onClose={() => {}} onSubmit={() => {}} submitting={false} />
    </QueryClientProvider>,
  );
}

describe("PromoFormModal scope", () => {
  it("shows the service list when choosing service scope", async () => {
    renderModal();
    fireEvent.click(screen.getByText("Theo nhóm dịch vụ"));
    expect(await screen.findByRole("option", { name: "[Chỉnh nha] Niềng răng" })).toBeTruthy();
  });

  it("shows the method list when choosing method scope", async () => {
    renderModal();
    fireEvent.click(screen.getByText("Theo phương pháp"));
    expect(
      await screen.findByRole("option", { name: "[Chỉnh nha] Niềng răng - Mắc cài kim loại" }),
    ).toBeTruthy();
  });
});
