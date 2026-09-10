import { api } from '~src/config';

type PaginatedResponse<T> = {
  data: T[];
};

export type TreatmentMethod = {
  basePrice: string | number;
  bookingCount?: number;
  description?: string | null;
  displayOrder?: number;
  durationMinutes?: number | null;
  id: string;
  imageUrl?: string | null;
  isActive?: boolean;
  name: string;
  slug?: string | null;
};

type TreatmentMethodDto = {
  _count?: { appointments?: number };
  basePrice: string | number;
  bookingCount?: number;
  description?: string | null;
  displayOrder?: number;
  durationMinutes?: number | null;
  id: string;
  imageUrl?: string | null;
  isActive?: boolean;
  name: string;
  slug?: string | null;
};

type ServiceDto = {
  basePrice?: string | number | null;
  category?: string;
  description?: string | null;
  detailSummary?: string | null;
  displayOrder?: number;
  durationMinutes?: number | null;
  icon?: string | null;
  id: string;
  isActive?: boolean;
  isFeatured?: boolean;
  name: string;
  shortDescription?: string | null;
  slug?: string | null;
  treatment_methods?: TreatmentMethodDto[];
  treatmentMethods?: TreatmentMethodDto[];
};

type DoctorDto = {
  avatarUrl?: string | null;
  bio?: string | null;
  doctorCode?: string;
  id: string;
  isActive?: boolean;
  licenseNumber?: string;
  position?: string | null;
  specialization?: string;
  user?: {
    fullName?: string;
    status?: string;
  };
  workplace?: string | null;
  yearsExperience?: number;
};

type BannerDto = {
  description?: string | null;
  displayOrder?: number;
  id: string;
  imageUrl?: string | null;
  isActive?: boolean;
  linkUrl?: string | null;
  title: string;
};

type ClinicalCaseDto = {
  afterImageUrl?: string | null;
  beforeImageUrl?: string | null;
  description?: string | null;
  doctor?: {
    id: string;
    user?: {
      fullName?: string;
    } | null;
  } | null;
  id: string;
  service?: {
    id: string;
    name: string;
  } | null;
  title: string;
  treatmentDuration?: string | null;
};

export type HomeServiceCard = {
  category?: string;
  description: string;
  displayOrder?: number;
  durationMinutes: number;
  icon: string | null;
  id: string;
  imageUrl?: string | null;
  name: string;
  price: string;
  priceValue: number;
  shortDescription?: string | null;
  slug?: string | null;
  title: string;
  treatmentMethods: TreatmentMethod[];
};

export type HomeDoctorCard = {
  avatarUrl: string | null;
  bio?: string;
  bullets: string[];
  id: string;
  initials: string;
  name: string;
  position: string;
  specialization: string;
  workplace: string;
  yearsExperience: number;
};

export type HomeBanner = {
  description: string;
  id: string;
  imageUrl: string | null;
  linkUrl?: string | null;
  title: string;
};

export type HomeClinicalCase = {
  afterImageUrl: string | null;
  beforeImageUrl: string | null;
  description: string;
  doctorName: string;
  duration: string;
  id: string;
  serviceName: string;
  title: string;
};

export type ClinicConfigInfo = {
  address: string;
  businessHours: {
    end: string;
    id: number;
    isOpen: boolean;
    label: string;
    start: string;
  }[];
  email: string;
  name: string;
  phone: string;
};

