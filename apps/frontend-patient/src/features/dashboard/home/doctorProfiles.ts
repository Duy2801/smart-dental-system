export type DoctorProfile = {
  slug: string;
  name: string;
  title: string;
  position: string;
  workplace: string;
  experience: string;
  initials: string;
  tone: string;
  rating: number;
  reviewCount: number;
  patientCount: number;
  satisfaction: number;
  biography: string;
  skills: string[];
  certificates: string[];
  slots: string[];
};

export const doctorProfiles: DoctorProfile[] = [
  {
    slug: "le-hoang-nam",
    name: "ThS.BS. Lê Hoàng Nam",
    title: "Chuyên gia Implant & Phục hình",
    position: "Giám đốc chuyên môn",
    workplace: "Hệ thống Smart Dental AI",
    experience: "15 năm kinh nghiệm",
    initials: "HN",
    tone: "from-blue-800 to-cyan-400",
    rating: 4.9,
    reviewCount: 986,
    patientCount: 4250,
    satisfaction: 98,
    biography: "Bác sĩ Lê Hoàng Nam chuyên điều trị các ca Implant phức tạp, phục hình toàn hàm và tái tạo xương. Bác sĩ theo đuổi phương pháp điều trị ít xâm lấn, ứng dụng kế hoạch phẫu thuật số để tối ưu độ chính xác và thời gian hồi phục.",
    skills: ["Cấy ghép Implant toàn hàm", "Phục hình răng sứ", "Ghép xương và nâng xoang", "Phẫu thuật nha chu"],
    certificates: ["Thạc sĩ Răng Hàm Mặt – Đại học Y Dược TP.HCM", "Chứng chỉ Implant chuyên sâu – ICOI", "Chứng nhận phục hình cố định kỹ thuật số", "Chứng chỉ phẫu thuật tạo hình nha chu"],
    slots: ["Hôm nay · 15:30", "Ngày mai · 09:00", "Ngày mai · 14:30"],
  },
  {
    slug: "nguyen-minh-anh",
    name: "BS. Nguyễn Minh Anh",
    title: "Chuyên gia Chỉnh nha",
    position: "Trưởng khoa Chỉnh nha",
    workplace: "Hệ thống Smart Dental AI",
    experience: "11 năm kinh nghiệm",
    initials: "MA",
    tone: "from-indigo-800 to-violet-400",
    rating: 4.9,
    reviewCount: 742,
    patientCount: 3180,
    satisfaction: 97,
    biography: "Bác sĩ Nguyễn Minh Anh tập trung vào chỉnh nha cá nhân hóa cho người lớn và trẻ em, kết hợp mô phỏng nụ cười 3D để người bệnh theo dõi được lộ trình và kết quả dự kiến trước điều trị.",
    skills: ["Invisalign trong suốt", "Niềng răng mắc cài", "Chỉnh nha trẻ em", "Điều trị khớp cắn"],
    certificates: ["Bác sĩ Răng Hàm Mặt – Đại học Y Dược TP.HCM", "Invisalign Certified Provider", "Chứng chỉ chỉnh nha tăng trưởng", "Đào tạo chuyên sâu khớp cắn kỹ thuật số"],
    slots: ["Hôm nay · 17:00", "Ngày mai · 10:30", "Thứ 6 · 08:30"],
  },
  {
    slug: "tran-thu-ha",
    name: "BS. Trần Thu Hà",
    title: "Nha khoa Thẩm mỹ",
    position: "Bác sĩ chuyên khoa Thẩm mỹ",
    workplace: "Hệ thống Smart Dental AI",
    experience: "9 năm kinh nghiệm",
    initials: "TH",
    tone: "from-cyan-800 to-sky-400",
    rating: 4.8,
    reviewCount: 615,
    patientCount: 2760,
    satisfaction: 96,
    biography: "Bác sĩ Trần Thu Hà chuyên thiết kế nụ cười hài hòa với gương mặt, ưu tiên bảo tồn mô răng thật và lựa chọn giải pháp thẩm mỹ tự nhiên, bền vững.",
    skills: ["Mặt dán sứ Veneer", "Thiết kế nụ cười", "Tẩy trắng Laser", "Phục hình răng sứ"],
    certificates: ["Bác sĩ Răng Hàm Mặt – Đại học Y Dược Huế", "Chứng chỉ Smile Design", "Đào tạo Veneer bảo tồn", "Chứng nhận Laser nha khoa"],
    slots: ["Ngày mai · 08:00", "Ngày mai · 16:00", "Thứ 7 · 09:30"],
  },
  {
    slug: "pham-bao-long",
    name: "BS. Phạm Bảo Long",
    title: "Điều trị Tổng quát",
    position: "Bác sĩ điều trị",
    workplace: "Hệ thống Smart Dental AI",
    experience: "8 năm kinh nghiệm",
    initials: "BL",
    tone: "from-slate-800 to-blue-500",
    rating: 4.8,
    reviewCount: 528,
    patientCount: 2940,
    satisfaction: 96,
    biography: "Bác sĩ Phạm Bảo Long có kinh nghiệm trong điều trị tổng quát và xử lý đau nha khoa, chú trọng trải nghiệm nhẹ nhàng và kế hoạch chăm sóc dự phòng lâu dài.",
    skills: ["Điều trị tủy", "Nhổ răng khôn", "Chăm sóc nha chu", "Nha khoa dự phòng"],
    certificates: ["Bác sĩ Răng Hàm Mặt – Đại học Y Dược Cần Thơ", "Chứng chỉ nội nha kính hiển vi", "Chứng chỉ tiểu phẫu răng khôn", "Đào tạo kiểm soát nhiễm khuẩn"],
    slots: ["Hôm nay · 16:30", "Ngày mai · 11:00", "Thứ 6 · 15:00"],
  },
];
