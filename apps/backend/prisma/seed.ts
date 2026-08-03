import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const TEST_PASSWORD = 'Test@123456';
const now = new Date();
const dayMs = 24 * 60 * 60 * 1000;

const addDays = (days: number) => new Date(now.getTime() + days * dayMs);
const dateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

/** Ngày local + giờ cố định — dùng cho lịch lễ tân (tránh lệch timezone). */
const atLocalDay = (dayOffset: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const roles = [
  ['ADMIN', 'Administrator', 'Full system access'],
  ['DOCTOR', 'Doctor', 'Dental doctor account'],
  ['RECEPTIONIST', 'Receptionist', 'Front desk account'],
  ['PATIENT', 'Patient', 'Patient portal account'],
] as const;

const obsoleteRoleCodes = [
  'MANAGER',
  'ACCOUNTANT',
  'ASSISTANT',
  'SUPPORT',
  'MARKETING',
  'VIEWER',
] as const;

const obsoleteStaffEmails = [
  'manager@smartdental.test',
  'accountant@smartdental.test',
  'assistant@smartdental.test',
  'support@smartdental.test',
  'marketing@smartdental.test',
  'viewer@smartdental.test',
] as const;

const permissions = [
  ['users.read', 'View users', 'users', 'read'],
  ['users.manage', 'Manage users', 'users', 'manage'],
  ['roles.manage', 'Manage roles', 'roles', 'manage'],
  ['appointments.read', 'View appointments', 'appointments', 'read'],
  ['appointments.manage', 'Manage appointments', 'appointments', 'manage'],
  ['patients.manage', 'Manage patients', 'patients', 'manage'],
  ['doctors.manage', 'Manage doctors', 'doctors', 'manage'],
  ['invoices.manage', 'Manage invoices', 'invoices', 'manage'],
  ['payments.manage', 'Manage payments', 'payments', 'manage'],
  ['reports.read', 'View reports', 'reports', 'read'],
] as const;

const seededBusinessHours = [
  { id: 1, label: 'Thu Hai', isOpen: true, start: '08:00', end: '17:00' },
  { id: 2, label: 'Thu Ba', isOpen: true, start: '08:00', end: '17:00' },
  { id: 3, label: 'Thu Tu', isOpen: true, start: '08:00', end: '17:00' },
  { id: 4, label: 'Thu Nam', isOpen: true, start: '08:00', end: '17:00' },
  { id: 5, label: 'Thu Sau', isOpen: true, start: '08:00', end: '17:00' },
  { id: 6, label: 'Thu Bay', isOpen: true, start: '08:00', end: '12:00' },
  { id: 0, label: 'Chu Nhat', isOpen: false, start: '08:00', end: '12:00' },
];

const clinicProfileConfigs = [
  ['clinic.name', 'Smart Dental Clinic'],
  ['clinic.phone', '1900 1234'],
  ['clinic.email', 'contact@smartdental.com'],
  ['clinic.address', '123 Nguyen Van Linh, Da Nang'],
  ['clinic.logoUrl', ''],
  ['clinic.businessHours', JSON.stringify(seededBusinessHours)],
  ['clinic.slotIntervalMinutes', '30'],
  ['clinic.specialDates', '[]'],
].map(([configKey, configValue]) => ({
  configType: 'CLINIC_PROFILE',
  configKey,
  configValue,
  configDate: null,
}));

const legacyClinicConfigs = Array.from({ length: 10 }, (_, index) => ({
  configType: index < 5 ? 'BUSINESS' : 'SYSTEM',
  configKey: `seed.config.${String(index + 1).padStart(2, '0')}`,
  configValue:
    index === 0
      ? 'Smart Dental Clinic'
      : index === 1
        ? '08:00'
        : index === 2
          ? '18:00'
          : `Seed configuration value ${index + 1}`,
  configDate: index < 3 ? null : addDays(index),
}));

const clinicConfigs = [...clinicProfileConfigs, ...legacyClinicConfigs];

const adminUsers = [
  {
    email: 'admin@smartdental.test',
    fullName: 'Admin Test',
    phone: '0900000001',
    roleCode: 'ADMIN',
    status: 'ACTIVE' as const,
  },
  {
    email: 'receptionist@smartdental.test',
    fullName: 'Receptionist Test',
    phone: '0900000002',
    roleCode: 'RECEPTIONIST',
    status: 'ACTIVE' as const,
  },
];

const patientSeeds = [
  {
    email: 'patient01@smartdental.test',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',
    patientCode: 'PAT-SEED-001',
    dateOfBirth: dateOnly('1990-05-12'),
    gender: 'MALE' as const,
    status: 'ACTIVE' as const,
    address: '12 Nguyễn Huệ, Q.1, TP.HCM',
    emergencyContactName: 'Nguyễn Thị Lan',
    emergencyContactPhone: '0912345678',
    medicalHistory: 'Dị ứng: Penicillin\nCao huyết áp',
  },
  {
    email: 'patient02@smartdental.test',
    fullName: 'Trần Thị Bình',
    phone: '0911223344',
    patientCode: 'PAT-SEED-002',
    dateOfBirth: dateOnly('1995-11-08'),
    gender: 'FEMALE' as const,
    status: 'ACTIVE' as const,
    address: '45 Lê Lợi, Q.3, TP.HCM',
    emergencyContactName: 'Trần Văn Bình',
    emergencyContactPhone: '0911223355',
    medicalHistory: 'No significant medical history.',
  },
  {
    email: 'patient03@smartdental.test',
    fullName: 'Lê Hoàng Cường',
    phone: '0987654321',
    patientCode: 'PAT-SEED-003',
    dateOfBirth: dateOnly('1985-01-25'),
    gender: 'MALE' as const,
    status: 'ACTIVE' as const,
    address: '8 Võ Văn Tần, Q.3, TP.HCM',
    emergencyContactName: 'Lê Thị Hoa',
    emergencyContactPhone: '0987654333',
    medicalHistory: 'Dị ứng: Aspirin\nMáu khó đông',
  },
  {
    email: 'patient04@smartdental.test',
    fullName: 'Phạm Thu Hà',
    phone: '0977889900',
    patientCode: 'PAT-SEED-004',
    dateOfBirth: dateOnly('2000-09-14'),
    gender: 'FEMALE' as const,
    status: 'ACTIVE' as const,
    address: '22 Pasteur, Q.1, TP.HCM',
    emergencyContactName: 'Phạm Văn Khoa',
    emergencyContactPhone: '0977889911',
    medicalHistory: 'No significant medical history.',
  },
  {
    email: 'patient05@smartdental.test',
    fullName: 'Hoàng Minh Quân',
    phone: '0933445566',
    patientCode: 'PAT-SEED-005',
    dateOfBirth: dateOnly('1988-03-02'),
    gender: 'MALE' as const,
    status: 'ACTIVE' as const,
    address: '101 Lý Thường Kiệt, Q.10, TP.HCM',
    emergencyContactName: 'Hoàng Thị Nga',
    emergencyContactPhone: '0933445577',
    medicalHistory: 'Dị ứng: Latex, Ibuprofen\nTiểu đường Type 2',
  },
  {
    email: 'patient06@smartdental.test',
    fullName: 'Đỗ Thị Lan',
    phone: '0944556677',
    patientCode: 'PAT-SEED-006',
    dateOfBirth: dateOnly('1992-07-19'),
    gender: 'FEMALE' as const,
    status: 'ACTIVE' as const,
    address: '56 Cách Mạng Tháng 8, Q.3, TP.HCM',
    emergencyContactName: 'Đỗ Văn Nam',
    emergencyContactPhone: '0944556688',
    medicalHistory: 'Sensitive teeth and mild gum bleeding.',
  },
  {
    email: 'patient07@smartdental.test',
    fullName: 'Võ Quang Dũng',
    phone: '0955667788',
    patientCode: 'PAT-SEED-007',
    dateOfBirth: dateOnly('1982-12-01'),
    gender: 'MALE' as const,
    status: 'ACTIVE' as const,
    address: '9 Nguyễn Đình Chiểu, Q.1, TP.HCM',
    emergencyContactName: 'Võ Thị Mai',
    emergencyContactPhone: '0955667799',
    medicalHistory: 'No significant medical history.',
  },
  {
    email: 'patient08@smartdental.test',
    fullName: 'Bùi Ngọc Mai',
    phone: '0966778899',
    patientCode: 'PAT-SEED-008',
    dateOfBirth: dateOnly('1998-04-22'),
    gender: 'FEMALE' as const,
    status: 'ACTIVE' as const,
    address: '77 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    emergencyContactName: 'Bùi Văn Sơn',
    emergencyContactPhone: '0966778800',
    medicalHistory: 'Dị ứng: Penicillin',
  },
  {
    email: 'patient09@smartdental.test',
    fullName: 'Phan Văn Đức',
    phone: '0977001122',
    patientCode: 'PAT-SEED-009',
    dateOfBirth: dateOnly('1979-08-30'),
    gender: 'MALE' as const,
    status: 'INACTIVE' as const,
    address: '15 Hoàng Sa, Q.1, TP.HCM',
    emergencyContactName: 'Phan Thị Yến',
    emergencyContactPhone: '0977001133',
    medicalHistory: 'No significant medical history.',
  },
  {
    email: 'patient10@smartdental.test',
    fullName: 'Lý Thị Hương',
    phone: '0988112233',
    patientCode: 'PAT-SEED-010',
    dateOfBirth: dateOnly('1993-06-05'),
    gender: 'FEMALE' as const,
    status: 'SUSPENDED' as const,
    address: '3 Trường Sa, Phú Nhuận, TP.HCM',
    emergencyContactName: 'Lý Văn Tài',
    emergencyContactPhone: '0988112244',
    medicalHistory: 'Sensitive teeth and mild gum bleeding.',
  },
];

const doctorAvatarUrls = [
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496476/smart-dental/doctors/le-hoang-nam.png',
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496479/smart-dental/doctors/nguyen-minh-anh.png',
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496480/smart-dental/doctors/tran-thu-ha.png',
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496481/smart-dental/doctors/pham-bao-long.png',
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496483/smart-dental/doctors/do-khanh-linh.png',
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496484/smart-dental/doctors/vo-quang-huy.png',
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496485/smart-dental/doctors/huynh-mai-chi.png',
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496486/smart-dental/doctors/bui-duc-tam.png',
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496487/smart-dental/doctors/phan-ngoc-anh.png',
  'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496488/smart-dental/doctors/dang-minh-khoa.png',
];

const doctorNames = [
  'ThS.BS. Lê Hoàng Nam',
  'BS. Nguyễn Minh Anh',
  'BS. Trần Thu Hà',
  'BS. Phạm Bảo Long',
  'BS. Đỗ Khánh Linh',
  'BS. Võ Quang Huy',
  'BS. Huỳnh Mai Chi',
  'BS. Bùi Đức Tâm',
  'BS. Phan Ngọc Ánh',
  'BS. Đặng Minh Khoa',
];

const doctorSpecializations = [
  'Cấy ghép Implant và Phục hình',
  'Chỉnh nha',
  'Nha khoa Thẩm mỹ',
  'Điều trị Tổng quát',
  'Nha chu',
  'Nội nha',
  'Răng trẻ em',
  'Phục hình sứ',
  'Tẩy trắng và chăm sóc nụ cười',
  'Phẫu thuật miệng',
];

const doctorPositions = [
  'Giám đốc chuyên môn',
  'Trưởng khoa Chỉnh nha',
  'Bác sĩ Nha khoa thẩm mỹ',
  'Bác sĩ điều trị tổng quát',
  'Bác sĩ Nha chu',
  'Bác sĩ Nội nha',
  'Bác sĩ Răng trẻ em',
  'Bác sĩ Phục hình',
  'Bác sĩ chăm sóc nụ cười',
  'Bác sĩ phẫu thuật miệng',
];

const doctorBios = [
  'Bác sĩ Lê Hoàng Nam tập trung vào các ca Implant phức tạp, phục hình toàn hàm và tái tạo xương. Bác sĩ ưu tiên kế hoạch điều trị ít xâm lấn, ứng dụng dữ liệu hình ảnh số để tăng độ chính xác và rút ngắn thời gian hồi phục.',
  'Bác sĩ Nguyễn Minh Anh chuyên chỉnh nha cá nhân hóa cho người lớn và trẻ em. Bác sĩ kết hợp mô phỏng nụ cười 3D, phân tích khớp cắn và theo dõi tiến trình để người bệnh hiểu rõ từng giai đoạn điều trị.',
  'Bác sĩ Trần Thu Hà theo đuổi nha khoa thẩm mỹ bảo tồn, thiết kế nụ cười hài hòa với gương mặt và ưu tiên vật liệu tự nhiên, bền vững.',
  'Bác sĩ Phạm Bảo Long có kinh nghiệm trong điều trị tổng quát, xử lý đau nha khoa và chăm sóc dự phòng. Phong cách tư vấn rõ ràng giúp người bệnh dễ theo dõi kế hoạch điều trị.',
  'Bác sĩ Đỗ Khánh Linh chuyên điều trị bệnh lý nha chu, kiểm soát viêm nướu và xây dựng lộ trình chăm sóc mô quanh răng lâu dài.',
  'Bác sĩ Võ Quang Huy tập trung vào nội nha kính hiển vi, điều trị tủy bảo tồn và phục hồi răng sau điều trị bằng quy trình kiểm soát nhiễm khuẩn chặt chẽ.',
  'Bác sĩ Huỳnh Mai Chi có kinh nghiệm chăm sóc nha khoa trẻ em, tư vấn dự phòng sâu răng và giúp trẻ hình thành thói quen chăm sóc răng miệng tích cực.',
  'Bác sĩ Bùi Đức Tâm chuyên phục hình sứ và khôi phục chức năng ăn nhai, chú trọng cân bằng giữa thẩm mỹ, khớp cắn và độ bền lâu dài.',
  'Bác sĩ Phan Ngọc Ánh phụ trách các dịch vụ tẩy trắng, chăm sóc nụ cười và duy trì sức khỏe men răng bằng phác đồ nhẹ nhàng.',
  'Bác sĩ Đặng Minh Khoa có kinh nghiệm phẫu thuật miệng, nhổ răng khôn và xử lý các thủ thuật nha khoa cần kiểm soát đau tốt.',
];

const doctorMediaUrls = [
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1583912267550-d44c7d69922d?auto=format&fit=crop&w=1200&q=80',
];

const doctorSeeds = Array.from({ length: 10 }, (_, index) => ({
  email:
    index === 0
      ? 'doctor@smartdental.test'
      : `doctor${String(index + 1).padStart(2, '0')}@smartdental.test`,
  fullName: doctorNames[index],
  phone: `09200000${String(index + 1).padStart(2, '0')}`,
  doctorCode: `DOC-SEED-${String(index + 1).padStart(3, '0')}`,
  specialization: doctorSpecializations[index],
  licenseNumber: `VN-DENT-SEED-${String(index + 1).padStart(4, '0')}`,
  avatarUrl: doctorAvatarUrls[index],
  bio: doctorBios[index],
  position: doctorPositions[index],
  workplace: 'Hệ thống Smart Dental AI',
  yearsExperience: [15, 11, 9, 8, 7, 10, 6, 12, 5, 9][index],
  status: (index === 9 ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
  isActive: index !== 9,
  educations: [
    {
      degree: 'Bác sĩ Răng Hàm Mặt',
      school: index % 2 === 0 ? 'Đại học Y Dược TP.HCM' : 'Đại học Y Hà Nội',
      major: doctorSpecializations[index],
      graduationYear: 2010 + (index % 7),
      description:
        'Nền tảng đào tạo chính quy về chẩn đoán, điều trị và chăm sóc sức khỏe răng miệng.',
    },
    {
      degree:
        index < 3 ? 'Thạc sĩ Răng Hàm Mặt' : 'Chứng nhận đào tạo sau đại học',
      school: 'Viện Đào tạo Nha khoa Quốc tế',
      major: doctorSpecializations[index],
      graduationYear: 2016 + (index % 5),
      description:
        'Đào tạo nâng cao về lập kế hoạch điều trị và ứng dụng công nghệ số trong nha khoa.',
    },
  ],
  certificates: [
    {
      title: `Chứng chỉ chuyên sâu ${doctorSpecializations[index]}`,
      issuer: 'Smart Dental Academy',
      issuedAt: new Date(Date.UTC(2021, index % 12, 10)),
      imageUrl: doctorMediaUrls[index % doctorMediaUrls.length],
      description:
        'Chứng nhận năng lực chuyên môn sau chương trình đào tạo thực hành lâm sàng.',
    },
    {
      title: 'Chứng nhận kiểm soát nhiễm khuẩn nha khoa',
      issuer: 'Hiệp hội Nha khoa Việt Nam',
      issuedAt: new Date(Date.UTC(2022, index % 12, 18)),
      imageUrl: doctorMediaUrls[(index + 1) % doctorMediaUrls.length],
      description:
        'Đào tạo quy trình vô khuẩn, an toàn người bệnh và quản lý dụng cụ nha khoa.',
    },
  ],
  media: [
    {
      url: doctorMediaUrls[index % doctorMediaUrls.length],
      alt: `Minh chứng chuyên môn của ${doctorNames[index]}`,
      type: 'CERTIFICATE',
    },
    {
      url: doctorMediaUrls[(index + 2) % doctorMediaUrls.length],
      alt: `${doctorNames[index]} trong môi trường lâm sàng`,
      type: 'PROFILE',
    },
  ],
}));

const serviceImageUrls = {
  dentalCheckup:
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=80',
  teethCleaning:
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
  dentalFilling:
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
  rootCanal:
    'https://images.unsplash.com/photo-1588776813677-77aaf5595b83?auto=format&fit=crop&w=1200&q=80',
  teethWhitening:
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=80',
  toothExtraction:
    'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1200&q=80',
  braces:
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80',
  dentalCrown:
    'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=1200&q=80',
  implant:
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
  kidsDental:
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=80',
} as const;

const services = [
  {
    category: 'Implant',
    name: 'Trồng răng Implant',
    slug: 'trong-rang-implant',
    icon: '/service/trông răng implant.png',
    shortDescription: 'Cấy ghép răng giả cố định, khôi phục thẩm mỹ và chức năng ăn nhai hoàn hảo như răng thật.',
    description: 'Giải pháp cấy ghép trụ Implant sinh học vào xương hàm thay thế chân răng đã mất, nâng đỡ mão răng sứ bền chắc lâu dài.',
    thumbnailUrl: serviceImageUrls.implant,
    durationMinutes: 60,
    basePrice: '13000000',
    isFeatured: true,
    displayOrder: 1,
  },
  {
    category: 'Phục hình',
    name: 'Bọc răng sứ',
    slug: 'boc-rang-su',
    icon: '/service/bọc sứ.png',
    shortDescription: 'Khôi phục hình dáng và chức năng của răng tổn thương bằng mão sứ.',
    description: 'Bọc mão sứ giúp bảo vệ răng đã chữa tủy, răng vỡ mẻ lớn hoặc cải thiện thẩm mỹ nụ cười.',
    thumbnailUrl: serviceImageUrls.dentalCrown,
    durationMinutes: 90,
    basePrice: '3500000',
    isFeatured: true,
    displayOrder: 2,
  },
  {
    category: 'Thẩm mỹ',
    name: 'Dán sứ Veneer',
    slug: 'dan-su-veneer',
    icon: '/service/Dán sứ.png',
    shortDescription: 'Mặt dán sứ siêu mỏng bảo tồn răng thật tối đa, mang lại nụ cười rạng rỡ.',
    description: 'Dán sứ Veneer sử dụng mặt sứ siêu mỏng (0.3 - 0.5mm) dán lên mặt trước răng để cải thiện màu sắc, hình dáng mà ít mài răng.',
    thumbnailUrl: serviceImageUrls.dentalCrown,
    durationMinutes: 60,
    basePrice: '8000000',
    isFeatured: true,
    displayOrder: 3,
  },
  {
    category: 'Chỉnh nha',
    name: 'Niềng răng',
    slug: 'nieng-rang',
    icon: '/service/niềng răng.png',
    shortDescription: 'Chỉnh nha bằng khay niềng trong suốt Invisalign, thẩm mỹ và tiện lợi.',
    description: 'Sử dụng các khay nhựa y tế trong suốt thiết kế riêng để dịch chuyển răng, có thể tháo lắp dễ dàng khi ăn uống.',
    thumbnailUrl: serviceImageUrls.braces,
    durationMinutes: 45,
    basePrice: '45000000',
    isFeatured: true,
    displayOrder: 4,
  },
  {
    category: 'Chỉnh nha',
    name: 'Niềng răng mắc cài',
    slug: 'nieng-rang-mac-cai',
    icon: '/service/niềng răng mắc cài.png',
    shortDescription: 'Nắn chỉnh răng lệch lạc, khớp cắn sai lệch bằng hệ thống mắc cài.',
    description: 'Phương pháp chỉnh nha truyền thống và hiện đại sử dụng mắc cài kim loại hoặc sứ để kéo răng về đúng vị trí.',
    thumbnailUrl: serviceImageUrls.braces,
    durationMinutes: 45,
    basePrice: '25000000',
    isFeatured: false,
    displayOrder: 5,
  },
  {
    category: 'Tiểu phẫu',
    name: 'Nhổ răng khôn',
    slug: 'nho-rang-khon',
    icon: '/service/nho rang khon.png',
    shortDescription: 'Nhổ răng khôn mọc lệch, mọc ngầm an toàn bằng công nghệ sóng siêu âm.',
    description: 'Tiểu phẫu nhổ răng khôn mọc lệch, mọc kẹt tránh biến chứng sưng viêm nguy hiểm với công nghệ Piezotome.',
    thumbnailUrl: serviceImageUrls.toothExtraction,
    durationMinutes: 45,
    basePrice: '2000000',
    isFeatured: true,
    displayOrder: 7,
  },
  {
    category: 'Tổng quát',
    name: 'Nha khoa tổng quát',
    slug: 'nha-khoa-tong-quat',
    icon: '/service/nha khoa tong quat.png',
    shortDescription: 'Chăm sóc răng miệng định kỳ, cạo vôi răng và điều trị tổng quát.',
    description: 'Các dịch vụ cơ bản chăm sóc và bảo vệ sức khỏe răng miệng bao gồm khám định kỳ, cạo vôi răng, trám răng sâu và chữa tủy.',
    thumbnailUrl: serviceImageUrls.dentalCheckup,
    durationMinutes: 30,
    basePrice: '150000',
    isFeatured: false,
    displayOrder: 6,
  },
  {
    category: 'Nha khoa trẻ em',
    name: 'Nha khoa trẻ em',
    slug: 'nha-khoa-tre-em',
    icon: '/service/Nha khoa tre em.png',
    shortDescription: 'Khám răng nhẹ nhàng và điều trị dự phòng sâu răng cho bé.',
    description: 'Dịch vụ nha khoa thân thiện giúp bé thoải mái khám răng, nhổ răng sữa và bôi vecni flour bảo vệ men răng.',
    thumbnailUrl: serviceImageUrls.kidsDental,
    durationMinutes: 30,
    basePrice: '150000',
    isFeatured: false,
    displayOrder: 8,
  },
];

const obsoleteServiceSlugFallbacks: Record<string, string> = {
  'dental-checkup': 'nha-khoa-tong-quat',
  'teeth-cleaning': 'nha-khoa-tong-quat',
  'dental-filling': 'nha-khoa-tong-quat',
  'root-canal-treatment': 'nha-khoa-tong-quat',
  'tooth-extraction': 'nho-rang-khon',
  'braces-consultation': 'nieng-rang',
  'nieng-rang-trong-suot': 'nieng-rang',
  'teeth-whitening': 'dan-su-veneer',
  'dental-crown': 'boc-rang-su',
  'boc-su-tham-my': 'boc-rang-su',
  'implant-consultation': 'trong-rang-implant',
  'kids-dental-care': 'nha-khoa-tre-em',
};

const treatmentMethodsBySlug = {
  'trong-rang-implant': [
    {
      name: 'Trụ Implant Hàn Quốc (Osstem / Dentium)',
      slug: 'implant-korea-osstem',
      description: 'Trụ Implant phổ biến nhất Châu Á, tích hợp xương ổn định, chi phí tối ưu.',
      basePrice: '13000000',
      durationMinutes: 60,
      media: [{ url: serviceImageUrls.implant, alt: 'Implant Hàn Quốc Osstem', type: 'BANNER' }],
      steps: [
        ['Thăm khám & Chụp CT 3D', 'Đánh giá thể tích xương hàm và vị trí cấy ghép lý tưởng.', 15],
        ['Đặt trụ Implant', 'Tiểu phẫu nhẹ nhàng đặt trụ Implant Hàn Quốc vào xương hàm.', 30],
        ['Phục hình răng sứ', 'Gắn mão sứ lên trụ Implant sau khi tích hợp xương hoàn tất.', 15],
      ],
      faqs: [['Trụ Implant Hàn Quốc sử dụng được bao lâu?', 'Tuổi thọ lên đến 20 năm hoặc trọn đời nếu được chăm sóc vệ sinh đúng cách.']],
    },
    {
      name: 'Trụ Implant Mỹ (Hiossen / Dentium USA)',
      slug: 'implant-usa-hiossen',
      description: 'Thiết kế hoàn hảo đạt tiêu chuẩn FDA Mỹ, khả năng tích hợp xương vượt trội.',
      basePrice: '17000000',
      durationMinutes: 60,
      media: [{ url: serviceImageUrls.implant, alt: 'Implant Mỹ Hiossen', type: 'BANNER' }],
      steps: [
        ['Lập kế hoạch 3D', 'Định vị trụ Implant bằng phần mềm mô phỏng hiện đại.', 15],
        ['Cấy ghép trụ Hiossen', 'Đặt trụ Implant Mỹ vào vùng xương hàm.', 30],
        ['Phục hình răng sứ', 'Gắn mão sứ hoàn thiện nụ cười.', 15],
      ],
      faqs: [['Implant Mỹ có ưu điểm gì so với các loại khác?', 'Xử lý bề mặt tiên tiến giúp thời gian tích hợp xương nhanh hơn 2-3 tuần.']],
    },
    {
      name: 'Trụ Implant Thụy Sĩ (Straumann SLActive)',
      slug: 'implant-switzerland-straumann',
      description: 'Dòng trụ Implant cao cấp nhất thế giới, tích hợp xương chỉ trong 3-4 tuần.',
      basePrice: '24000000',
      durationMinutes: 45,
      media: [{ url: serviceImageUrls.implant, alt: 'Implant Thụy Sĩ Straumann SLActive', type: 'BANNER' }],
      steps: [
        ['Khám chuyên sâu', 'Phân tích mật độ xương và sức khỏe tổng quát.', 10],
        ['Cấy ghép công nghệ cao', 'Đặt trụ Straumann với độ chính xác tuyệt đối.', 25],
        ['Lắp răng sứ tức thì', 'Có thể phục hình răng tạm/thật trong thời gian ngắn.', 10],
      ],
      faqs: [['Vì sao Straumann được gọi là Implant tốt nhất?', 'Bề mặt SLActive kháng viêm và kích thích tế bào xương phát triển kỷ lục.']],
    },
    {
      name: 'Trồng răng Implant Toàn hàm (All-on-4 / All-on-6)',
      slug: 'implant-all-on-4-6',
      description: 'Giải pháp tối ưu cho người mất toàn bộ răng, chỉ dùng 4-6 trụ nâng đỡ cả hàm răng.',
      basePrice: '110000000',
      durationMinutes: 120,
      media: [{ url: serviceImageUrls.implant, alt: 'Implant All-on-4 / All-on-6', type: 'BANNER' }],
      steps: [
        ['Khảo sát & Thiết kế hàm', 'Lập bản đồ cấy ghép 4 hoặc 6 trụ nâng đỡ toàn bộ cầu răng.', 30],
        ['Phẫu thuật đặt trụ', 'Cấy ghép 4-6 trụ Implant trong một lần.', 60],
        ['Gắn cầu răng cố định', 'Gắn cầu răng thẩm mỹ cho phép ăn nhai ngay sau điều trị.', 30],
      ],
      faqs: [['All-on-4 có đau nhiều không?', 'Bệnh nhân được tiêm tê tại chỗ hoặc tiền mê nên hoàn toàn nhẹ nhàng không đau.']],
    },
  ],
  'boc-rang-su': [
    {
      name: 'Răng sứ Titan',
      slug: 'crown-titan',
      description: 'Hợp kim Titan bền chắc kết hợp lớp sứ ngoài phủ thẩm mỹ, thích hợp cho răng hàm.',
      basePrice: '2500000',
      durationMinutes: 60,
      media: [{ url: serviceImageUrls.dentalCrown, alt: 'Răng sứ Titan', type: 'PROCESS' }],
      steps: [
        ['Mài cùi răng', 'Mài nhẹ lớp men ngoài tạo khoảng trống cho mão sứ.', 30],
        ['Lấy dấu & Lắp răng tạm', 'Bảo vệ răng thật trong khi chờ chế tác răng sứ.', 30],
      ],
      faqs: [['Răng sứ Titan có bị đen viền nướu không?', 'Sau nhiều năm sử dụng, kim loại bên trong có thể bị oxy hóa nhẹ gây bóng nướu.']],
    },
    {
      name: 'Răng sứ Zirconia',
      slug: 'crown-zirconia',
      description: 'Răng toàn sứ chất lượng cao, bền màu, không đen viền nướu.',
      basePrice: '4500000',
      durationMinutes: 60,
      media: [{ url: serviceImageUrls.dentalCrown, alt: 'Răng sứ Zirconia', type: 'PROCESS' }],
      steps: [
        ['Mài cùi răng', 'Chuẩn bị cùi răng sinh lý tối thiểu.', 30],
        ['Quét dấu răng kỹ thuật số', 'Lấy dấu bằng máy quét CAD/CAM cực kỳ chính xác.', 30],
      ],
      faqs: [['Bảo hành răng sứ Zirconia trong bao lâu?', 'Bảo hành chính hãng từ 5 đến 7 năm.']],
    },
    {
      name: 'Răng sứ Cercon HT',
      slug: 'crown-cercon',
      description: 'Dòng răng sứ cao cấp xuất xứ Đức, độ cứng cao và thẩm mỹ tối ưu.',
      basePrice: '6500000',
      durationMinutes: 60,
      media: [{ url: serviceImageUrls.dentalCrown, alt: 'Răng sứ Cercon HT', type: 'PROCESS' }],
      steps: [
        ['Mài cùi răng', 'Mài chuẩn xác theo tỷ lệ tối thiểu.', 30],
        ['Lấy dấu răng', 'Chế tác bằng công nghệ CAD/CAM chính xác 100%.', 30],
      ],
      faqs: [['Cercon HT có bảo hành không?', 'Bảo hành chính hãng 10 năm.']],
    },
    {
      name: 'Mão sứ thủy tinh IPS E.Max',
      slug: 'crown-emax',
      description: 'Sứ thủy tinh cao cấp, độ trong suốt tự nhiên như răng thật.',
      basePrice: '8000000',
      durationMinutes: 60,
      media: [{ url: serviceImageUrls.dentalCrown, alt: 'Mão sứ thủy tinh IPS E.Max', type: 'PROCESS' }],
      steps: [
        ['Chuẩn bị răng', 'Mài chỉnh răng tối thiểu.', 30],
        ['Gắn mão sứ', 'Gắn keo nha khoa chuyên dụng và chiếu đèn.', 30],
      ],
      faqs: [['Răng E.Max có bền không?', 'IPS E.Max chịu lực ăn nhai tốt và cực bền nếu chăm sóc đúng cách.']],
    },
  ],
  'dan-su-veneer': [
    {
      name: 'Dán sứ Veneer E.Max Press',
      slug: 'veneer-emax-press',
      description: 'Mặt dán sứ siêu mỏng 0.3mm chế tác từ phôi sứ E.Max Press chịu lực cao.',
      basePrice: '8000000',
      durationMinutes: 60,
      media: [{ url: serviceImageUrls.dentalCrown, alt: 'Dán sứ Veneer EMax Press', type: 'PROCESS' }],
      steps: [
        ['Chuẩn bị bề mặt', 'Chỉnh nhẹ lớp men ngoài răng 0.3mm.', 30],
        ['Dán mặt sứ', 'Sử dụng xi măng dán nha khoa cường lực cố định mặt sứ.', 30],
      ],
      faqs: [['Dán sứ Veneer có đau không?', 'Hạn chế mài tối đa nên hoàn toàn không ê buốt hay đau đớn.']],
    },
    {
      name: 'Dán sứ Veneer Lisi Ultra thin',
      slug: 'veneer-lisi-ultra',
      description: 'Dòng mặt dán sứ siêu mỏng cao cấp từ Nhật Bản, độ trong suốt và tương thích sinh học hoàn hảo.',
      basePrice: '10000000',
      durationMinutes: 60,
      media: [{ url: serviceImageUrls.dentalCrown, alt: 'Dán sứ Veneer Lisi', type: 'PROCESS' }],
      steps: [
        ['Vệ sinh & So màu', 'Lựa chọn tông màu trắng trong tự nhiên thích hợp.', 20],
        ['Tạo hình & Dán sứ', 'Sửa soạn bề mặt siêu mỏng và cố định mặt dán sứ.', 40],
      ],
      faqs: [['Veneer Lisi mỏng bao nhiêu?', 'Veneer Lisi có độ mỏng đáng kinh ngạc chỉ từ 0.2mm.']],
    },
  ],
  'nieng-rang': [
    {
      name: 'Niềng răng Trong suốt Invisalign Lite',
      slug: 'braces-invisalign-lite',
      description: 'Gói chỉnh nha Invisalign dành cho các ca lệch lạc nhẹ, thời gian điều trị ngắn.',
      basePrice: '45000000',
      durationMinutes: 45,
      media: [{ url: serviceImageUrls.braces, alt: 'Invisalign Lite', type: 'PROCESS' }],
      steps: [
        ['Scan răng 3D iTero', 'Mô phỏng nụ cười tương lai bằng công nghệ scan hiện đại.', 20],
        ['Giao khay & Hướng dẫn', 'Bác sĩ bàn giao khay niềng đầu tiên và hướng dẫn tháo lắp.', 25],
      ],
      faqs: [['Một ngày cần đeo khay bao nhiêu tiếng?', 'Nên đeo tối thiểu 20-22 tiếng mỗi ngày để đạt hiệu quả tối ưu.']],
    },
    {
      name: 'Niềng răng Trong suốt Invisalign Full',
      slug: 'braces-invisalign-full',
      description: 'Chỉnh nha trong suốt toàn diện cho mọi mức độ phức tạp của răng và khớp cắn.',
      basePrice: '90000000',
      durationMinutes: 45,
      media: [{ url: serviceImageUrls.braces, alt: 'Invisalign Full', type: 'PROCESS' }],
      steps: [
        ['Scan răng & Lập phác đồ', 'Sử dụng phần mềm ClinCheck lên lộ trình dịch chuyển răng chính xác.', 20],
        ['Điều trị & Theo dõi', 'Tái khám định kỳ mỗi 6-8 tuần để kiểm tra tiến trình.', 25],
      ],
      faqs: [['Invisalign Full có giới hạn số lượng khay không?', 'Không giới hạn số lượng khay cho đến khi đạt kết quả mong muốn.']],
    },
  ],
  'nieng-rang-mac-cai': [
    {
      name: 'Niềng răng Mắc cài Kim loại Truyền thống',
      slug: 'braces-metal-traditional',
      description: 'Phương pháp chỉnh nha hiệu quả cao, tiết kiệm chi phí phù hợp cho học sinh, sinh viên.',
      basePrice: '25000000',
      durationMinutes: 45,
      media: [{ url: serviceImageUrls.braces, alt: 'Mắc cài kim loại truyền thống', type: 'PROCESS' }],
      steps: [
        ['Lập phác đồ chỉnh nha', 'Lấy dấu, chụp phim X-quang và lên kế hoạch dịch chuyển.', 15],
        ['Gắn mắc cài', 'Dán mắc cài lên bề mặt răng và đi dây cung.', 30],
      ],
      faqs: [['Thời gian niềng răng mắc cài thường là bao lâu?', 'Kéo dài từ 18 đến 24 tháng tùy độ phức tạp của răng.']],
    },
    {
      name: 'Niềng răng Mắc cài Sứ Thẩm mỹ',
      slug: 'braces-ceramic',
      description: 'Sử dụng mắc cài bằng sứ màu sắc tương đồng răng thật, tăng tính thẩm mỹ khi giao tiếp.',
      basePrice: '35000000',
      durationMinutes: 45,
      media: [{ url: serviceImageUrls.braces, alt: 'Mắc cài sứ thẩm mỹ', type: 'PROCESS' }],
      steps: [
        ['Kiểm tra răng miệng', 'Làm sạch cao răng, điều trị sâu răng trước khi niềng.', 15],
        ['Gắn mắc cài sứ', 'Gắn cố định các mắc cài sứ thẩm mỹ.', 30],
      ],
      faqs: [['Mắc cài sứ có dễ vỡ không?', 'Mắc cài sứ hiện đại làm từ sứ nguyên khối cường lực rất chắc chắn và ít nứt vỡ.']],
    },
  ],
  'nho-rang-khon': [
    {
      name: 'Nhổ răng khôn mọc lệch hàm trên',
      slug: 'wisdom-tooth-upper',
      description: 'Nhổ bỏ răng khôn hàm trên mọc lệch, tránh xô lệch cung răng và sâu răng kế cận.',
      basePrice: '1500000',
      durationMinutes: 30,
      media: [{ url: serviceImageUrls.toothExtraction, alt: 'Nhổ răng khôn hàm trên', type: 'PROCESS' }],
      steps: [
        ['Khám & Chụp phim', 'Xác định vị trí chân răng và dây thần kinh.', 10],
        ['Tiểu phẫu nhổ răng', 'Gây tê và tiến hành lấy răng khôn nhanh chóng.', 20],
      ],
      faqs: [['Nhổ răng khôn hàm trên có nguy hiểm không?', 'Nhổ răng khôn hàm trên thường nhanh và đơn giản hơn hàm dưới, ít sưng đau.']],
    },
    {
      name: 'Nhổ răng khôn mọc ngầm/lệch hàm dưới',
      slug: 'wisdom-tooth-lower',
      description: 'Tiểu phẫu loại bỏ răng khôn mọc ngầm, mọc đâm ngang gây đau nhức.',
      basePrice: '2500000',
      durationMinutes: 45,
      media: [{ url: serviceImageUrls.toothExtraction, alt: 'Nhổ răng khôn hàm dưới', type: 'PROCESS' }],
      steps: [
        ['Gây tê & Tạo vạt', 'Bộc lộ vùng răng khôn mọc ngầm.', 15],
        ['Chia cắt chân răng', 'Lấy răng khôn ra từng phần để hạn chế tổn thương xương.', 30],
      ],
      faqs: [['Nhổ răng khôn hàm dưới có sưng không?', 'Thường sưng nhẹ từ 2-3 ngày, bác sĩ sẽ kê đơn thuốc kháng viêm giảm sưng.']],
    },
    {
      name: 'Nhổ răng khôn siêu âm Piezotome',
      slug: 'wisdom-tooth-piezotome',
      description: 'Nhổ răng khôn bằng sóng siêu âm không đau, giảm sưng tối đa và phục hồi cực nhanh.',
      basePrice: '3500000',
      durationMinutes: 45,
      media: [{ url: serviceImageUrls.toothExtraction, alt: 'Nhổ răng khôn Piezotome', type: 'PROCESS' }],
      steps: [
        ['Chuẩn bị & Gây tê', 'Gây tê và chuẩn bị máy siêu âm Piezotome.', 15],
        ['Bóc tách siêu âm', 'Dùng sóng siêu âm tách mô mềm và chân răng nhẹ nhàng.', 30],
      ],
      faqs: [['Tại sao nên chọn nhổ răng Piezotome?', 'Máy chỉ tác động lên mô cứng (răng, xương), bảo vệ hoàn hảo mô mềm và mạch máu.']],
    },
  ],
  'nha-khoa-tong-quat': [
    {
      name: 'Khám răng tổng quát tiêu chuẩn',
      slug: 'checkup-standard',
      description: 'Thăm khám trực tiếp với bác sĩ chuyên khoa, phát hiện sớm các vấn đề răng miệng.',
      basePrice: '150000',
      durationMinutes: 30,
      media: [{ url: serviceImageUrls.dentalCheckup, alt: 'Khám tổng quát', type: 'PROCESS' }],
      steps: [
        ['Khám trực quan', 'Soi đèn & kiểm tra toàn bộ răng nướu.', 20],
        ['Tư vấn chăm sóc', 'Tư vấn vệ sinh răng miệng và thói quen sinh hoạt.', 10],
      ],
      faqs: [['Bao lâu nên đi khám răng định kỳ?', 'Nên duy trì khám răng định kỳ mỗi 6 tháng một lần.']],
    },
    {
      name: 'Cạo vôi răng Siêu âm Tiêu chuẩn',
      slug: 'cleaning-ultrasonic-standard',
      description: 'Sử dụng máy siêu âm nhẹ nhàng loại bỏ mảng bám và cao răng cứng đầu.',
      basePrice: '250000',
      durationMinutes: 30,
      media: [{ url: serviceImageUrls.teethCleaning, alt: 'Cạo vôi siêu âm', type: 'PROCESS' }],
      steps: [
        ['Cạo vôi siêu âm', 'Làm sạch cao răng trên và dưới nướu.', 20],
        ['Đánh bóng răng', 'Làm mịn bề mặt răng giúp hạn chế mảng bám tích tụ.', 10],
      ],
      faqs: [['Cạo vôi răng có làm mòn men răng không?', 'Không, sóng siêu âm chỉ làm rung và bong mảng bám cao răng.']],
    },
    {
      name: 'Trám răng Composite Thẩm mỹ',
      slug: 'filling-composite',
      description: 'Trám phục hồi răng sâu, răng sứt mẻ bằng vật liệu composite thẩm mỹ cùng màu răng thật.',
      basePrice: '400000',
      durationMinutes: 30,
      media: [{ url: serviceImageUrls.dentalFilling, alt: 'Trám răng thẩm mỹ', type: 'PROCESS' }],
      steps: [
        ['Làm sạch xoang sâu', 'Loại bỏ phần mô răng bị sâu hỏng.', 15],
        ['Trám phục hình', 'Đắp vật liệu composite và chiếu đèn đông cứng.', 15],
      ],
      faqs: [['Miếng trám composite sử dụng được bao lâu?', 'Có thể duy trì từ 3-5 năm nếu vệ sinh răng miệng tốt.']],
    },
    {
      name: 'Điều trị tủy răng',
      slug: 'root-canal-general',
      description: 'Lấy sạch tủy viêm, sát khuẩn và trám bít ống tủy để giữ lại răng thật.',
      basePrice: '1800000',
      durationMinutes: 60,
      media: [{ url: serviceImageUrls.rootCanal, alt: 'Điều trị tủy', type: 'PROCESS' }],
      steps: [
        ['Mở tủy & Lấy tủy viêm', 'Hút sạch mô tủy bị nhiễm trùng gây đau nhức.', 30],
        ['Trám bít ống tủy', 'Sử dụng nhựa côn nha khoa trám bít kín khít ống tủy.', 30],
      ],
      faqs: [['Tại sao phải chữa tủy răng?', 'Giúp loại bỏ cơn đau răng dữ dội và bảo tồn tối đa răng thật không phải nhổ bỏ.']],
    },
  ],
  'nha-khoa-tre-em': [
    {
      name: 'Nhổ răng sữa không đau cho bé',
      slug: 'kids-extraction-milk-tooth',
      description: 'Nhổ răng sữa lung lay đến tuổi thay thế cực kỳ nhẹ nhàng, bôi tê vị hoa quả ngọt ngào.',
      basePrice: '150000',
      durationMinutes: 20,
      media: [{ url: serviceImageUrls.kidsDental, alt: 'Nhổ răng sữa cho bé', type: 'PROCESS' }],
      steps: [
        ['Bôi tê vị trái cây', 'Giúp bé không có cảm giác đau khi nhổ.', 10],
        ['Nhổ răng sữa', 'Thực hiện nhanh gọn tránh tạo tâm lý sợ hãi cho trẻ.', 10],
      ],
      faqs: [['Khi nào nên nhổ răng sữa cho trẻ?', 'Nên nhổ khi răng đã lung lay nhiều hoặc răng vĩnh viễn bắt đầu mọc nhú lên.']],
    },
    {
      name: 'Bôi Vecni Fluoride phòng ngừa sâu răng',
      slug: 'kids-fluoride-varnish',
      description: 'Phủ một lớp gel Vecni Fluoride chuyên dụng giúp tái khoáng hóa và củng cố men răng cho bé.',
      basePrice: '300000',
      durationMinutes: 20,
      media: [{ url: serviceImageUrls.kidsDental, alt: 'Bôi Vecni Fluoride', type: 'PROCESS' }],
      steps: [
        ['Làm sạch răng', 'Dùng gạc làm sạch bề mặt răng của trẻ.', 10],
        ['Quét vecni Fluoride', 'Phủ lớp vecni bảo vệ lên các mặt răng.', 10],
      ],
      faqs: [['Bôi Vecni Fluoride mấy tháng một lần?', 'Nên bôi định kỳ mỗi 3-6 tháng một lần để phòng ngừa sâu răng hiệu quả nhất.']],
    },
  ],
};

const treatmentMethodSeedOverrides: Record<
  string,
  {
    name: string;
    slug: string;
    description: string;
    basePrice?: string;
    durationMinutes?: number;
  }
> = {
  'implant-korea-osstem': {
    name: 'Cấy ghép Implant đơn lẻ',
    slug: 'implant-single',
    description:
      'Phục hồi một răng mất bằng một trụ Implant và mão sứ riêng lẻ, bảo tồn răng kế cận và khôi phục ăn nhai chắc chắn.',
    basePrice: '13000000',
    durationMinutes: 60,
  },
  'implant-usa-hiossen': {
    name: 'Cấy ghép Implant nhiều răng',
    slug: 'implant-multiple',
    description:
      'Phục hồi nhiều răng mất bằng các trụ Implant nâng đỡ cầu răng sứ, phù hợp khi mất răng liền kề hoặc rải rác.',
    basePrice: '32000000',
    durationMinutes: 90,
  },
  'implant-switzerland-straumann': {
    name: 'Implant toàn hàm All-on-4 / All-on-6',
    slug: 'implant-full-arch',
    description:
      'Giải pháp phục hồi toàn hàm cố định trên 4 đến 6 trụ Implant, dành cho người mất nhiều răng hoặc mất răng toàn hàm.',
    basePrice: '110000000',
    durationMinutes: 120,
  },
  'implant-all-on-4-6': {
    name: 'Nâng xoang, ghép xương trước Implant',
    slug: 'implant-bone-graft',
    description:
      'Bổ sung thể tích xương hàm khi xương thiếu hoặc tiêu xương, tạo nền ổn định trước khi cấy ghép Implant.',
    basePrice: '8000000',
    durationMinutes: 75,
  },
  'crown-titan': {
    name: 'Bọc răng sứ kim loại Titan',
    slug: 'crown-titan',
    description:
      'Mão sứ lõi Titan bền chắc, chi phí hợp lý, thường dùng cho răng hàm cần phục hồi chức năng ăn nhai.',
  },
  'crown-zirconia': {
    name: 'Bọc răng toàn sứ Zirconia',
    slug: 'crown-zirconia',
    description:
      'Mão toàn sứ thẩm mỹ, không ánh kim, phù hợp phục hồi răng trước và răng hàm với độ bền cao.',
  },
  'crown-cercon': {
    name: 'Bọc răng sứ Cercon',
    slug: 'crown-cercon',
    description:
      'Dòng răng sứ cao cấp có độ chính xác và độ trong tốt, cân bằng giữa thẩm mỹ và khả năng chịu lực.',
  },
  'crown-emax': {
    name: 'Bọc răng sứ E.Max',
    slug: 'crown-emax',
    description:
      'Mão sứ thủy tinh có độ trong tự nhiên, phù hợp các răng vùng thẩm mỹ cần màu sắc hài hòa.',
  },
  'veneer-emax-press': {
    name: 'Dán sứ Veneer E.Max',
    slug: 'veneer-emax',
    description:
      'Mặt dán sứ mỏng giúp cải thiện màu sắc, hình thể răng và khe thưa nhẹ với mức mài răng tối thiểu.',
  },
  'veneer-lisi-ultra': {
    name: 'Dán sứ Veneer siêu mỏng',
    slug: 'veneer-ultra-thin',
    description:
      'Mặt dán sứ siêu mỏng cho các trường hợp men răng còn tốt, ưu tiên bảo tồn răng thật và thẩm mỹ tự nhiên.',
  },
  'braces-invisalign-lite': {
    name: 'Niềng răng trong suốt mức độ nhẹ',
    slug: 'clear-aligner-lite',
    description:
      'Khay niềng trong suốt cho răng chen chúc, thưa hoặc lệch nhẹ, dễ tháo lắp khi ăn uống và vệ sinh.',
  },
  'braces-invisalign-full': {
    name: 'Niềng răng trong suốt toàn diện',
    slug: 'clear-aligner-full',
    description:
      'Chỉnh nha bằng khay trong suốt cho kế hoạch điều trị toàn diện, theo dõi tiến trình bằng mô phỏng kỹ thuật số.',
  },
  'braces-metal-traditional': {
    name: 'Niềng răng mắc cài kim loại',
    slug: 'braces-metal',
    description:
      'Mắc cài kim loại cho hiệu quả kéo chỉnh ổn định, phù hợp nhiều mức độ lệch lạc và tối ưu chi phí.',
  },
  'braces-ceramic': {
    name: 'Niềng răng mắc cài sứ',
    slug: 'braces-ceramic',
    description:
      'Mắc cài sứ có màu gần giống răng thật, phù hợp người cần chỉnh nha cố định nhưng vẫn ưu tiên thẩm mỹ.',
  },
  'wisdom-tooth-upper': {
    name: 'Nhổ răng khôn hàm trên',
    slug: 'wisdom-tooth-upper',
    description:
      'Loại bỏ răng khôn hàm trên mọc lệch hoặc gây nhồi nhét thức ăn, quy trình thường nhanh và ít sưng hơn.',
  },
  'wisdom-tooth-lower': {
    name: 'Nhổ răng khôn hàm dưới mọc lệch/ngầm',
    slug: 'wisdom-tooth-lower',
    description:
      'Tiểu phẫu răng khôn hàm dưới mọc lệch, mọc ngầm hoặc đâm ngang, kiểm soát đau và hạn chế biến chứng.',
  },
  'wisdom-tooth-piezotome': {
    name: 'Nhổ răng khôn bằng Piezotome',
    slug: 'wisdom-tooth-piezotome',
    description:
      'Ứng dụng sóng siêu âm hỗ trợ tách mô cứng chính xác, giảm sang chấn mô mềm và rút ngắn thời gian hồi phục.',
  },
  'checkup-standard': {
    name: 'Khám răng tổng quát',
    slug: 'checkup-standard',
    description:
      'Kiểm tra răng, nướu, khớp cắn và tư vấn kế hoạch chăm sóc hoặc điều trị phù hợp.',
  },
  'cleaning-ultrasonic-standard': {
    name: 'Cạo vôi và đánh bóng răng',
    slug: 'cleaning-ultrasonic-standard',
    description:
      'Làm sạch cao răng, mảng bám và đánh bóng bề mặt răng giúp nướu khỏe và hơi thở dễ chịu hơn.',
  },
  'filling-composite': {
    name: 'Trám răng Composite thẩm mỹ',
    slug: 'filling-composite',
    description:
      'Phục hồi răng sâu, mẻ nhỏ hoặc hở kẽ bằng vật liệu composite cùng màu răng.',
  },
  'root-canal-general': {
    name: 'Điều trị tủy răng',
    slug: 'root-canal-general',
    description:
      'Làm sạch mô tủy viêm, sát khuẩn ống tủy và trám bít để bảo tồn răng thật.',
  },
  'kids-extraction-milk-tooth': {
    name: 'Nhổ răng sữa cho bé',
    slug: 'kids-extraction-milk-tooth',
    description:
      'Nhổ răng sữa lung lay hoặc đến tuổi thay răng bằng quy trình nhẹ nhàng, giúp trẻ bớt lo lắng.',
  },
  'kids-fluoride-varnish': {
    name: 'Bôi Fluoride phòng sâu răng',
    slug: 'kids-fluoride-varnish',
    description:
      'Phủ Fluoride giúp tái khoáng men răng, hỗ trợ phòng ngừa sâu răng cho trẻ em.',
  },
};

const promotions = [
  {
    code: 'NIENGRANG30',
    name: 'Ưu Đãi Niềng Răng Thẩm Mỹ 30%',
    description:
      'Giảm ngay 30% gói Niềng Răng Thẩm Mỹ (Mắc cài & Trong suốt). Mô phỏng nụ cười 3D ClinCheck miễn phí và tặng bộ kit vệ sinh nha khoa.',
    imageUrl:
      'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763841/smart-dental/promotions/banner-nieng-rang.png',
    applicableServiceSlug: 'nieng-rang',
    discountType: 'PERCENTAGE' as const,
    discountValue: '30',
    minOrderAmount: '15000000',
    maxUses: 100,
    usedCount: 24,
    startDate: addDays(-10),
    endDate: addDays(60),
    isActive: true,
  },
  {
    code: 'IMPLANT5M',
    name: 'Trồng Răng Implant Giảm Ngay 5 Triệu',
    description:
      'Trồng răng Implant chuyên nghiệp giảm trực tiếp 5.000.000đ cho mỗi trụ Implant. Miễn phí chụp phim CT Cone Beam 3D kiểm tra mật độ xương.',
    imageUrl:
      'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763842/smart-dental/promotions/banner-implant.png',
    applicableServiceSlug: 'trong-rang-implant',
    discountType: 'FIXED_AMOUNT' as const,
    discountValue: '5000000',
    minOrderAmount: '12000000',
    maxUses: 50,
    usedCount: 15,
    startDate: addDays(-15),
    endDate: addDays(45),
    isActive: true,
  },
  {
    code: 'NHORANG500K',
    name: 'Nhổ Răng Không Đau Giảm 500K',
    description:
      'Tiểu phẫu nhổ răng khôn mọc lệch, mọc ngầm công nghệ siêu âm không đau, an toàn, hiệu quả. Giảm ngay 500.000đ khi đặt lịch khám trước.',
    imageUrl:
      'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763843/smart-dental/promotions/banner-nho-rang.png',
    applicableServiceSlug: 'nho-rang-khon',
    discountType: 'FIXED_AMOUNT' as const,
    discountValue: '500000',
    minOrderAmount: '2000000',
    maxUses: 200,
    usedCount: 88,
    startDate: addDays(-20),
    endDate: addDays(30),
    isActive: true,
  },
  {
    code: 'CAORANG99K',
    name: 'Lấy Cao Răng Siêu Âm Chỉ Từ 99K',
    description:
      'Dịch vụ lấy cao răng (cạo vôi răng) công nghệ sóng siêu âm nhẹ nhàng không buốt giá, làm sạch mảng bám mang lại hàm răng sáng bóng.',
    imageUrl:
      'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763844/smart-dental/promotions/banner-cao-rang.png',
    applicableServiceSlug: 'nha-khoa-tong-quat',
    discountType: 'FIXED_AMOUNT' as const,
    discountValue: '150000',
    minOrderAmount: '200000',
    maxUses: 300,
    usedCount: 142,
    startDate: addDays(-30),
    endDate: addDays(30),
    isActive: true,
  },
  {
    code: 'DIEUTRITUY20',
    name: 'Điều Trị Tủy Không Đau Giảm 20%',
    description:
      'Điều trị tủy răng không đau công nghệ hiện đại bảo tồn tối đa răng thật. Ưu đãi giảm 20% toàn bộ chi phí điều trị tủy áp dụng trong tháng.',
    imageUrl:
      'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785763846/smart-dental/promotions/banner-dieu-tri-tuy.png',
    applicableServiceSlug: 'nha-khoa-tong-quat',
    discountType: 'PERCENTAGE' as const,
    discountValue: '20',
    minOrderAmount: '1000000',
    maxUses: 150,
    usedCount: 35,
    startDate: addDays(-10),
    endDate: addDays(40),
    isActive: true,
  },
];

async function cleanObsoleteAccountsAndRoles() {
  const obsoleteUsers = await prisma.user.findMany({
    where: { email: { in: [...obsoleteStaffEmails] } },
    select: { id: true },
  });
  const obsoleteUserIds = obsoleteUsers.map((user) => user.id);

  if (obsoleteUserIds.length > 0) {
    await prisma.userRole.deleteMany({
      where: { userId: { in: obsoleteUserIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: obsoleteUserIds } },
    });
  }

  const obsoleteRoles = await prisma.role.findMany({
    where: { code: { in: [...obsoleteRoleCodes] } },
    select: { id: true },
  });
  const obsoleteRoleIds = obsoleteRoles.map((role) => role.id);

  if (obsoleteRoleIds.length > 0) {
    await prisma.rolePermission.deleteMany({
      where: { roleId: { in: obsoleteRoleIds } },
    });
    await prisma.userRole.deleteMany({
      where: { roleId: { in: obsoleteRoleIds } },
    });
    await prisma.role.deleteMany({
      where: { id: { in: obsoleteRoleIds } },
    });
  }
}

async function seedBaseData() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  await cleanObsoleteAccountsAndRoles();

  const createdRoles = new Map<string, { id: string }>();
  for (const [code, name, description] of roles) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name, description, isActive: true },
      create: { code, name, description, isActive: true },
      select: { id: true },
    });
    createdRoles.set(code, role);
  }

  const createdPermissions: Array<{ id: string; code: string }> = [];
  for (const [code, name, module, action] of permissions) {
    createdPermissions.push(
      await prisma.permission.upsert({
        where: { code },
        update: { name, module, action, description: `${name} permission` },
        create: {
          code,
          name,
          module,
          action,
          description: `${name} permission`,
        },
        select: { id: true, code: true },
      }),
    );
  }

  const permissionsByCode = new Map(
    createdPermissions.map((permission) => [permission.code, permission]),
  );
  const rolePermissionCodes: Record<string, string[]> = {
    ADMIN: createdPermissions.map((permission) => permission.code),
    DOCTOR: ['appointments.read', 'patients.manage', 'reports.read'],
    RECEPTIONIST: [
      'appointments.read',
      'appointments.manage',
      'patients.manage',
      'payments.manage',
    ],
    PATIENT: ['appointments.read'],
  };

  for (const [roleCode, permissionCodes] of Object.entries(
    rolePermissionCodes,
  )) {
    const role = createdRoles.get(roleCode)!;
    for (const permissionCode of permissionCodes) {
      const permission = permissionsByCode.get(permissionCode)!;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  for (const config of clinicConfigs) {
    await prisma.clinicConfig.upsert({
      where: { configKey: config.configKey },
      update: config,
      create: config,
    });
  }

  const adminAndReception = new Map<string, { id: string }>();
  for (const userSeed of adminUsers) {
    const user = await prisma.user.upsert({
      where: { email: userSeed.email },
      update: {
        fullName: userSeed.fullName,
        phone: userSeed.phone,
        passwordHash,
        status: userSeed.status,
        emailVerified: true,
      },
      create: {
        email: userSeed.email,
        fullName: userSeed.fullName,
        phone: userSeed.phone,
        passwordHash,
        status: userSeed.status,
        emailVerified: true,
      },
      select: { id: true },
    });

    const role = createdRoles.get(userSeed.roleCode)!;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
    adminAndReception.set(userSeed.roleCode, user);
  }

  const patients: Array<{ id: string; userId: string }> = [];
  const patientRole = createdRoles.get('PATIENT')!;
  for (const patientSeed of patientSeeds) {
    const user = await prisma.user.upsert({
      where: { email: patientSeed.email },
      update: {
        fullName: patientSeed.fullName,
        phone: patientSeed.phone,
        passwordHash,
        status: patientSeed.status,
        emailVerified: true,
      },
      create: {
        email: patientSeed.email,
        fullName: patientSeed.fullName,
        phone: patientSeed.phone,
        passwordHash,
        status: patientSeed.status,
        emailVerified: true,
      },
      select: { id: true },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: patientRole.id } },
      update: {},
      create: { userId: user.id, roleId: patientRole.id },
    });

    patients.push(
      await prisma.patient.upsert({
        where: { patientCode: patientSeed.patientCode },
        update: {
          userId: user.id,
          dateOfBirth: patientSeed.dateOfBirth,
          gender: patientSeed.gender,
          address: patientSeed.address,
          emergencyContactName: patientSeed.emergencyContactName,
          emergencyContactPhone: patientSeed.emergencyContactPhone,
          medicalHistory: patientSeed.medicalHistory,
        },
        create: {
          userId: user.id,
          patientCode: patientSeed.patientCode,
          dateOfBirth: patientSeed.dateOfBirth,
          gender: patientSeed.gender,
          address: patientSeed.address,
          emergencyContactName: patientSeed.emergencyContactName,
          emergencyContactPhone: patientSeed.emergencyContactPhone,
          medicalHistory: patientSeed.medicalHistory,
        },
        select: { id: true, userId: true },
      }),
    );
  }

  const doctors: Array<{ id: string; userId: string }> = [];
  const doctorRole = createdRoles.get('DOCTOR')!;
  for (const doctorSeed of doctorSeeds) {
    const user = await prisma.user.upsert({
      where: { email: doctorSeed.email },
      update: {
        fullName: doctorSeed.fullName,
        phone: doctorSeed.phone,
        passwordHash,
        status: doctorSeed.status,
        emailVerified: true,
      },
      create: {
        email: doctorSeed.email,
        fullName: doctorSeed.fullName,
        phone: doctorSeed.phone,
        passwordHash,
        status: doctorSeed.status,
        emailVerified: true,
      },
      select: { id: true },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: doctorRole.id } },
      update: {},
      create: { userId: user.id, roleId: doctorRole.id },
    });

    const doctor = await prisma.doctor.upsert({
      where: { doctorCode: doctorSeed.doctorCode },
      update: {
        userId: user.id,
        specialization: doctorSeed.specialization,
        licenseNumber: doctorSeed.licenseNumber,
        avatarUrl: doctorSeed.avatarUrl,
        bio: doctorSeed.bio,
        position: doctorSeed.position,
        workplace: doctorSeed.workplace,
        yearsExperience: doctorSeed.yearsExperience,
        isActive: doctorSeed.isActive,
      },
      create: {
        userId: user.id,
        doctorCode: doctorSeed.doctorCode,
        specialization: doctorSeed.specialization,
        licenseNumber: doctorSeed.licenseNumber,
        avatarUrl: doctorSeed.avatarUrl,
        bio: doctorSeed.bio,
        position: doctorSeed.position,
        workplace: doctorSeed.workplace,
        yearsExperience: doctorSeed.yearsExperience,
        isActive: doctorSeed.isActive,
      },
      select: { id: true, userId: true },
    });

    await prisma.doctorEducation.deleteMany({
      where: { doctorId: doctor.id },
    });
    await prisma.doctorCertificate.deleteMany({
      where: { doctorId: doctor.id },
    });
    await prisma.doctorMedia.deleteMany({
      where: { doctorId: doctor.id },
    });

    await prisma.doctorEducation.createMany({
      data: doctorSeed.educations.map((education, educationIndex) => ({
        doctorId: doctor.id,
        degree: education.degree,
        school: education.school,
        major: education.major,
        graduationYear: education.graduationYear,
        description: education.description,
        sortOrder: educationIndex + 1,
      })),
    });

    await prisma.doctorCertificate.createMany({
      data: doctorSeed.certificates.map((certificate, certificateIndex) => ({
        doctorId: doctor.id,
        title: certificate.title,
        issuer: certificate.issuer,
        issuedAt: certificate.issuedAt,
        imageUrl: certificate.imageUrl,
        description: certificate.description,
        sortOrder: certificateIndex + 1,
      })),
    });

    await prisma.doctorMedia.createMany({
      data: doctorSeed.media.map((media, mediaIndex) => ({
        doctorId: doctor.id,
        url: media.url,
        alt: media.alt,
        type: media.type,
        sortOrder: mediaIndex + 1,
      })),
    });

    doctors.push(doctor);
  }

  await cleanGeneratedSampleData();

  const activeServiceSlugs = services.map((service) => service.slug);
  const serviceIdsBySlug = new Map(
    (
      await prisma.service.findMany({
        where: { slug: { in: activeServiceSlugs } },
        select: { id: true, slug: true },
      })
    ).map((service) => [service.slug, service.id]),
  );

  for (const [obsoleteSlug, fallbackSlug] of Object.entries(
    obsoleteServiceSlugFallbacks,
  )) {
    const fallbackId = serviceIdsBySlug.get(fallbackSlug);
    if (!fallbackId) continue;

    const obsoleteService = await prisma.service.findUnique({
      where: { slug: obsoleteSlug },
      select: { id: true },
    });

    if (!obsoleteService) continue;

    await prisma.appointment.updateMany({
      where: { serviceId: obsoleteService.id },
      data: { serviceId: fallbackId, treatmentMethodId: null },
    });
    await prisma.clinicalCase.updateMany({
      where: { serviceId: obsoleteService.id },
      data: { serviceId: fallbackId },
    });
  }

  await prisma.service.deleteMany({
    where: {
      OR: [{ slug: { notIn: activeServiceSlugs } }, { slug: null }],
    },
  });

  await prisma.treatmentMethod.deleteMany({});

  const createdServices: Array<{
    id: string;
    name: string;
    slug: string | null;
    basePrice: { toString(): string };
  }> = [];
  for (const serviceSeed of services) {
    const existingService = await prisma.service.findFirst({
      where: {
        OR: [{ slug: serviceSeed.slug }, { name: serviceSeed.name }],
      },
      select: { id: true },
    });

    const serviceData = {
      category: serviceSeed.category,
      name: serviceSeed.name,
      slug: serviceSeed.slug,
      icon: serviceSeed.icon,
      shortDescription: serviceSeed.shortDescription,
      description: serviceSeed.description,
      thumbnailUrl: serviceSeed.thumbnailUrl,
      durationMinutes: serviceSeed.durationMinutes,
      basePrice: serviceSeed.basePrice,
      isFeatured: serviceSeed.isFeatured,
      displayOrder: serviceSeed.displayOrder,
      isActive: true,
    };

    let service: {
      id: string;
      name: string;
      slug: string | null;
      basePrice: { toString(): string };
    };

    if (existingService) {
      service = await prisma.service.update({
        where: { id: existingService.id },
        data: serviceData,
        select: { id: true, name: true, slug: true, basePrice: true },
      });
    } else {
      service = await prisma.service.create({
        data: serviceData,
        select: { id: true, name: true, slug: true, basePrice: true },
      });
    }

    await prisma.treatmentMethod.deleteMany({
      where: { serviceId: service.id },
    });

    const methodsData = treatmentMethodsBySlug[serviceSeed.slug] || [];
    for (let index = 0; index < methodsData.length; index++) {
      const tm = methodsData[index];
      const methodSeed = {
        ...tm,
        ...(treatmentMethodSeedOverrides[tm.slug] ?? {}),
      };
      await prisma.treatmentMethod.create({
        data: {
          serviceId: service.id,
          name: methodSeed.name,
          slug: methodSeed.slug,
          description: methodSeed.description,
          basePrice: methodSeed.basePrice,
          durationMinutes: methodSeed.durationMinutes,
          displayOrder: index + 1,
          isActive: true,
          media: {
            create: tm.media.map((m, mIndex) => ({
              url: m.url,
              alt: m.alt,
              type: m.type,
              sortOrder: mIndex + 1,
            })),
          },
          procedureSteps: {
            create: tm.steps.map(([title, description, durationMinutes], stepIndex) => ({
              stepOrder: stepIndex + 1,
              title,
              description,
              durationMinutes,
            })),
          },
          faqs: {
            create: tm.faqs.map(([question, answer], faqIndex) => ({
              question,
              answer,
              sortOrder: faqIndex + 1,
            })),
          },
        },
      });
    }

    createdServices.push(service);
  }

  await prisma.promotion.deleteMany({});
  const createdPromotions: Array<{ id: string }> = [];
  for (const promotion of promotions) {
    createdPromotions.push(
      await prisma.promotion.upsert({
        where: { code: promotion.code },
        update: promotion,
        create: promotion,
        select: { id: true },
      }),
    );
  }

  return {
    adminUser: adminAndReception.get('ADMIN')!,
    receptionistUser: adminAndReception.get('RECEPTIONIST')!,
    patients,
    doctors,
    services: createdServices,
    promotions: createdPromotions,
  };
}

