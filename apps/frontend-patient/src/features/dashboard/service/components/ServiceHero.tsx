import { T } from "../../common/typography";

export function ServiceHero() {
  return (
    <section className="mx-auto max-w-4xl text-center">
      <span className={`inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 ${T.overline} text-[#0863c5]`}>
        Dịch vụ nổi bật
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900 sm:text-4xl">
        Danh sách dịch vụ nha khoa
      </h1>
      <p className={`mx-auto mt-3 max-w-2xl ${T.body}`}>
        Chọn nhóm dịch vụ để xem các phương pháp điều trị, chi phí và quy trình
        chi tiết.
      </p>
    </section>
  );
}
