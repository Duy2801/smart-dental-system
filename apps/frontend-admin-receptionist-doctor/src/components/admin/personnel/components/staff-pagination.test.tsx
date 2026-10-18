import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StaffPagination } from "./staff-pagination";

describe("StaffPagination", () => {
  it("renders correct range and total count", () => {
    const onPageChange = vi.fn();
    render(
      <StaffPagination
        page={1}
        totalPages={3}
        total={25}
        limit={10}
        roleFilter="DOCTOR"
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText("1-10")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText(/bác sĩ/i)).toBeInTheDocument();
  });

  it("handles previous and next page clicks", () => {
    const onPageChange = vi.fn();
    render(
      <StaffPagination
        page={2}
        totalPages={3}
        total={25}
        limit={10}
        roleFilter="DOCTOR"
        onPageChange={onPageChange}
      />,
    );

    const prevButton = screen.getByTitle("Trang trước");
    const nextButton = screen.getByTitle("Trang sau");

    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables previous button on first page", () => {
    render(
      <StaffPagination
        page={1}
        totalPages={3}
        total={25}
        limit={10}
        roleFilter="DOCTOR"
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByTitle("Trang trước")).toBeDisabled();
    expect(screen.getByTitle("Trang sau")).not.toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(
      <StaffPagination
        page={3}
        totalPages={3}
        total={25}
        limit={10}
        roleFilter="DOCTOR"
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByTitle("Trang sau")).toBeDisabled();
    expect(screen.getByTitle("Trang trước")).not.toBeDisabled();
  });

  it("returns null when total is 0", () => {
    const { container } = render(
      <StaffPagination
        page={1}
        totalPages={1}
        total={0}
        limit={10}
        roleFilter="DOCTOR"
        onPageChange={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
