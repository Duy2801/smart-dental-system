import { Header } from "@/src/components/layout/header";
import { ReviewsPageContent } from "@/src/components/admin/reviews-page-content";

export default function AdminReviewsPage() {
  return (
    <>
      <Header title="Đánh giá bệnh nhân" description="Duyệt hoặc ẩn các đánh giá, xử lý review spam" />
      <ReviewsPageContent />
    </>
  );
}
