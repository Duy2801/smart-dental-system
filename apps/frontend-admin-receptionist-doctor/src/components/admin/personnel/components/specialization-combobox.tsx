"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus } from "@phosphor-icons/react";
import { AdminInput } from "@/src/components/admin/common";
import { queryKeys } from "@/src/lib/query/query-keys";
import { cn } from "@/src/lib/utils/cn";
import { getDoctorSpecializations } from "../personnel-api";

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

type SpecializationComboboxProps = {
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

/** Chọn chuyên khoa có sẵn hoặc gõ tên mới để thêm */
export function SpecializationCombobox({ value, error, onChange }: SpecializationComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: options = [] } = useQuery({
    queryKey: queryKeys.admin.doctorSpecializations,
    queryFn: getDoctorSpecializations,
    staleTime: 5 * 60 * 1000,
  });

  const query = normalize(value);
  const exactMatch = options.find((option) => normalize(option) === query);
  const filtered = useMemo(
    () => (query && !exactMatch ? options.filter((option) => normalize(option).includes(query)) : options),
    [options, query, exactMatch],
  );
  const canAddNew = Boolean(query) && !exactMatch;
  // Mục "Thêm mới" luôn nằm cuối danh sách
  const itemCount = filtered.length + (canAddNew ? 1 : 0);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return setOpen(true);
      if (!itemCount) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + itemCount) % itemCount);
    } else if (event.key === "Enter" && open && itemCount) {
      event.preventDefault();
      if (activeIndex < filtered.length) choose(filtered[activeIndex]);
      else choose(value.trim().replace(/\s+/g, " "));
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <AdminInput
        label="Chuyên khoa"
        required
        maxLength={100}
        value={value}
        error={error}
        placeholder="Chọn hoặc nhập chuyên khoa"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          // Gõ trùng chuyên khoa có sẵn (khác hoa/thường) -> dùng đúng cách viết đã có
          if (exactMatch && exactMatch !== value) onChange(exactMatch);
        }}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
      />
      {open && itemCount > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[4.75rem] z-30 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/10"
        >
          {filtered.map((option, index) => {
            const selected = normalize(option) === query;
            return (
              <li
                key={option}
                role="option"
                aria-selected={selected}
                // mousedown để chọn trước khi input mất focus
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm",
                  index === activeIndex ? "bg-brand-light text-brand" : "text-slate-700",
                  selected && "font-semibold",
                )}
              >
                <span className="truncate">{option}</span>
                {selected ? <Check size={14} weight="bold" className="shrink-0 text-brand" /> : null}
              </li>
            );
          })}
          {canAddNew ? (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(value.trim().replace(/\s+/g, " "));
              }}
              onMouseEnter={() => setActiveIndex(filtered.length)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm",
                filtered.length ? "mt-1 border-t border-slate-100" : "",
                activeIndex === filtered.length ? "bg-brand-light text-brand" : "text-slate-700",
              )}
            >
              <Plus size={14} weight="bold" className="shrink-0 text-brand" />
              <span className="truncate">
                Thêm chuyên khoa mới: <strong>{value.trim()}</strong>
              </span>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