async function cleanGeneratedSampleData() {
  await prisma.notification.deleteMany({
    where: { type: 'MARKETING', title: { startsWith: 'Seed Marketing' } },
  });
  await prisma.notification.deleteMany({
    where: { type: { startsWith: 'SEED_' } },
  });
  await prisma.review.deleteMany({
    where: { comment: { startsWith: 'Seed review' } },
  });
  await prisma.payment.deleteMany({
    where: { transactionRef: { startsWith: 'SEED-PAY-' } },
  });
  await prisma.invoice.deleteMany({
    where: { invoiceCode: { startsWith: 'INV-SEED-' } },
  });
  await prisma.clinicalCase.deleteMany({
    where: { title: { startsWith: 'Seed clinical case' } },
  });
  await prisma.medicalRecord.deleteMany({
    where: { chiefComplaint: { startsWith: 'Seed complaint' } },
  });
  await prisma.treatmentPlan.deleteMany({
    where: { title: { startsWith: 'Seed Treatment Plan' } },
  });
  await prisma.chatbotConversation.deleteMany({
    where: { sessionId: { startsWith: 'seed-session-' } },
  });
  await prisma.videoConsultation.deleteMany({
    where: { notes: { startsWith: 'Seed video consultation' } },
  });
  await prisma.doctorAvailability.deleteMany({
    where: { reason: { startsWith: 'Seed availability' } },
  });
  await prisma.appointment.deleteMany({
    where: { appointmentCode: { startsWith: 'APT-SEED-' } },
  });
}

