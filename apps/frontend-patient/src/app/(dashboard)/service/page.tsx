"use client";

import { useMemo, useState } from "react";
import { ServiceCard, ServiceFilters, ServiceHero } from "@/components/dashboard/service";
import type {
  DentalService,
  ServiceCategory,
  ServiceFilter,
} from "@/components/dashboard/service";

const filters: ServiceFilter[] = [
  { id: "all", label: "Tất cả" },
  { id: "cosmetic", label: "Thẩm mỹ" },
  { id: "restoration", label: "Cấy ghép & Phục hình" },
  { id: "general", label: "Chăm sóc tổng quát" },
];

const services: DentalService[] = [
  {
    id: "implant-high-tech",
    title: "Cấy ghép Implant High-Tech",
    description:
      "Tái tạo rụng chiếc răng mới với công nghệ cấy ghép chính xác, ổn định và thời gian lành thương tối ưu.",
    category: "restoration",
    price: "15.000.000đ",
    image: "https://images.unsplash.com/photo-1771442873038-dda05b6ca447?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Dụng cụ nha khoa hiện đại phục vụ cấy ghép implant",
    badge: "Nổi bật",
  },
  {
    id: "invisalign-elite",
    title: "Niềng răng Invisalign Elite",
    description:
      "Chỉnh nha vô hình tích hợp AI, dự đoán kết quả và theo dõi tiến trình chính xác theo từng giai đoạn.",
    category: "orthodontics",
    price: "45.000.000đ",
    image: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Khay niềng răng trong suốt Invisalign",
  },
  {
    id: "laser-whitening",
    title: "Tẩy trắng răng Laser 4D",
    description:
      "Nâng tông răng sáng tự nhiên sau một liệu trình, bảo vệ men răng và giảm cảm giác ê buốt.",
    category: "cosmetic",
    price: "3.500.000đ",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Phòng điều trị nha khoa với công nghệ laser",
  },
  {
    id: "ultra-thin-veneer",
    title: "Dán sứ Veneer Siêu mỏng",
    description:
      "Kiến tạo nụ cười hài hòa với mặt dán sứ tinh xảo, hạn chế tối đa việc mài răng thật.",
    category: "cosmetic",
    price: "8.000.000đ/răng",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Quy trình chăm sóc và phục hình răng thẩm mỹ",
  },
  {
    id: "general-dentistry-ai",
    title: "Nha khoa Tổng quát AI",
    description:
      "Khám và đánh giá tổng quát với hỗ trợ AI, phát hiện sớm nguy cơ để lên kế hoạch chăm sóc chủ động.",
    category: "general",
    price: "500.000đ",
    image: "https://images.unsplash.com/photo-1744723856265-866d19b9cf1a?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Bác sĩ đang thăm khám răng cho bệnh nhân",
  },
  {
    id: "family-diamond-care",
    title: "Chăm sóc Gia đình Diamond",
    description:
      "Gói chăm sóc răng miệng toàn diện cho gia đình, theo dõi định kỳ và quản lý hồ sơ liên tục.",
    category: "general",
    price: "1.200.000đ",
    image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Bác sĩ thăm khám trong gói chăm sóc nha khoa gia đình",
  },
];

export default function ServicePage() {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("all");

  const visibleServices = useMemo(
    () =>
      selectedCategory === "all"
        ? services
        : services.filter((service) => service.category === selectedCategory),
    [selectedCategory],
  );

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <ServiceHero />

      <div className="mt-10">
        <ServiceFilters
          filters={filters}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {visibleServices.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </section>
    </main>
  );
}
