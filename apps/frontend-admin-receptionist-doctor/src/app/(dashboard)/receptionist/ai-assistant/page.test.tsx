import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/src/lib/api/client";
import AIAssistantPage from "./page";

vi.mock("@/src/components/layout/header", () => ({ Header: ({ title }: { title: string }) => <header>{title}</header> }));
vi.mock("@/src/lib/api/client", () => ({ default: { post: vi.fn() } }));

const mockedApi = vi.mocked(apiClient);

describe("AIAssistantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = `user_info=${encodeURIComponent(JSON.stringify({ id: "staff-1", fullName: "Lễ Tân" }))}`;
    mockedApi.post.mockResolvedValue({ data: { reply: "Hướng dẫn thật" } } as never);
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("uses the authenticated backend endpoint", async () => {
    render(<AIAssistantPage />);
    fireEvent.click(screen.getByRole("button", { name: "Xử lý lịch hẹn" }));
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith(
      "/ai/receptionist/chat",
      expect.objectContaining({ message: "Hướng dẫn xử lý lịch hẹn hôm nay" }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ));
    expect(await screen.findByText("Hướng dẫn thật")).toBeInTheDocument();
  });

  it("ignores malformed stored history instead of crashing", async () => {
    localStorage.setItem("sds-receptionist-chat-v1:staff-1", JSON.stringify("broken"));
    render(<AIAssistantPage />);
    expect(await screen.findByText(/trợ lý AI nội bộ/i)).toBeInTheDocument();
  });
});