async function seedRelatedData(
  context: Awaited<ReturnType<typeof seedBaseData>>,
) {
  await cleanGeneratedSampleData();

  const servicesBySlug = Object.fromEntries(
    context.services.map((s) => [s.slug, s]),
  );
  const servicesById = Object.fromEntries(
    context.services.map((s) => [s.id, s]),
  );
  const seededTreatmentMethods = await prisma.treatmentMethod.findMany({
    where: { serviceId: { in: context.services.map((service) => service.id) } },
    select: { id: true, slug: true, serviceId: true },
  });
  const treatmentMethodsBySlug = Object.fromEntries(
    seededTreatmentMethods.map((method) => [method.slug, method]),
  );

  for (let index = 0; index < 10; index += 1) {
    await prisma.doctorAvailability.create({
      data: {
        doctorId: context.doctors[index].id,
        recordType: 'WEEKLY',
        dayOfWeek: (index % 6) + 1,
        startTime: index % 2 === 0 ? '08:00' : '13:30',
        endTime: index % 2 === 0 ? '12:00' : '17:30',
        reason: `Seed availability ${index + 1}`,
        isActive: true,
      },
    });
  }
  await prisma.doctorAvailability.create({
    data: {
      doctorId: context.doctors[0].id,
      recordType: 'DATE_OVERRIDE',
      specificDate: addDays(7),
      startTime: '09:00',
      endTime: '15:00',
      reason: 'Seed availability date override',
      isActive: true,
    },
  });
  await prisma.doctorAvailability.create({
    data: {
      doctorId: context.doctors[1].id,
      recordType: 'TIME_OFF',
      specificDate: addDays(10),
      startTime: '00:00',
      endTime: '23:59',
      reason: 'Seed availability time off',
      isActive: false,
    },
  });

  const appointments: Array<{
    id: string;
    patientId: string | null;
    doctorId: string;
    serviceId: string;
    scheduledAt: Date;
  }> = [];

  // Hàng đợi lễ tân: ưu tiên hôm nay với đủ trạng thái thao tác
  const receptionistAppointments = [
    { day: 0, hour: 8, minute: 0, status: 'PENDING' as const, patient: 0, doctor: 0, serviceSlug: 'trong-rang-implant', methodSlug: 'implant-single' },
    { day: 0, hour: 8, minute: 30, status: 'CONFIRMED' as const, patient: 1, doctor: 1, serviceSlug: 'boc-rang-su', methodSlug: 'crown-zirconia' },
    { day: 0, hour: 9, minute: 0, status: 'CHECKED_IN' as const, patient: 2, doctor: 0, serviceSlug: 'dan-su-veneer', methodSlug: 'veneer-emax' },
    { day: 0, hour: 10, minute: 0, status: 'IN_PROGRESS' as const, patient: 3, doctor: 1, serviceSlug: 'nieng-rang', methodSlug: 'clear-aligner-full' },
    { day: 0, hour: 11, minute: 0, status: 'COMPLETED' as const, patient: 4, doctor: 0, serviceSlug: 'nieng-rang-mac-cai', methodSlug: 'braces-metal' },
    { day: 0, hour: 14, minute: 0, status: 'CONFIRMED' as const, patient: 5, doctor: 1, serviceSlug: 'nho-rang-khon', methodSlug: 'wisdom-tooth-lower' },
    { day: 0, hour: 15, minute: 0, status: 'PENDING' as const, patient: 6, doctor: 0, serviceSlug: 'nha-khoa-tong-quat', methodSlug: 'cleaning-ultrasonic-standard' },
    { day: -1, hour: 9, minute: 0, status: 'COMPLETED' as const, patient: 7, doctor: 1, serviceSlug: 'nha-khoa-tre-em', methodSlug: 'kids-fluoride-varnish' },
    { day: 1, hour: 9, minute: 30, status: 'CONFIRMED' as const, patient: 8, doctor: 0, serviceSlug: 'trong-rang-implant', methodSlug: 'implant-multiple' },
    { day: 2, hour: 10, minute: 0, status: 'PENDING' as const, patient: 9, doctor: 1, serviceSlug: 'boc-rang-su', methodSlug: 'crown-emax' },
  ];

  const bookingSources = [
    'PATIENT_APP',
    'WEBSITE',
    'RECEPTIONIST',
    'AI',
    'OTHER',
  ] as const;

  for (let index = 0; index < receptionistAppointments.length; index += 1) {
    const row = receptionistAppointments[index];
    const scheduledAt = atLocalDay(row.day, row.hour, row.minute);
    const service = servicesBySlug[row.serviceSlug];
    const treatmentMethod = treatmentMethodsBySlug[row.methodSlug];
    const appointmentStatus = row.status;

    appointments.push(
      await prisma.appointment.create({
        data: {
          appointmentCode: `APT-SEED-${String(index + 1).padStart(3, '0')}`,
          patientId: context.patients[row.patient].id,
          doctorId: context.doctors[row.doctor % context.doctors.length].id,
          serviceId: service.id,
          treatmentMethodId: treatmentMethod?.id ?? null,
          scheduledAt,
          endAt: new Date(scheduledAt.getTime() + 45 * 60 * 1000),
          status: appointmentStatus,
          bookingSource: bookingSources[index % bookingSources.length],
          notes:
            index === 2
              ? 'Bệnh nhân sợ đau, làm nhẹ tay.'
              : `Lịch seed lễ tân #${index + 1}`,
          cancellationReason: null,
          cancelledAt: null,
          checkedInAt:
            appointmentStatus === 'CHECKED_IN' ||
              appointmentStatus === 'IN_PROGRESS' ||
              appointmentStatus === 'COMPLETED'
              ? scheduledAt
              : null,
          completedAt: appointmentStatus === 'COMPLETED' ? scheduledAt : null,
          scheduleConfirmedAt:
            appointmentStatus === 'CONFIRMED' ||
              appointmentStatus === 'CHECKED_IN' ||
              appointmentStatus === 'IN_PROGRESS' ||
              appointmentStatus === 'COMPLETED'
              ? scheduledAt
              : null,
          createdBy: context.receptionistUser.id,
        },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          serviceId: true,
          scheduledAt: true,
        },
      }),
    );
  }

  const treatmentPlanSlugs = [
    'trong-rang-implant',
    'boc-rang-su',
    'dan-su-veneer',
    'nieng-rang',
    'nieng-rang-mac-cai',
    'nho-rang-khon',
    'nha-khoa-tong-quat',
    'nha-khoa-tre-em',
    'trong-rang-implant',
    'boc-rang-su',
  ];
  const treatmentPlans: Array<{ id: string }> = [];
  for (let index = 0; index < 10; index += 1) {
    const serviceSlug = treatmentPlanSlugs[index];
    const service = servicesBySlug[serviceSlug];
    treatmentPlans.push(
      await prisma.treatmentPlan.create({
        data: {
          patientId: context.patients[index].id,
          doctorId: context.doctors[index % 2].id,
          title: `Seed Treatment Plan ${index + 1}`,
          description: `Sample dental treatment plan ${index + 1}`,
          status:
            index % 4 === 0
              ? 'PLANNED'
              : index % 4 === 1
                ? 'IN_PROGRESS'
                : index % 4 === 2
                  ? 'COMPLETED'
                  : 'CANCELLED',
          startDate: addDays(index),
          expectedEndDate: addDays(index + 30),
          items: [
            {
              service: service.name,
              tooth: `${11 + index}`,
              estimatedCost: service.basePrice.toString(),
            },
          ],
        },
        select: { id: true },
      }),
    );
  }

  const medicalRecords: Array<{ id: string }> = [];
  for (let index = 0; index < 10; index += 1) {
    medicalRecords.push(
      await prisma.medicalRecord.create({
        data: {
          patientId: context.patients[index].id,
          appointmentId: appointments[index].id,
          doctorId: context.doctors[index % 2].id,
          chiefComplaint: `Seed complaint ${index + 1}`,
          diagnosis: `Seed diagnosis ${index + 1}`,
          treatmentNotes: `Treatment completed for sample case ${index + 1}.`,
          internalNotes: `Internal seed note ${index + 1}.`,
          followUpDate: addDays(index + 14),
          dentalChart: {
            teeth: [
              {
                number: 11 + index,
                status: index % 2 === 0 ? 'healthy' : 'treated',
              },
            ],
          },
          images: [],
          prescriptions: [
            {
              name: 'Paracetamol',
              dosage: '500mg',
              instruction: 'Use when needed after meal.',
            },
          ],
        },
        select: { id: true },
      }),
    );
  }

  // Seed Prescription records (linked to medicalRecords)
  await prisma.prescriptionItem.deleteMany({
    where: { prescription: { notes: { startsWith: 'Seed prescription' } } },
  });
  await prisma.prescription.deleteMany({
    where: { notes: { startsWith: 'Seed prescription' } },
  });
  for (let index = 0; index < 6; index += 1) {
    await prisma.prescription.create({
      data: {
        doctorId: context.doctors[index % 2].id,
        patientId: context.patients[index].id,
        medicalRecordId: medicalRecords[index].id,
        notes: `Seed prescription ${index + 1}`,
        items: {
          create: [
            {
              medicineName: ['Paracetamol 500mg', 'Amoxicillin 500mg', 'Ibuprofen 400mg', 'Metronidazole 250mg'][index % 4],
              dosage: ['500mg', '500mg', '400mg', '250mg'][index % 4],
              frequency: '3 lần/ngày',
              duration: `${5 + index} ngày`,
              instruction: ['Uống sau ăn', 'Uống sau ăn, đủ liệu trình', 'Uống sau ăn, tối đa 3 viên/ngày', 'Uống trong bữa ăn'][index % 4],
            },
            {
              medicineName: 'Chlorhexidine 0.12%',
              dosage: '10ml',
              frequency: '2 lần/ngày',
              duration: '7 ngày',
              instruction: 'Súc miệng 30 giây, không nuốt',
            },
          ],
        },
      },
    });
  }

  await prisma.clinicalCase.deleteMany({
    where: { title: { startsWith: 'Seed clinical case' } },
  });

  const clinicalCaseImages = [
    {
      before:
        'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1200&q=80',
      after:
        'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=80',
    },
    {
      before:
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
      after:
        'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80',
    },
    {
      before:
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
      after:
        'https://images.unsplash.com/photo-1606811842243-8d7e4d055798?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const clinicalCaseTitles = [
    'Seed clinical case - Phục hồi nụ cười sau chỉnh nha',
    'Seed clinical case - Cải thiện thẩm mỹ răng sứ',
    'Seed clinical case - Cấy ghép Implant phục hồi ăn nhai',
  ];

  for (let index = 0; index < clinicalCaseTitles.length; index += 1) {
    await prisma.clinicalCase.create({
      data: {
        patientId: appointments[index].patientId!,
        doctorId: appointments[index].doctorId,
        serviceId: appointments[index].serviceId,
        appointmentId: appointments[index].id,
        medicalRecordId: medicalRecords[index].id,
        treatmentPlanId: treatmentPlans[index].id,
        title: clinicalCaseTitles[index],
        description:
          'Ca lâm sàng mẫu được liên kết với lịch hẹn, hồ sơ bệnh án và kế hoạch điều trị thật trong hệ thống seed.',
        treatmentDuration: ['18 tháng', '7 ngày', '3 tháng'][index],
        beforeImageUrl: clinicalCaseImages[index].before,
        afterImageUrl: clinicalCaseImages[index].after,
        patientConsentPublic: true,
        isPublished: true,
        displayOrder: index + 1,
      },
    });
  }

  const invoices: Array<{ id: string; finalAmount: any }> = [];
  // Nhiều ISSUED để tab Thu ngân / Phiếu chờ thu có dữ liệu
  const invoiceStatuses = [
    'ISSUED',
    'ISSUED',
    'ISSUED',
    'PAID',
    'ISSUED',
    'PAID',
    'DRAFT',
    'PAID',
    'PARTIALLY_PAID',
    'CANCELLED',
  ] as const;
  for (let index = 0; index < 10; index += 1) {
    const appointment = appointments[index];
    const service = servicesById[appointment.serviceId];
    const subtotal = Number(service.basePrice.toString());
    const discountAmount = index % 2 === 0 ? Math.round(subtotal * 0.05) : 0;
    const status = invoiceStatuses[index];
    invoices.push(
      await prisma.invoice.create({
        data: {
          invoiceCode: `INV-SEED-${String(index + 1).padStart(3, '0')}`,
          patientId: context.patients[index].id,
          appointmentId: appointment.id,
          promotionId:
            index % 2 === 0
              ? context.promotions[index % context.promotions.length].id
              : null,
          items: [
            {
              serviceId: service.id,
              name: service.name,
              description: service.name,
              quantity: 1,
              qty: 1,
              unitPrice: subtotal,
              unit_price: subtotal,
              amount: subtotal,
            },
          ],
          subtotal: String(subtotal),
          discountAmount: String(discountAmount),
          finalAmount: String(subtotal - discountAmount),
          status,
          exportFileUrl: `https://files.smartdental.test/invoices/INV-SEED-${index + 1}.pdf`,
          issuedAt:
            status === 'ISSUED' || status === 'PARTIALLY_PAID'
              ? atLocalDay(0, 12, 0)
              : appointment.scheduledAt,
          createdBy: context.receptionistUser.id,
        },
        select: { id: true, finalAmount: true },
      }),
    );
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.payment.create({
      data: {
        invoiceId: invoices[index].id,
        amount: invoices[index].finalAmount,
        paymentMethod:
          index % 5 === 0
            ? 'CASH'
            : index % 5 === 1
              ? 'CARD'
              : index % 5 === 2
                ? 'BANK_TRANSFER'
                : index % 5 === 3
                  ? 'E_WALLET'
                  : 'ONLINE_GATEWAY',
        transactionRef: `SEED-PAY-${String(index + 1).padStart(3, '0')}`,
        status:
          index % 4 === 0
            ? 'PENDING'
            : index % 4 === 1
              ? 'SUCCESS'
              : index % 4 === 2
                ? 'FAILED'
                : 'REFUNDED',
        paidAt:
          invoiceStatuses[index] === 'PAID'
            ? appointments[index].scheduledAt
            : null,
        receivedBy: context.receptionistUser.id,
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.review.create({
      data: {
        patientId: context.patients[index].id,
        doctorId: context.doctors[index].id,
        appointmentId: appointments[index].id,
        rating: (index % 5) + 1,
        comment: `Seed review ${index + 1}: friendly doctor and clear explanation.`,
        isVisible: index !== 9,
        createdAt: appointments[index].scheduledAt,
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    const isClosed = index % 3 === 0;
    await prisma.chatbotConversation.create({
      data: {
        sessionId: `seed-session-${String(index + 1).padStart(3, '0')}`,
        patientId: context.patients[index].id,
        status: isClosed ? 'CLOSED' : index % 3 === 1 ? 'ACTIVE' : 'ESCALATED',
        messages: [
          { role: 'patient', content: 'I need advice about tooth pain.' },
          {
            role: 'assistant',
            content: 'Please book a checkup if pain persists.',
          },
        ],
        startedAt: addDays(-index),
        endedAt: isClosed ? addDays(-index + 1) : null,
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.videoConsultation.create({
      data: {
        patientId: context.patients[index].id,
        doctorId: context.doctors[index].id,
        scheduledAt: addDays(index + 3),
        durationMinutes: 20 + index * 5,
        status:
          index % 4 === 0
            ? 'SCHEDULED'
            : index % 4 === 1
              ? 'IN_PROGRESS'
              : index % 4 === 2
                ? 'COMPLETED'
                : 'CANCELLED',
        meetingUrl: `https://meet.smartdental.test/seed-${index + 1}`,
        fee: String(200000 + index * 50000),
        isPaid: index % 2 === 0,
        notes: `Seed video consultation ${index + 1}`,
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.notification.create({
      data: {
        userId: context.patients[index].userId,
        type: `SEED_REMINDER_${index + 1}`,
        title: `Seed notification ${index + 1}`,
        content: `This is sample notification content ${index + 1}.`,
        channel:
          index % 4 === 0
            ? 'IN_APP'
            : index % 4 === 1
              ? 'EMAIL'
              : index % 4 === 2
                ? 'SMS'
                : 'PUSH',
        status:
          index % 5 === 0
            ? 'PENDING'
            : index % 5 === 1
              ? 'SENT'
              : index % 5 === 2
                ? 'FAILED'
                : index % 5 === 3
                  ? 'READ'
                  : 'CANCELLED',
        scheduledAt: addDays(index + 1),
        appointmentId: appointments[index].id,
        treatmentPlanId: treatmentPlans[index].id,
        isManual: index % 2 === 0,
        sentAt: index % 5 === 1 || index % 5 === 3 ? addDays(index) : null,
        readAt: index % 5 === 3 ? addDays(index + 1) : null,
      },
    });
  }

  const marketingCampaigns = [
    {
      title: 'Seed Marketing - Summer Smile Voucher',
      content:
        'Nhan uu dai cham soc rang mieng mua he tai Smart Dental Clinic.',
      channel: 'EMAIL' as const,
      scheduledAt: addDays(-3),
    },
    {
      title: 'Seed Marketing - Tai kham dinh ky',
      content:
        'Da den luc dat lich tai kham dinh ky de duy tri suc khoe rang mieng.',
      channel: 'IN_APP' as const,
      scheduledAt: addDays(-1),
    },
    {
      title: 'Seed Marketing - Implant Consultation',
      content:
        'Tu van Implant cung bac si chuyen khoa voi uu dai trong thang nay.',
      channel: 'EMAIL' as const,
      scheduledAt: addDays(2),
    },
  ];

  for (const [campaignIndex, campaign] of marketingCampaigns.entries()) {
    for (
      let patientIndex = 0;
      patientIndex < context.patients.length;
      patientIndex += 1
    ) {
      const status =
        campaignIndex === 2
          ? 'PENDING'
          : patientIndex % 5 === 0
            ? 'FAILED'
            : patientIndex % 3 === 0
              ? 'READ'
              : 'SENT';

      await prisma.notification.create({
        data: {
          userId: context.patients[patientIndex].userId,
          type: 'MARKETING',
          title: campaign.title,
          content: campaign.content,
          channel: campaign.channel,
          status,
          scheduledAt: campaign.scheduledAt,
          isManual: true,
          sentAt:
            status === 'SENT' || status === 'READ'
              ? campaign.scheduledAt
              : null,
          readAt: status === 'READ' ? addDays(-1 + patientIndex) : null,
        },
      });
    }
  }
}

async function main() {
  const context = await seedBaseData();
  await seedRelatedData(context);

  console.log('Seed completed.');
  console.table([
    { role: 'ADMIN', email: 'admin@smartdental.test', password: TEST_PASSWORD },
    {
      role: 'RECEPTIONIST',
      email: 'receptionist@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'DOCTOR',
      email: 'doctor@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'DOCTOR',
      email: 'doctor02@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'PATIENT',
      email: 'patient01@smartdental.test',
      password: TEST_PASSWORD,
    },
    {
      role: 'PATIENT',
      email: 'patient02@smartdental.test',
      password: TEST_PASSWORD,
    },
  ]);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
