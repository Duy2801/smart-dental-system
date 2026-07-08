import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";

export type FeaturedArticle = {
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
};

export function InsightsSection({ article }: { article: FeaturedArticle }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
      <article className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm sm:p-8">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-50" />
        <span className="relative rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0863c5]">
          {article.category}
        </span>
        <h2 className="relative mt-5 max-w-2xl text-2xl font-bold tracking-[-0.03em] text-slate-900 sm:text-3xl">
          {article.title}
        </h2>
        <p className="relative mt-4 max-w-2xl text-sm leading-6 text-slate-500">{article.excerpt}</p>
        <div className="relative mt-6 flex items-center gap-4">
          <Link
            href="/records"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0863c5] hover:underline"
          >
            Đọc bài viết <DashboardIcon name="arrow" className="h-4 w-4" />
          </Link>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <DashboardIcon name="clock" className="h-4 w-4" /> {article.readTime}
          </span>
        </div>
      </article>

      <aside className="rounded-2xl bg-gradient-to-br from-[#eef7ff] to-white p-6 ring-1 ring-blue-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#0863c5] text-white shadow-md shadow-blue-200">
            <DashboardIcon name="sparkles" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Trợ lý nha khoa AI</h2>
            <p className="text-xs text-emerald-600">● Đang trực tuyến</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl rounded-tl-sm bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
          Xin chào! Tôi có thể giải đáp các câu hỏi về chăm sóc răng miệng hoặc lịch hẹn của bạn.
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 pl-4">
          <span className="flex-1 text-xs text-slate-400">Nhập câu hỏi của bạn...</span>
          <button
            type="button"
            aria-label="Gửi câu hỏi"
            className="grid h-9 w-9 place-items-center rounded-lg bg-[#0863c5] text-white hover:bg-[#0756aa]"
          >
            <DashboardIcon name="arrow" className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </section>
  );
}
