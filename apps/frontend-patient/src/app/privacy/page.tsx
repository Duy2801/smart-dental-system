import Link from "next/link";

export const metadata = {
  title: "Chính sách bảo mật - Smart Dental System",
  description: "Chính sách bảo mật thông tin y tế và dữ liệu bệnh nhân của Smart Dental System.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/home"
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#0863c5] transition hover:text-blue-700"
          >
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Trang chủ</span>
          </Link>
          <span className="text-xs font-semibold text-slate-500">
            Cập nhật lần cuối: 2026
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Chính sách Bảo mật Dữ liệu
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Cam kết bảo vệ hồ sơ bệnh án và quyền riêng tư theo tiêu chuẩn y tế quốc tế.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-base font-bold text-slate-900">
                1. Thu thập dữ liệu
              </h2>
              <p className="mt-1">
                Chúng tôi chỉ thu thập các thông tin cần thiết phục vụ quá trình khám, tư vấn và điều trị nha khoa, bao gồm họ tên, số điện thoại, email và hồ sơ tiền sử bệnh lý.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900">
                2. Bảo mật hồ sơ bệnh án
              </h2>
              <p className="mt-1">
                Tất cả hình ảnh X-quang, kết quả chẩn đoán AI và lịch sử khám nha khoa được mã hóa an toàn trên máy chủ đám mây, chỉ bác sĩ phụ trách và bệnh nhân mới có quyền truy cập.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900">
                3. Chia sẻ thông tin
              </h2>
              <p className="mt-1">
                Smart Dental cam kết tuyệt đối không bán hoặc cung cấp dữ liệu cá nhân của người bệnh cho bất kỳ bên thứ ba nào vì mục đích thương mại hay quảng cáo.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
