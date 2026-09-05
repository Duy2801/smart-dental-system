import Link from "next/link";

export const metadata = {
  title: "Điều khoản dịch vụ - Smart Dental System",
  description: "Điều khoản sử dụng và quy định dịch vụ của hệ thống nha khoa thông minh.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/home"
            className="text-sm font-bold text-[#0863c5] transition hover:text-blue-700"
          >
            Trang chủ
          </Link>
          <span className="text-xs font-semibold text-slate-500">
            Cập nhật lần cuối: 2026
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Điều khoản Dịch vụ
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Quy định sử dụng nền tảng đặt lịch khám và tư vấn trực tuyến Smart Dental System.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-base font-bold text-slate-900">
                1. Giới thiệu chung
              </h2>
              <p className="mt-1">
                Chào mừng bạn đến với Smart Dental System. Bằng việc truy cập hoặc sử dụng ứng dụng, bạn đồng ý tuân thủ các điều khoản dịch vụ và chính sách của chúng tôi.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900">
                2. Đặt lịch khám và tư vấn
              </h2>
              <p className="mt-1">
                Bệnh nhân có trách nhiệm cung cấp thông tin chính xác về tình trạng sức khỏe cá nhân, hồ sơ bệnh lý trước khi điều trị hoặc tham gia buổi tư vấn nha khoa trực tuyến.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900">
                3. Chính sách hủy hẹn và hoàn tiền
              </h2>
              <p className="mt-1">
                Quý khách có thể hủy hoặc đổi lịch hẹn trước ít nhất 12 giờ so với thời điểm diễn ra lịch hẹn. Các trường hợp vắng mặt không báo trước có thể bị giới hạn tính năng đặt lịch trực tuyến.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900">
                4. Trách nhiệm người dùng
              </h2>
              <p className="mt-1">
                Người dùng có nghĩa vụ bảo mật tài khoản cá nhân, mật khẩu và thông tin đăng nhập, không chia sẻ quyền truy cập cho bên thứ ba.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