const formatVnd = (value: string | number) =>
  `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

const getResponseItems = <T>(payload: unknown): T[] => {
  const data = (payload as { data?: unknown })?.data ?? payload;
  const items = (data as PaginatedResponse<T>)?.data ?? data;
  return Array.isArray(items) ? items : [];
};

export function getDoctorBullets(doctor: {
  bio?: string | null;
  position?: string | null;
  specialization?: string | null;
  workplace?: string | null;
  yearsExperience?: number;
}): string[] {
  const items: string[] = [];

  if (doctor.position) {
    items.push(doctor.position);
  } else if (doctor.specialization) {
    items.push(`Bác sĩ điều trị ${doctor.specialization}`);
  }

  if (doctor.workplace) {
    items.push(`Bác sĩ chuyên khoa tại ${doctor.workplace}`);
  }

  if (doctor.yearsExperience && doctor.yearsExperience > 0) {
    items.push(
      `${doctor.yearsExperience}+ năm kinh nghiệm lâm sàng Răng Hàm Mặt`,
    );
  }

  if (items.length < 3 && doctor.bio) {
    items.push(doctor.bio);
  }

  if (items.length === 0) {
    items.push(
      'Bác sĩ điều trị Răng Hàm Mặt',
      'Kinh nghiệm lâm sàng chuyên sâu',
    );
  }

  return items;
}

const mapService = (service: ServiceDto): HomeServiceCard => {
  const rawMethods = service.treatmentMethods || service.treatment_methods || [];
  const methods: TreatmentMethod[] = rawMethods.map(m => ({
    basePrice: m.basePrice,
    bookingCount: m.bookingCount ?? m._count?.appointments ?? 0,
    description: m.description || '',
    displayOrder: m.displayOrder ?? 0,
    durationMinutes: m.durationMinutes || 30,
    id: m.id,
    imageUrl: m.imageUrl || null,
    isActive: m.isActive !== false,
    name: m.name,
    slug: m.slug || null,
  }));

  const activeMethods = methods.filter(m => m.isActive);
  const prices = activeMethods
    .map(m => Number(m.basePrice ?? 0))
    .filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const durations = activeMethods
    .map(m => Number(m.durationMinutes ?? 0))
    .filter(d => d > 0);

  const imageUrl =
    activeMethods.find(m => m.imageUrl)?.imageUrl ||
    methods.find(m => m.imageUrl)?.imageUrl ||
    null;

  return {
    category: service.category,
    description:
      service.shortDescription ||
      service.description ||
      'Dịch vụ nha khoa với quy trình chăm sóc chuyên nghiệp.',
    displayOrder: service.displayOrder,
    durationMinutes: durations.length
      ? Math.min(...durations)
      : service.durationMinutes || 30,
    icon: service.icon || null,
    id: service.id,
    imageUrl,
    name: service.name,
    price: minPrice > 0 ? `Từ ${formatVnd(minPrice)}` : 'Liên hệ',
    priceValue: minPrice,
    shortDescription: service.shortDescription || service.description,
    slug: service.slug,
    title: service.name,
    treatmentMethods: activeMethods,
  };
};

const mapDoctor = (doctor: DoctorDto): HomeDoctorCard => {
  const name = doctor.user?.fullName || 'Bác sĩ nha khoa';
  return {
    avatarUrl: doctor.avatarUrl || null,
    bio: doctor.bio || '',
    bullets: getDoctorBullets({
      bio: doctor.bio,
      position: doctor.position,
      specialization: doctor.specialization,
      workplace: doctor.workplace,
      yearsExperience: doctor.yearsExperience,
    }),
    id: doctor.id,
    initials: getInitials(name) || 'BS',
    name,
    position: doctor.position || 'Bác sĩ điều trị',
    specialization: doctor.specialization || 'Răng Hàm Mặt',
    workplace: doctor.workplace || 'Smart Dental',
    yearsExperience: doctor.yearsExperience || 0,
  };
};

const mapClinicalCase = (item: ClinicalCaseDto): HomeClinicalCase => ({
  afterImageUrl: item.afterImageUrl || null,
  beforeImageUrl: item.beforeImageUrl || null,
  description:
    item.description ||
    'Ca điều trị đã được bệnh nhân đồng ý công khai hình ảnh trước và sau.',
  doctorName: item.doctor?.user?.fullName || 'Bác sĩ chuyên khoa',
  duration: item.treatmentDuration || 'Đang cập nhật',
  id: item.id,
  serviceName: item.service?.name || 'Dịch vụ nha khoa',
  title: (item.title || '').replace(/^Seed clinical case -\s*/i, ''),
});

export const getHomeServices = async () => {
  const response = await api.get<unknown>('/services', {
    params: { isActive: true, limit: 100, page: 1 },
  });
  return getResponseItems<ServiceDto>(response.data).map(mapService);
};

export const getHomeDoctors = async () => {
  const response = await api.get<unknown>('/doctors');
  return getResponseItems<DoctorDto>(response.data)
    .filter(doctor => doctor.isActive !== false && doctor.user?.status !== 'INACTIVE')
    .map(mapDoctor);
};

export const getBanners = async () => {
  const response = await api.get<unknown>('/banners');
  return getResponseItems<BannerDto>(response.data)
    .filter(banner => banner.isActive !== false)
    .map(banner => ({
      description: banner.description || 'Ưu đãi và thông tin mới từ phòng khám.',
      id: banner.id,
      imageUrl: banner.imageUrl || null,
      linkUrl: banner.linkUrl || null,
      title: banner.title,
    }));
};

export const getHomeClinicalCases = async () => {
  const response = await api.get<unknown>('/clinical-cases', {
    params: { limit: 6 },
  });
  return getResponseItems<ClinicalCaseDto>(response.data).map(mapClinicalCase);
};

export const getClinicConfigInfo = async (): Promise<ClinicConfigInfo> => {
  const response = await api.get<ClinicConfigInfo>('/clinic-config');
  return {
    address: response.data.address || 'Chưa cập nhật địa chỉ',
    businessHours: response.data.businessHours ?? [],
    email: response.data.email || '',
    name: response.data.name || 'Smart Dental',
    phone: response.data.phone || '1900 1234',
  };
};
