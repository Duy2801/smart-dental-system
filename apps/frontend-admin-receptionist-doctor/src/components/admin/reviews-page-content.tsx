"use client";

import { useState } from "react";
import { reviews, type ReviewStatus } from "@/src/components/admin/mock-data";
import { StatusBadge } from "@/src/components/admin/ui/status-badge";
import { Tabs } from "@/src/components/admin/ui/tabs";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-4 w-4 ${i < rating ? "text-amber-400" : "text-zinc-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
}

export function ReviewsPageContent() {
  const [tab, setTab] = useState<ReviewStatus>("pending");
  const [items, setItems] = useState(reviews);

  const filtered = items.filter((r) => r.status === tab);

  const updateStatus = (id: string, status: ReviewStatus) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div className="space-y-4 p-6 md:p-8">
      <Tabs
        tabs={[
          { id: "pending", label: "Chờ duyệt" },
          { id: "approved", label: "Đã duyệt" },
          { id: "hidden", label: "Đã ẩn" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as ReviewStatus)}
      />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Không có đánh giá nào.</p>
        ) : (
          filtered.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand-dark">
                    {getInitials(review.patientName)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-brand-dark">{review.patientName}</p>
                      {review.isSpam ? <StatusBadge label="Spam" variant="danger" /> : null}
                    </div>
                    <StarRating rating={review.rating} />
                    <p className="mt-2 text-sm text-muted-foreground">{review.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{review.date}</p>
                  </div>
                </div>
                {tab === "pending" ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => updateStatus(review.id, "approved")} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark">Duyệt</button>
                    <button type="button" onClick={() => updateStatus(review.id, "hidden")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-brand-dark hover:bg-muted">Ẩn</button>
                    <button type="button" onClick={() => setItems((p) => p.filter((r) => r.id !== review.id))} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:underline">Xóa</button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
