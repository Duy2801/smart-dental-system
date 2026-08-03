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

type ServiceDto = {
  id: string;
  category: string;
  name: string;
  slug?: string | null;
  icon?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  durationMinutes: number;
  basePrice: string | number;
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
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function mapService(service: ServiceDto): HomeServiceCard {
  return {
    id: service.id,
    title: service.name,
    description:
      service.shortDescription ||
      service.description ||
      "Dịch vụ nha khoa với quy trình chăm sóc chuyên nghiệp.",
    price: formatVnd(service.basePrice),
    href: `/service/${service.id}`,
    icon: service.icon ?? null,
    imageUrl: service.thumbnailUrl ?? null,
    imageAlt: service.name,
    durationMinutes: service.durationMinutes,
  };
}

function mapDoctor(doctor: DoctorDto): HomeDoctorCard {
  return {
    id: doctor.id,
    name: doctor.user.fullName,
    specialization: doctor.specialization,
    doctorCode: doctor.doctorCode,
    licenseNumber: doctor.licenseNumber,
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
    title: item.title.replace(/^Seed clinical case -\s*/i, ""),
    description:
      item.description ||
      "Ca điều trị đã được bệnh nhân đồng ý công khai hình ảnh trước và sau.",
    duration: item.treatmentDuration || "Đang cập nhật",
    beforeImageUrl: item.beforeImageUrl,
    afterImageUrl: item.afterImageUrl,
    doctorName: item.doctor.user.fullName,
    serviceName: item.service.name,
  };
}

export async function getHomeServices() {
  const response = await apiClient.get<PaginatedResponse<ServiceDto>>(
    "/services",
    {
      params: {
        isActive: true,
        limit: 20,
        page: 1,
      },
    },
  );

  return response.data.data.map(mapService);
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
    const response = await apiClient.get<DoctorDto[]>("/doctors");
    const active = response.data
      .filter((doctor) => doctor.isActive && doctor.user.status !== "INACTIVE")
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
    const response = await apiClient.get<DoctorDto[]>("/doctors");
    const active = response.data
      .filter((doctor) => doctor.isActive && doctor.user.status !== "INACTIVE")
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
  return mapDoctorDetail(response.data);
}

export async function getHomeClinicalCases() {
  const response = await apiClient.get<ClinicalCaseDto[]>("/clinical-cases", {
    params: { limit: 3 },
  });

  return response.data.map(mapClinicalCase);
}
