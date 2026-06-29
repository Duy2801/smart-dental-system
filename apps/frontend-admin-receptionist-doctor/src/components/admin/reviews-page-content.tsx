"use client";

import { useMemo, useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";

type Review = {
  id: string;
  patient_name: string;
  doctor_name: string;
  rating: number; // 1-5
  comment: string;
  is_visible: boolean;
  created_at: string;
};

const mockReviews: Review[] = [
  {
    id: "1",
    patient_name: "Nguyễn Văn An",
    doctor_name: "BS. Trần Minh (Nhổ răng khôn)",
    rating: 5,
    comment: "Bác sĩ làm rất nhẹ nhàng, không đau chút nào. Phòng khám sạch sẽ, nhân viên nhiệt tình.",
    is_visible: true,
    created_at: "2026-06-29T10:30:00Z",
  },
  {
    id: "2",
    patient_name: "Trần Thị Bé",
    doctor_name: "BS. Phạm Quang (Niềng răng)",
    rating: 4,
    comment: "Dịch vụ tốt, bác sĩ tư vấn kỹ. Tuy nhiên lúc chờ hơi lâu một chút do phòng khám đông.",
    is_visible: true,
    created_at: "2026-06-28T14:15:00Z",
  },
  {
    id: "3",
    patient_name: "Lê Văn Cường",
    doctor_name: "BS. Nguyễn Hoa (Tẩy trắng)",
    rating: 1,
    comment: "Spam link: http://kiemtienonline.xyz - Đăng ký ngay để nhận 500k!!!",
    is_visible: false, // Ẩn do spam
    created_at: "2026-06-27T09:00:00Z",
  },
  {
    id: "4",
    patient_name: "Phạm Dũng",
    doctor_name: "BS. Trần Minh (Khám tổng quát)",
    rating: 5,
    comment: "Tuyệt vời, sẽ quay lại ủng hộ phòng khám.",
    is_visible: true,
    created_at: "2026-06-25T16:45:00Z",
  },
  {
    id: "5",
    patient_name: "Hoàng Yến",
    doctor_name: "BS. Phạm Quang (Trám răng)",
    rating: 2,
    comment: "Miếng trám bị cộm, mình ăn nhai hơi khó chịu. Mong phòng khám bảo hành lại giúp mình.",
    is_visible: true, // Review thật dù điểm thấp, vẫn nên để hiện
    created_at: "2026-06-24T11:20:00Z",
  }
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={cn("h-4 w-4", i < rating ? "text-amber-400" : "text-zinc-200")} fill="currentColor" viewBox="0 0 20 20">
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
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"ALL" | "5" | "4" | "3">("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "VISIBLE" | "HIDDEN">("ALL");

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Visibility match
      const matchVis = 
        visibilityFilter === "ALL" ? true :
        visibilityFilter === "VISIBLE" ? r.is_visible : !r.is_visible;
      
      // Rating match
      const matchRating = 
        ratingFilter === "ALL" ? true :
        ratingFilter === "5" ? r.rating === 5 :
        ratingFilter === "4" ? r.rating === 4 : r.rating <= 3; // 3 implies <=3 for simplicity here
      
      // Search match
      const q = search.toLowerCase();
      const matchSearch = !q || r.patient_name.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q);
      
      return matchVis && matchRating && matchSearch;
    });
  }, [reviews, search, ratingFilter, visibilityFilter]);

  // Derived Stats
  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const totalReviews = reviews.length;
  const ratingCounts = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const toggleVisibility = (id: string) => {
    setReviews((prev) => prev.map(r => r.id === id ? { ...r, is_visible: !r.is_visible } : r));
  };

  const deleteReview = (id: string) => {
    setReviews((prev) => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      
      {/* Overview Card */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-mono font-bold text-brand-dark">{avgRating}</span>
          <div className="mt-2"><StarRating rating={Math.round(Number(avgRating))} /></div>
          <span className="text-sm text-muted-foreground mt-1">Dựa trên {totalReviews} đánh giá</span>
        </div>
        
        <div className="flex-1 max-w-sm flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star as keyof typeof ratingCounts];
            const percent = totalReviews ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-8 shrink-0 text-muted-foreground font-medium">{star} sao</span>
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            placeholder="Tìm theo tên bệnh nhân hoặc nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as any)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            <option value="ALL">Mọi số sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">Từ 3 sao trở xuống</option>
          </select>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as any)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="VISIBLE">Đang hiển thị</option>
            <option value="HIDDEN">Đã ẩn (Spam/Vi phạm)</option>
          </select>
        </div>
      </div>

      {/* Review List (Feed Style) */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="divide-y divide-border">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy đánh giá nào phù hợp.
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className={cn("group relative flex flex-col p-5 transition-colors", !review.is_visible && "bg-muted/30")}>
                
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                      {getInitials(review.patient_name)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-brand-dark">{review.patient_name}</span>
                        {!review.is_visible && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 uppercase tracking-wider">Đã ẩn</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">{formatDate(review.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Row Actions - Visible on Hover (or always visible on mobile) */}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-white shadow-sm border border-border rounded-lg p-1">
                    <button 
                      type="button" 
                      title={review.is_visible ? "Ẩn bình luận này" : "Hiện lại bình luận"}
                      onClick={() => toggleVisibility(review.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      {review.is_visible ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                    <div className="w-[1px] h-4 bg-border mx-1" />
                    <button 
                      type="button" 
                      title="Xóa vĩnh viễn"
                      onClick={() => deleteReview(review.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>

                <div className="mt-3 pl-13">
                  <div className="flex items-center gap-3">
                    <StarRating rating={review.rating} />
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{review.doctor_name}</span>
                  </div>
                  <p className={cn("mt-2 text-sm leading-relaxed", !review.is_visible ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-brand-dark")}>
                    {review.comment}
                  </p>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
