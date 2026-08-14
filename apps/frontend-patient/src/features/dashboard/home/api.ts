import apiClient from "@/lib/axios";

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type TreatmentMethodDto = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: string | number;
  durationMinutes?: number | null;
  displayOrder?: number;
  isActive?: boolean;
};

type ServiceDto = {
  id: string;
  category: string;
  name: string;
  slug?: string | null;
  icon?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  treatmentMethods?: TreatmentMethodDto[];
  treatment_methods?: TreatmentMethodDto[];
  durationMinutes?: number;
  basePrice?: string | number;
};

type DoctorDto = {
  id: string;
  doctorCode: string;
  specialization: string;
  licenseNumber: string;
  avatarUrl?: string | null;
  bio?: string | null;
  position?: string | null;
  workplace?: string | null;
  yearsExperience: number;
  isActive: boolean;
  user: {
    fullName: string;
    status?: string;
  };
  educations?: DoctorEducationDto[];
  certificates?: DoctorCertificateDto[];
  media?: DoctorMediaDto[];
  reviews?: DoctorReviewDto[];
};

type DoctorEducationDto = {
  id: string;
  degree: string;
  school: string;
  major?: string | null;
  graduationYear?: number | null;
  description?: string | null;
  sortOrder: number;
};

type DoctorCertificateDto = {
  id: string;
  title: string;
  issuer: string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  certificateUrl?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  sortOrder: number;
};

type DoctorMediaDto = {
  id: string;
  url: string;
  alt?: string | null;
  type: string;
  sortOrder: number;
};

type DoctorReviewDto = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  patient: {
    user: {
      fullName: string;
    };
  };
  appointment: {
    service: {
      name: string;
    };
  };
};

type ClinicalCaseDto = {
  id: string;
  title: string;
  description?: string | null;
  treatmentDuration?: string | null;
  beforeImageUrl: string;
  afterImageUrl: string;
  service: {
    id: string;
    name: string;
  };
  doctor: {
    id: string;
    user: {
      fullName: string;
    };
  };
};

export type HomeServiceCard = {
  id: string;
  title: string;
  description: string;
  price: string;
  href: string;
  icon: string | null;
  imageUrl: string | null;
  imageAlt: string;
  durationMinutes: number;
};

export type HomeDoctorCard = {
  id: string;
  name: string;
  specialization: string;
  doctorCode: string;
  licenseNumber: string;
  avatarUrl: string | null;
  bio: string;
  position: string;
  workplace: string;
  yearsExperience: number;
  bullets?: string[];
  educations?: DoctorEducationDto[];
  certificates?: DoctorCertificateDto[];
};

export type DoctorDetail = HomeDoctorCard & {
  bio: string;
  position: string;
  workplace: string;
  yearsExperience: number;
  educations: DoctorEducationDto[];
  certificates: DoctorCertificateDto[];
  media: DoctorMediaDto[];
  reviews: DoctorReviewDto[];
  averageRating: number;
};

export type HomeClinicalCase = {
  id: string;
  title: string;
  description: string;
  duration: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  doctorName: string;
  serviceName: string;
};

export type ClinicConfigInfo = {
  name: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  businessHours?: {
    id: number;
    label: string;
    isOpen: boolean;
    start: string;
    end: string;
  }[];
};

export async function getLiveClinicConfigInfo(): Promise<ClinicConfigInfo> {
  const response = await apiClient.get<ClinicConfigInfo>("/clinic-config");

  if (!response.data) {
    throw new Error("Clinic config response is empty");
  }

  return {
    ...response.data,
    businessHours: response.data.businessHours ?? [],
  };
}

