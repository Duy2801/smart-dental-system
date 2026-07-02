export function SecurityNotice() {
  return (
    <div className="flex gap-2.5 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5 text-[11px] leading-4 text-sky-800">
      <span aria-hidden="true" className="text-sky-600">
        ◈
      </span>
      <p>
        <strong className="font-semibold">Dữ liệu của bạn được mã hóa và bảo vệ.</strong>{" "}
        Chúng tôi tuân thủ các tiêu chuẩn bảo mật y tế hiện hành.
      </p>
    </div>
  );
}
