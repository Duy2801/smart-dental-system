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

const clinicConfigs = Array.from({ length: 10 }, (_, index) => ({
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

const patientSeeds = Array.from({ length: 10 }, (_, index) => ({
  email: `patient${String(index + 1).padStart(2, '0')}@smartdental.test`,
  fullName: `Patient Seed ${String(index + 1).padStart(2, '0')}`,
  phone: `09100000${String(index + 1).padStart(2, '0')}`,
  patientCode: `PAT-SEED-${String(index + 1).padStart(3, '0')}`,
  dateOfBirth: dateOnly(`199${index % 10}-0${(index % 9) + 1}-15`),
  gender: (['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const)[index % 4],
  status: (index === 8 ? 'INACTIVE' : index === 9 ? 'SUSPENDED' : 'ACTIVE') as
    | 'ACTIVE'
    | 'INACTIVE'
    | 'SUSPENDED',
  address: `${index + 1} Nguyen Trai, District ${index + 1}, Ho Chi Minh City`,
  emergencyContactName: `Emergency Contact ${index + 1}`,
  emergencyContactPhone: `09810000${String(index + 1).padStart(2, '0')}`,
  medicalHistory:
    index % 3 === 0
      ? 'Sensitive teeth and mild gum bleeding.'
      : 'No significant medical history.',
}));

const doctorSeeds = Array.from({ length: 10 }, (_, index) => ({
  email:
    index === 0
      ? 'doctor@smartdental.test'
      : `doctor${String(index + 1).padStart(2, '0')}@smartdental.test`,
  fullName: `Doctor Seed ${String(index + 1).padStart(2, '0')}`,
  phone: `09200000${String(index + 1).padStart(2, '0')}`,
  doctorCode: `DOC-SEED-${String(index + 1).padStart(3, '0')}`,
  specialization: [
    'General Dentistry',
    'Orthodontics',
    'Endodontics',
    'Periodontics',
    'Prosthodontics',
  ][index % 5],
  licenseNumber: `VN-DENT-SEED-${String(index + 1).padStart(4, '0')}`,
  status: (index === 9 ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
  isActive: index !== 9,
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
    category: 'Tổng quát',
    name: 'Khám răng tổng quát',
    slug: 'dental-checkup',
    shortDescription:
      'Thăm khám toàn diện tình trạng răng miệng và tư vấn điều trị.',
    description:
      'Kiểm tra răng, nướu, khớp cắn và tư vấn kế hoạch chăm sóc phù hợp.',
    thumbnailUrl: serviceImageUrls.dentalCheckup,
    durationMinutes: 30,
    basePrice: '200000',
    isFeatured: true,
    displayOrder: 1,
  },
  {
    category: 'Tổng quát',
    name: 'Cạo vôi và đánh bóng răng',
    slug: 'teeth-cleaning',
    shortDescription: 'Làm sạch mảng bám, cao răng và đánh bóng bề mặt răng.',
    description: 'Cạo vôi, làm sạch mảng bám và đánh bóng giúp nướu khỏe hơn.',
    thumbnailUrl: serviceImageUrls.teethCleaning,
    durationMinutes: 45,
    basePrice: '350000',
    isFeatured: true,
    displayOrder: 2,
  },
  {
    category: 'Phục hồi',
    name: 'Trám răng thẩm mỹ',
    slug: 'dental-filling',
    shortDescription:
      'Phục hồi răng sâu, mẻ hoặc mất mô bằng vật liệu composite.',
    description:
      'Trám răng bằng vật liệu cùng màu răng cho các lỗ sâu nhỏ và vừa.',
    thumbnailUrl: serviceImageUrls.dentalFilling,
    durationMinutes: 60,
    basePrice: '600000',
    isFeatured: false,
    displayOrder: 3,
  },
  {
    category: 'Nội nha',
    name: 'Điều trị tủy',
    slug: 'root-canal-treatment',
    shortDescription: 'Xử lý tủy viêm, nhiễm trùng và đau nhức kéo dài.',
    description:
      'Làm sạch, sát khuẩn và trám bít ống tủy để bảo tồn răng thật.',
    thumbnailUrl: serviceImageUrls.rootCanal,
    durationMinutes: 90,
    basePrice: '1800000',
    isFeatured: true,
    displayOrder: 4,
  },
  {
    category: 'Thẩm mỹ',
    name: 'Tẩy trắng răng',
    slug: 'teeth-whitening',
    shortDescription:
      'Cải thiện màu răng, giúp nụ cười sáng hơn sau một buổi điều trị.',
    description:
      'Tẩy trắng tại phòng khám với gel chuyên dụng và quy trình kiểm soát an toàn.',
    thumbnailUrl: serviceImageUrls.teethWhitening,
    durationMinutes: 60,
    basePrice: '1500000',
    isFeatured: true,
    displayOrder: 5,
  },
  {
    category: 'Tiểu phẫu',
    name: 'Nhổ răng',
    slug: 'tooth-extraction',
    shortDescription: 'Loại bỏ răng hư hỏng, lung lay hoặc không thể bảo tồn.',
    description:
      'Nhổ răng an toàn với gây tê tại chỗ và hướng dẫn chăm sóc sau điều trị.',
    thumbnailUrl: serviceImageUrls.toothExtraction,
    durationMinutes: 45,
    basePrice: '500000',
    isFeatured: false,
    displayOrder: 6,
  },
  {
    category: 'Chỉnh nha',
    name: 'Tư vấn niềng răng',
    slug: 'braces-consultation',
    shortDescription:
      'Đánh giá khớp cắn, tình trạng lệch lạc và lựa chọn phương án chỉnh nha.',
    description:
      'Tư vấn loại mắc cài, thời gian điều trị, chi phí dự kiến và kế hoạch theo dõi.',
    thumbnailUrl: serviceImageUrls.braces,
    durationMinutes: 45,
    basePrice: '300000',
    isFeatured: true,
    displayOrder: 7,
  },
  {
    category: 'Phục hình',
    name: 'Bọc răng sứ',
    slug: 'dental-crown',
    shortDescription:
      'Phục hồi răng yếu, mẻ lớn hoặc đã điều trị tủy bằng mão sứ.',
    description: 'Bọc mão sứ giúp cải thiện chức năng ăn nhai và thẩm mỹ răng.',
    thumbnailUrl: serviceImageUrls.dentalCrown,
    durationMinutes: 90,
    basePrice: '3500000',
    isFeatured: false,
    displayOrder: 8,
  },
  {
    category: 'Implant',
    name: 'Tư vấn cấy ghép Implant',
    slug: 'implant-consultation',
    shortDescription:
      'Đánh giá mất răng, xương hàm và khả năng cấy ghép Implant.',
    description:
      'Tư vấn điều kiện cấy ghép, loại trụ, thời gian điều trị và chi phí dự kiến.',
    thumbnailUrl: serviceImageUrls.implant,
    durationMinutes: 60,
    basePrice: '500000',
    isFeatured: true,
    displayOrder: 9,
  },
  {
    category: 'Nha khoa trẻ em',
    name: 'Chăm sóc răng trẻ em',
    slug: 'kids-dental-care',
    shortDescription:
      'Thăm khám nhẹ nhàng, phòng ngừa sâu răng và hướng dẫn chăm sóc cho trẻ.',
    description: 'Dịch vụ nha khoa cơ bản và dự phòng dành cho trẻ em.',
    thumbnailUrl: serviceImageUrls.kidsDental,
    durationMinutes: 30,
    basePrice: '250000',
    isFeatured: false,
    displayOrder: 10,
  },
] as const;

const serviceContentBySlug = {
  'dental-checkup': {
    media: [
      {
        url: serviceImageUrls.dentalCheckup,
        alt: 'Phòng khám răng tổng quát',
        type: 'BANNER',
      },
      {
        url: serviceImageUrls.dentalCheckup,
        alt: 'Bác sĩ kiểm tra răng cho bệnh nhân',
        type: 'PROCESS',
      },
    ],
    steps: [
      [
        'Trao đổi triệu chứng',
        'Bác sĩ hỏi về đau nhức, ê buốt, chảy máu nướu và thói quen chăm sóc răng miệng.',
        5,
      ],
      [
        'Khám răng miệng',
        'Kiểm tra răng, nướu, khớp cắn và mô mềm trong khoang miệng.',
        15,
      ],
      [
        'Tư vấn kết quả',
        'Bác sĩ giải thích tình trạng hiện tại và đề xuất hướng điều trị nếu cần.',
        10,
      ],
    ],
    faqs: [
      [
        'Bao lâu nên khám răng tổng quát một lần?',
        'Thông thường nên khám định kỳ mỗi 6 tháng để phát hiện sớm các vấn đề răng miệng.',
      ],
      [
        'Lần nào đi khám cũng cần chụp X-quang không?',
        'Không bắt buộc. Bác sĩ chỉ chỉ định chụp X-quang khi cần thêm thông tin chẩn đoán.',
      ],
    ],
  },
  'teeth-cleaning': {
    media: [
      {
        url: serviceImageUrls.teethCleaning,
        alt: 'Quy trình cạo vôi và đánh bóng răng',
        type: 'PROCESS',
      },
    ],
    steps: [
      [
        'Đánh giá mảng bám',
        'Bác sĩ kiểm tra lượng cao răng, mảng bám và tình trạng nướu.',
        5,
      ],
      [
        'Cạo vôi răng',
        'Mảng bám và cao răng được làm sạch bằng dụng cụ nha khoa chuyên dụng.',
        25,
      ],
      [
        'Đánh bóng',
        'Bề mặt răng được đánh bóng để giảm bám màu và tạo cảm giác sạch hơn.',
        10,
      ],
      [
        'Hướng dẫn chăm sóc',
        'Bệnh nhân được hướng dẫn chải răng, dùng chỉ nha khoa và tái khám định kỳ.',
        5,
      ],
    ],
    faqs: [
      [
        'Cạo vôi răng có đau không?',
        'Phần lớn bệnh nhân chỉ cảm thấy rung nhẹ hoặc ê buốt nhẹ trong lúc làm sạch.',
      ],
      [
        'Cạo vôi có làm trắng răng không?',
        'Cạo vôi giúp loại bỏ mảng bám và vết ố bề mặt, nhưng không thay thế tẩy trắng răng.',
      ],
    ],
  },
  'dental-filling': {
    media: [
      {
        url: serviceImageUrls.dentalFilling,
        alt: 'Trám răng bằng vật liệu composite',
        type: 'PROCESS',
      },
    ],
    steps: [
      [
        'Kiểm tra răng sâu',
        'Bác sĩ xác định vị trí sâu răng, mẻ răng hoặc vùng cần phục hồi.',
        10,
      ],
      [
        'Làm sạch xoang trám',
        'Vùng răng tổn thương được làm sạch và cách ly trước khi trám.',
        15,
      ],
      [
        'Đặt vật liệu trám',
        'Composite được đưa vào, tạo hình và chiếu đèn để đông cứng.',
        25,
      ],
      [
        'Chỉnh khớp cắn',
        'Miếng trám được đánh bóng và kiểm tra cảm giác khi cắn.',
        10,
      ],
    ],
    faqs: [
      [
        'Miếng trám dùng được bao lâu?',
        'Trám composite có thể sử dụng nhiều năm nếu vệ sinh tốt và tái khám định kỳ.',
      ],
      [
        'Trám răng xong có ăn ngay được không?',
        'Thông thường nên ăn sau khi hết tê và tránh nhai mạnh ở vùng vừa trám trong thời gian đầu.',
      ],
    ],
  },
  'root-canal-treatment': {
    media: [
      {
        url: serviceImageUrls.rootCanal,
        alt: 'Minh họa điều trị tủy răng',
        type: 'PROCESS',
      },
    ],
    steps: [
      [
        'Chẩn đoán',
        'Bác sĩ đánh giá triệu chứng đau nhức và có thể chỉ định chụp X-quang.',
        15,
      ],
      [
        'Làm sạch ống tủy',
        'Mô tủy viêm hoặc nhiễm trùng được loại bỏ, ống tủy được sát khuẩn.',
        40,
      ],
      [
        'Trám bít ống tủy',
        'Ống tủy đã làm sạch được trám bít bằng vật liệu chuyên dụng.',
        25,
      ],
      [
        'Tư vấn phục hồi',
        'Bác sĩ có thể khuyến nghị trám hoặc bọc sứ để bảo vệ răng sau điều trị tủy.',
        10,
      ],
    ],
    faqs: [
      [
        'Điều trị tủy có đau không?',
        'Bác sĩ sẽ gây tê tại chỗ để kiểm soát đau trong quá trình điều trị.',
      ],
      [
        'Điều trị tủy cần mấy lần hẹn?',
        'Nhiều trường hợp cần 1-2 lần hẹn, tùy mức độ viêm nhiễm và số ống tủy.',
      ],
    ],
  },
  'teeth-whitening': {
    media: [
      {
        url: serviceImageUrls.teethWhitening,
        alt: 'Hình ảnh trước và sau khi tẩy trắng răng',
        type: 'BEFORE_AFTER',
      },
      {
        url: serviceImageUrls.teethWhitening,
        alt: 'Chiếu đèn tẩy trắng răng',
        type: 'PROCESS',
      },
    ],
    steps: [
      [
        'Đánh giá màu răng',
        'Bác sĩ xác định màu răng hiện tại và nguy cơ ê buốt.',
        10,
      ],
      [
        'Bảo vệ nướu',
        'Nướu được che chắn để hạn chế kích ứng trong quá trình tẩy trắng.',
        10,
      ],
      [
        'Tẩy trắng',
        'Gel tẩy trắng được bôi lên răng và hoạt hóa theo từng chu kỳ kiểm soát.',
        30,
      ],
      [
        'Hướng dẫn sau điều trị',
        'Bệnh nhân được dặn cách ăn uống và chăm sóc khi có ê buốt nhẹ.',
        10,
      ],
    ],
    faqs: [
      [
        'Tẩy trắng răng có bị ê buốt không?',
        'Có thể ê buốt tạm thời, nhưng thường giảm nhanh sau điều trị.',
      ],
      [
        'Kết quả tẩy trắng giữ được bao lâu?',
        'Thời gian duy trì tùy thói quen ăn uống và chăm sóc, thường có thể giữ sáng trong nhiều tháng.',
      ],
    ],
  },
  'tooth-extraction': {
    media: [
      {
        url: serviceImageUrls.toothExtraction,
        alt: 'Hướng dẫn chăm sóc sau nhổ răng',
        type: 'PROCESS',
      },
    ],
    steps: [
      [
        'Khám chỉ định',
        'Bác sĩ xác nhận lý do cần nhổ răng và đánh giá mức độ khó.',
        10,
      ],
      ['Gây tê', 'Gây tê tại chỗ giúp giảm đau trong quá trình nhổ răng.', 10],
      [
        'Nhổ răng',
        'Răng được lấy ra nhẹ nhàng bằng dụng cụ nha khoa phù hợp.',
        15,
      ],
      [
        'Cầm máu',
        'Bệnh nhân được đặt gạc cầm máu và hướng dẫn chăm sóc tại nhà.',
        10,
      ],
    ],
    faqs: [
      [
        'Nhổ răng bao lâu thì lành?',
        'Vết thương thường ổn định sau vài ngày đầu, tùy cơ địa và độ khó của ca nhổ.',
      ],
      [
        'Sau nhổ răng nên kiêng gì?',
        'Nên tránh hút thuốc, thức ăn cứng, súc miệng mạnh và dùng ống hút trong ngày đầu.',
      ],
    ],
  },
  'braces-consultation': {
    media: [
      {
        url: serviceImageUrls.braces,
        alt: 'Lập kế hoạch niềng răng',
        type: 'PROCESS',
      },
    ],
    steps: [
      [
        'Đánh giá khớp cắn',
        'Bác sĩ kiểm tra răng chen chúc, lệch lạc và tương quan khớp cắn.',
        15,
      ],
      [
        'Thu thập dữ liệu',
        'Hình ảnh, phim X-quang hoặc scan răng có thể được dùng để lập kế hoạch.',
        10,
      ],
      [
        'Tư vấn lựa chọn',
        'Bác sĩ giải thích các loại niềng răng, thời gian điều trị và chi phí dự kiến.',
        15,
      ],
      [
        'Hẹn bước tiếp theo',
        'Bệnh nhân nhận kế hoạch chỉnh nha sơ bộ và lịch hẹn tiếp theo nếu đồng ý điều trị.',
        5,
      ],
    ],
    faqs: [
      [
        'Niềng răng mất bao lâu?',
        'Nhiều trường hợp kéo dài khoảng 18-24 tháng, tùy mức độ lệch lạc.',
      ],
      [
        'Người lớn có niềng răng được không?',
        'Có. Người lớn vẫn có thể chỉnh nha nếu tình trạng răng và nướu phù hợp.',
      ],
    ],
  },
  'dental-crown': {
    media: [
      {
        url: serviceImageUrls.dentalCrown,
        alt: 'Phục hồi răng bằng mão sứ',
        type: 'PROCESS',
      },
    ],
    steps: [
      [
        'Đánh giá răng',
        'Bác sĩ kiểm tra răng có đủ điều kiện nâng đỡ mão sứ hay không.',
        10,
      ],
      ['Mài chỉnh răng', 'Răng được tạo hình phù hợp để lắp mão sứ.', 30],
      ['Lấy dấu', 'Bác sĩ lấy dấu hoặc scan răng để thiết kế mão sứ.', 15],
      ['Gắn mão sứ', 'Mão sứ được thử, chỉnh khớp cắn và gắn cố định.', 35],
    ],
    faqs: [
      [
        'Khi nào cần bọc răng sứ?',
        'Bọc sứ thường dùng cho răng yếu, nứt, mẻ lớn hoặc đã điều trị tủy.',
      ],
      [
        'Răng sứ dùng được bao lâu?',
        'Mão sứ có thể sử dụng nhiều năm nếu vệ sinh tốt và tái khám định kỳ.',
      ],
    ],
  },
  'implant-consultation': {
    media: [
      {
        url: serviceImageUrls.implant,
        alt: 'Lập kế hoạch cấy ghép Implant',
        type: 'BANNER',
      },
    ],
    steps: [
      [
        'Khai thác bệnh sử',
        'Bác sĩ trao đổi về sức khỏe tổng quát, thuốc đang dùng và mong muốn phục hồi răng.',
        10,
      ],
      [
        'Đánh giá xương hàm',
        'Vùng mất răng và điều kiện xương được kiểm tra để xem khả năng cấy ghép.',
        20,
      ],
      [
        'Lập kế hoạch điều trị',
        'Bác sĩ tư vấn loại trụ, thời gian thực hiện và chi phí dự kiến.',
        20,
      ],
      [
        'Hướng dẫn chuẩn bị',
        'Bệnh nhân được hướng dẫn bước chẩn đoán hoặc xét nghiệm tiếp theo nếu cần.',
        10,
      ],
    ],
    faqs: [
      [
        'Ai phù hợp để cấy ghép Implant?',
        'Bệnh nhân cần có sức khỏe tổng quát ổn định và đủ điều kiện xương hàm để lập kế hoạch cấy ghép.',
      ],
      [
        'Cấy Implant có xong trong một lần không?',
        'Phần lớn ca Implant cần nhiều giai đoạn trong vài tháng để trụ tích hợp với xương.',
      ],
    ],
  },
  'kids-dental-care': {
    media: [
      {
        url: serviceImageUrls.kidsDental,
        alt: 'Chăm sóc răng miệng cho trẻ em',
        type: 'BANNER',
      },
    ],
    steps: [
      [
        'Làm quen nhẹ nhàng',
        'Trẻ được làm quen với ghế nha khoa và dụng cụ theo cách thân thiện.',
        5,
      ],
      [
        'Khám răng miệng',
        'Bác sĩ kiểm tra răng, nướu và quá trình mọc răng của trẻ.',
        10,
      ],
      [
        'Chăm sóc dự phòng',
        'Có thể thực hiện làm sạch, bôi fluoride hoặc trám bít hố rãnh nếu phù hợp.',
        10,
      ],
      [
        'Hướng dẫn phụ huynh',
        'Phụ huynh được tư vấn cách vệ sinh răng và chế độ ăn cho trẻ.',
        5,
      ],
    ],
    faqs: [
      [
        'Trẻ em nên đi nha sĩ khi nào?',
        'Trẻ nên được thăm khám sớm và duy trì kiểm tra định kỳ để phòng ngừa sâu răng.',
      ],
      [
        'Làm sao để trẻ bớt sợ nha sĩ?',
        'Những lần khám ngắn, nhẹ nhàng và tích cực sẽ giúp trẻ quen dần với việc chăm sóc răng miệng.',
      ],
    ],
  },
} as const;

const promotions = Array.from({ length: 10 }, (_, index) => ({
  code: `SEEDPROMO${String(index + 1).padStart(2, '0')}`,
  name: `Seed Promotion ${index + 1}`,
  description: `Sample promotion ${index + 1}`,
  discountType: (index % 2 === 0 ? 'PERCENTAGE' : 'FIXED_AMOUNT') as
    | 'PERCENTAGE'
    | 'FIXED_AMOUNT',
  discountValue:
    index % 2 === 0 ? String(5 + index) : String(50000 * (index + 1)),
  minOrderAmount: String(200000 * (index + 1)),
  maxUses: 100 + index,
  usedCount: index,
  startDate:
    index === 8
      ? addDays(20)
      : index === 9
        ? addDays(-90)
        : addDays(-30 + index),
  endDate:
    index === 8 ? addDays(90) : index === 9 ? addDays(-5) : addDays(60 + index),
  isActive: index !== 7,
}));

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

    doctors.push(
      await prisma.doctor.upsert({
        where: { doctorCode: doctorSeed.doctorCode },
        update: {
          userId: user.id,
          specialization: doctorSeed.specialization,
          licenseNumber: doctorSeed.licenseNumber,
          isActive: doctorSeed.isActive,
        },
        create: {
          userId: user.id,
          doctorCode: doctorSeed.doctorCode,
          specialization: doctorSeed.specialization,
          licenseNumber: doctorSeed.licenseNumber,
          isActive: doctorSeed.isActive,
        },
        select: { id: true, userId: true },
      }),
    );
  }

  const createdServices: Array<{
    id: string;
    name: string;
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
      basePrice: { toString(): string };
    };

    if (existingService) {
      service = await prisma.service.update({
        where: { id: existingService.id },
        data: serviceData,
        select: { id: true, name: true, basePrice: true },
      });
    } else {
      service = await prisma.service.create({
        data: serviceData,
        select: { id: true, name: true, basePrice: true },
      });
    }

    await prisma.serviceMedia.deleteMany({
      where: { serviceId: service.id },
    });
    await prisma.serviceProcedureStep.deleteMany({
      where: { serviceId: service.id },
    });
    await prisma.serviceFaq.deleteMany({
      where: { serviceId: service.id },
    });

    const serviceContent = serviceContentBySlug[serviceSeed.slug];
    await prisma.serviceMedia.createMany({
      data: serviceContent.media.map((media, mediaIndex) => ({
        serviceId: service.id,
        url: media.url,
        alt: media.alt,
        type: media.type,
        sortOrder: mediaIndex + 1,
      })),
    });
    await prisma.serviceProcedureStep.createMany({
      data: serviceContent.steps.map(
        ([title, description, durationMinutes], stepIndex) => ({
          serviceId: service.id,
          stepOrder: stepIndex + 1,
          title,
          description,
          durationMinutes,
        }),
      ),
    });
    await prisma.serviceFaq.createMany({
      data: serviceContent.faqs.map(([question, answer], faqIndex) => ({
        serviceId: service.id,
        question,
        answer,
        sortOrder: faqIndex + 1,
      })),
    });

    createdServices.push(service);
  }

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
    patientId: string;
    doctorId: string;
    serviceId: string;
    scheduledAt: Date;
  }> = [];
  const appointmentDayOffsets = [-6, -5, -4, -3, -2, -1, 0, 0, 1, 2];
  const appointmentStatuses = [
    'COMPLETED',
    'CONFIRMED',
    'CHECKED_IN',
    'IN_PROGRESS',
    'CANCELLED',
    'NO_SHOW',
    'PENDING',
    'RESCHEDULED',
    'COMPLETED',
    'CONFIRMED',
  ] as const;
  const bookingSources = [
    'PATIENT_APP',
    'WEBSITE',
    'RECEPTIONIST',
    'AI',
    'OTHER',
  ] as const;
  for (let index = 0; index < 10; index += 1) {
    const scheduledAt = addDays(appointmentDayOffsets[index]);
    scheduledAt.setHours(8 + (index % 6), index % 2 === 0 ? 0 : 30, 0, 0);
    const service = context.services[index];
    const appointmentStatus = appointmentStatuses[index];

    appointments.push(
      await prisma.appointment.create({
        data: {
          appointmentCode: `APT-SEED-${String(index + 1).padStart(3, '0')}`,
          patientId: context.patients[index].id,
          doctorId: context.doctors[index].id,
          serviceId: service.id,
          scheduledAt,
          endAt: new Date(scheduledAt.getTime() + (30 + index * 5) * 60 * 1000),
          status: appointmentStatus,
          bookingSource: bookingSources[index % bookingSources.length],
          aiSuggestedTime:
            index % 3 === 0 ? addDays(appointmentDayOffsets[index] + 1) : null,
          notes: `Seed appointment note ${index + 1}`,
          rescheduleHistory:
            index === 8
              ? [
                  {
                    from: addDays(
                      appointmentDayOffsets[index] - 1,
                    ).toISOString(),
                    to: scheduledAt.toISOString(),
                  },
                ]
              : undefined,
          cancellationReason:
            appointmentStatus === 'CANCELLED'
              ? 'Patient requested cancellation.'
              : appointmentStatus === 'NO_SHOW'
                ? 'Patient did not arrive.'
                : null,
          cancelledAt:
            index === 4 ? addDays(appointmentDayOffsets[index]) : null,
          checkedInAt:
            appointmentStatus === 'CHECKED_IN' ||
            appointmentStatus === 'IN_PROGRESS' ||
            appointmentStatus === 'COMPLETED'
              ? scheduledAt
              : null,
          completedAt: appointmentStatus === 'COMPLETED' ? scheduledAt : null,
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

  const treatmentPlans: Array<{ id: string }> = [];
  for (let index = 0; index < 10; index += 1) {
    treatmentPlans.push(
      await prisma.treatmentPlan.create({
        data: {
          patientId: context.patients[index].id,
          doctorId: context.doctors[index].id,
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
              service: context.services[index].name,
              tooth: `${11 + index}`,
              estimatedCost: context.services[index].basePrice.toString(),
            },
          ],
        },
        select: { id: true },
      }),
    );
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.medicalRecord.create({
      data: {
        patientId: context.patients[index].id,
        appointmentId: appointments[index].id,
        doctorId: context.doctors[index].id,
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
    });
  }

  const invoices: Array<{ id: string; finalAmount: any }> = [];
  const invoiceStatuses = [
    'PAID',
    'PAID',
    'ISSUED',
    'PAID',
    'REFUNDED',
    'PAID',
    'DRAFT',
    'PAID',
    'PARTIALLY_PAID',
    'CANCELLED',
  ] as const;
  for (let index = 0; index < 10; index += 1) {
    const subtotal = Number(context.services[index].basePrice.toString());
    const discountAmount = index % 2 === 0 ? Math.round(subtotal * 0.05) : 0;
    invoices.push(
      await prisma.invoice.create({
        data: {
          invoiceCode: `INV-SEED-${String(index + 1).padStart(3, '0')}`,
          patientId: context.patients[index].id,
          appointmentId: appointments[index].id,
          promotionId: index % 2 === 0 ? context.promotions[index].id : null,
          items: [
            {
              serviceId: context.services[index].id,
              name: context.services[index].name,
              quantity: 1,
              unitPrice: subtotal,
            },
          ],
          subtotal: String(subtotal),
          discountAmount: String(discountAmount),
          finalAmount: String(subtotal - discountAmount),
          status: invoiceStatuses[index],
          exportFileUrl: `https://files.smartdental.test/invoices/INV-SEED-${index + 1}.pdf`,
          issuedAt: appointments[index].scheduledAt,
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