function formatVnd(value: string | number) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))} đ`;
}

function mapService(service: ServiceDto): HomeServiceCard {
  const methods = service.treatmentMethods || service.treatment_methods || [];
  const activeMethods = methods.filter((m) => m.isActive !== false);

  const prices = activeMethods
    .map((m) => Number(m.basePrice ?? 0))
    .filter((p) => p > 0);

  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  let priceText = "Liên hệ";
  if (minPrice > 0) {
    if (minPrice === maxPrice) {
      priceText = formatVnd(minPrice);
    } else {
      priceText = `Từ ${formatVnd(minPrice)}`;
    }
  }

  const imageUrl =
    activeMethods.find((m) => m.imageUrl)?.imageUrl ||
    methods.find((m) => m.imageUrl)?.imageUrl ||
    null;

  const durations = activeMethods
    .map((m) => Number(m.durationMinutes ?? 0))
    .filter((d) => d > 0);
  const minDuration = durations.length > 0 ? Math.min(...durations) : (service.durationMinutes || 30);

  return {
    id: service.id,
    title: service.name,
    description:
      service.shortDescription ||
      service.description ||
      "Dịch vụ nha khoa với quy trình chăm sóc chuyên nghiệp.",
    price: priceText,
    href: `/service/${service.id}`,
    icon: service.icon ?? null,
    imageUrl,
    imageAlt: service.name,
    durationMinutes: minDuration,
  };
}

function mapDoctor(doctor: DoctorDto): HomeDoctorCard {
  return {
    id: doctor.id,
    name: doctor.user?.fullName || "Bác sĩ nha khoa",
    specialization: doctor.specialization || "Răng Hàm Mặt",
    doctorCode: doctor.doctorCode || "",
    licenseNumber: doctor.licenseNumber || "",
    avatarUrl: doctor.avatarUrl ?? null,
    bio: doctor.bio || "",
    position: doctor.position || "Bác sĩ điều trị",
    workplace: doctor.workplace || "Smart Dental",
    yearsExperience: doctor.yearsExperience || 0,
  };
}

function mapDoctorDetail(doctor: DoctorDto): DoctorDetail {
  const reviews = doctor.reviews ?? [];
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) /
    reviews.length
    : 0;

  return {
    ...mapDoctor(doctor),
    bio:
      doctor.bio ||
      "Bác sĩ đang cập nhật phần giới thiệu chuyên môn và triết lý điều trị.",
    position: doctor.position || "Bác sĩ điều trị",
    workplace: doctor.workplace || "Smart Dental",
    yearsExperience: doctor.yearsExperience || 0,
    educations: doctor.educations ?? [],
    certificates: doctor.certificates ?? [],
    media: doctor.media ?? [],
    reviews,
    averageRating: Number(averageRating.toFixed(1)),
  };
}

function mapClinicalCase(item: ClinicalCaseDto): HomeClinicalCase {
  return {
    id: item.id,
    title: (item.title || "").replace(/^Seed clinical case -\s*/i, ""),
    description:
      item.description ||
      "Ca điều trị đã được bệnh nhân đồng ý công khai hình ảnh trước và sau.",
    duration: item.treatmentDuration || "Đang cập nhật",
    beforeImageUrl: item.beforeImageUrl || "",
    afterImageUrl: item.afterImageUrl || "",
    doctorName: item.doctor?.user?.fullName || "Bác sĩ chuyên khoa",
    serviceName: item.service?.name || "Dịch vụ nha khoa",
  };
}

export async function getHomeServices(): Promise<HomeServiceCard[]> {
  try {
    const response = await apiClient.get<unknown>("/services", {
      params: {
        isActive: true,
        limit: 20,
        page: 1,
      },
    });

    const resData = (response as { data?: unknown })?.data ?? response;
    const items = (resData as { data?: ServiceDto[] })?.data ?? (Array.isArray(resData) ? resData : []);

    if (!Array.isArray(items)) return [];
    return items.map(mapService);
  } catch (error) {
    console.error("Error fetching home services from API:", error);
    return [];
  }
}

export function getDoctorBullets(doctor: HomeDoctorCard): string[] {
  if (doctor.bullets && doctor.bullets.length > 0) {
    return doctor.bullets;
  }

  const items: string[] = [];

  if (doctor.position) {
    items.push(doctor.position);
  } else if (doctor.specialization) {
    items.push(`Bác sĩ điều trị ${doctor.specialization}`);
  }

  if (doctor.workplace) {
    items.push(`Bác sĩ chuyên khoa tại ${doctor.workplace}`);
  }

  if (doctor.yearsExperience > 0) {
    items.push(`${doctor.yearsExperience}+ năm kinh nghiệm lâm sàng Răng Hàm Mặt`);
  }

  if (doctor.educations && doctor.educations.length > 0) {
    doctor.educations.forEach((edu) => {
      items.push(`${edu.degree} – ${edu.school}`);
    });
  }

  if (doctor.certificates && doctor.certificates.length > 0) {
    doctor.certificates.forEach((cert) => {
      items.push(`Chứng chỉ: ${cert.title}${cert.issuer ? ` (${cert.issuer})` : ""}`);
    });
  }

  if (items.length < 3 && doctor.bio) {
    items.push(doctor.bio);
  }

  if (items.length === 0) {
    items.push(
      "Bác sĩ điều trị Răng Hàm Mặt",
      "Kinh nghiệm lâm sàng chuyên sâu",
    );
  }

  return items;
}

export async function getHomeDoctors(): Promise<HomeDoctorCard[]> {
  try {
    const response = await apiClient.get<unknown>("/doctors");
    const raw = (response as { data?: unknown })?.data ?? response;
    const items = Array.isArray(raw) ? (raw as DoctorDto[]) : [];
    const active = items
      .filter((doctor) => doctor && doctor.isActive && doctor.user?.status !== "INACTIVE")
      .map(mapDoctor);

    return active.slice(0, 6).map((doc) => ({
      ...doc,
      bullets: getDoctorBullets(doc),
    }));
  } catch (error) {
    console.error("Error fetching doctors from DB:", error);
    return [];
  }
}

export async function getDoctors(): Promise<HomeDoctorCard[]> {
  try {
    const response = await apiClient.get<unknown>("/doctors");
    const raw = (response as { data?: unknown })?.data ?? response;
    const items = Array.isArray(raw) ? (raw as DoctorDto[]) : [];
    const active = items
      .filter((doctor) => doctor && doctor.isActive && doctor.user?.status !== "INACTIVE")
      .map(mapDoctor);

    return active.map((doc) => ({
      ...doc,
      bullets: getDoctorBullets(doc),
    }));
  } catch (error) {
    console.error("Error fetching doctors from DB:", error);
    return [];
  }
}

export async function getDoctorDetail(id: string) {
  const response = await apiClient.get<DoctorDto>(`/doctors/${id}`);
  const data = (response as unknown as { data: DoctorDto }).data || response;
  return mapDoctorDetail(data as DoctorDto);
}

export async function getHomeClinicalCases(): Promise<HomeClinicalCase[]> {
  try {
    const response = await apiClient.get<unknown>("/clinical-cases", {
      params: { limit: 3 },
    });
    const raw = (response as { data?: unknown })?.data ?? response;
    const items = Array.isArray(raw) ? (raw as ClinicalCaseDto[]) : [];
    return items.map(mapClinicalCase);
  } catch (error) {
    console.error("Error fetching clinical cases from API:", error);
    return [];
  }
}

export type BannerDto = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  displayOrder: number;
  isActive: boolean;
};

export async function getBanners(): Promise<BannerDto[]> {
  try {
    const response = await apiClient.get<unknown>("/banners");
    const raw = (response as { data?: unknown })?.data ?? response;
    return Array.isArray(raw) ? (raw as BannerDto[]) : [];
  } catch (error) {
    console.error("Error fetching banners from API:", error);
    return [];
  }
}

