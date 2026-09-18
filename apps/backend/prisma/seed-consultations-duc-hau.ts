import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';
import { PrismaClient } from './generated/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function atDay(dayOffset: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('=== SEED 10 LỊCH TƯ VẤN MỚI: BS. HUỲNH MAI CHI ↔ BN. NGUYỄN VĂN AN ===\n');

  // 1. Tìm bác sĩ Huỳnh Mai Chi
  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [
        { doctorCode: 'DOC-SEED-007' },
        { user: { email: 'doctor07@smartdental.test' } },
        { user: { fullName: { contains: 'Huỳnh Mai Chi' } } },
      ],
    },
    include: { user: true },
  });

  if (!doctor) {
    throw new Error('Không tìm thấy bác sĩ Huỳnh Mai Chi trong cơ sở dữ liệu!');
  }
  console.log(`[Bước 1] Bác sĩ: ${doctor.user.fullName} (${doctor.doctorCode}) - ID: ${doctor.id}`);

  // 2. Tìm hoặc đảm bảo bệnh nhân Nguyễn Văn An
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: 'patient01@smartdental.test', mode: 'insensitive' } },
        { fullName: { contains: 'Nguyễn Văn An', mode: 'insensitive' } },
      ],
    },
    include: { patientProfile: true },
  });

  if (!user) {
    throw new Error('Không tìm thấy tài khoản người dùng Nguyễn Văn An (patient01@smartdental.test)!');
  }

  let patient = user.patientProfile;
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        userId: user.id,
        patientCode: `PAT-${Date.now().toString().slice(-6)}`,
        fullName: user.fullName || 'Nguyễn Văn An',
        email: user.email,
        phone: user.phone || '0901234567',
        gender: 'MALE',
        address: 'Hải Châu, Đà Nẵng',
        medicalHistory: 'Nhạy cảm ngà răng khi uống nước lạnh; Không có tiền sử dị ứng thuốc.',
      },
    });
    console.log(`Đã tạo mới hồ sơ bệnh nhân cho ${user.fullName}`);
  } else {
    patient = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        phone: patient.phone || '0901234567',
        gender: patient.gender === 'UNKNOWN' ? 'MALE' : patient.gender,
        address: patient.address || 'Hải Châu, Đà Nẵng',
        medicalHistory:
          patient.medicalHistory ||
          'Nhạy cảm ngà răng khi uống nước lạnh; Không có tiền sử dị ứng thuốc.',
      },
    });
  }
  console.log(`[Bước 2] Bệnh nhân: ${patient.fullName} (${patient.patientCode}) - ID: ${patient.id} - User: ${user.email}`);

  // Đảm bảo có PatientAccount
  await prisma.patientAccount.upsert({
    where: { userId_patientId: { userId: user.id, patientId: patient.id } },
    update: { isPrimary: true, canBook: true },
    create: {
      userId: user.id,
      patientId: patient.id,
      relationship: 'SELF',
      isPrimary: true,
      canBook: true,
    },
  });

  // 3. Xóa các ca tư vấn cũ của Nguyễn Văn An để dọn dẹp sạch sẽ
  console.log('\n[Bước 3] Đang dọn dẹp các ca tư vấn cũ của Nguyễn Văn An...');
  const oldConsults = await prisma.videoConsultation.findMany({
    where: { patientId: patient.id },
    select: { id: true },
  });

  if (oldConsults.length > 0) {
    const oldIds = oldConsults.map((c) => c.id);
    await prisma.refundRequest.deleteMany({
      where: { videoConsultationId: { in: oldIds } },
    });
    await prisma.patientAiBrief.deleteMany({
      where: { consultationId: { in: oldIds } },
    });
    await prisma.videoConsultation.deleteMany({
      where: { id: { in: oldIds } },
    });
    console.log(`- Đã xóa sạch ${oldConsults.length} ca tư vấn cũ của Nguyễn Văn An.`);
  }

  // Xóa toàn bộ dữ liệu Chatbot giả lập của Nguyễn Văn An (nếu không có thật thì không được seed)
  const deletedChats = await prisma.chatbotConversation.deleteMany({
    where: { patientId: patient.id },
  });
  console.log(`- Đã xóa ${deletedChats.count} phiên Chatbot AI giả lập của Nguyễn Văn An (để trống nếu chưa chat thật).`);

  // 4. Danh sách 10 ca tư vấn mẫu đầy đủ các tình huống nghiệp vụ
  const consultList = [
    // Ca 1: Sẵn sàng test NGAY BÂY GIỜ (SCHEDULED, 4 phút nữa - nằm trọn trong 15 phút trước giờ hẹn)
    {
      title: 'Tư vấn nha khoa trẻ em & Tổng quát: Ê buốt răng khi ăn đồ lạnh',
      scheduledAt: new Date(Date.now() + 4 * 60 * 1000), // 4 phút nữa
      durationMinutes: 60,
      fee: 100000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      notes: '[BN Nguyễn Văn An] Răng hàm dưới bên trái bị ê buốt khi uống nước lạnh hoặc hít gió mát. Muốn tư vấn điều trị trám răng hoặc bôi gel chống ê buốt.',
      complaint: 'Ê buốt răng hàm dưới bên trái khi uống nước lạnh 4 ngày nay.',
      hasAiBrief: true,
    },

    // Ca 2: Sẵn sàng test NGAY BÂY GIỜ (SCHEDULED, 8 phút nữa - nằm trọn trong 15 phút trước giờ hẹn)
    {
      title: 'Tư vấn phác đồ chỉnh nha & Cải thiện khớp cắn lệch nhẹ',
      scheduledAt: new Date(Date.now() + 8 * 60 * 1000), // 8 phút nữa
      durationMinutes: 60,
      fee: 150000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      notes: '[BN Nguyễn Văn An] Muốn tư vấn niềng răng trong suốt Invisalign hoặc mắc cài tự buộc.',
      complaint: 'Tư vấn lộ trình niềng răng và chi phí dự kiến.',
      hasAiBrief: true,
    },

    // Ca 3: Sẵn sàng test NGAY BÂY GIỜ (SCHEDULED, 12 phút nữa - nằm trọn trong 15 phút trước giờ hẹn)
    {
      title: 'Tư vấn phương pháp tẩy trắng răng WhiteSpeed cho răng nhạy cảm',
      scheduledAt: new Date(Date.now() + 12 * 60 * 1000), // 12 phút nữa
      durationMinutes: 60,
      fee: 100000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      notes: '[BN Nguyễn Văn An] Muốn tẩy trắng răng đón sự kiện nhưng men răng hơi nhạy cảm. Bác sĩ Chi tư vấn phác đồ tẩy trắng kèm gel khoáng hóa.',
      complaint: 'Hỏi về quy trình tẩy trắng răng công nghệ Philips Zoom WhiteSpeed.',
      hasAiBrief: true,
    },

    // Ca 4: Mốc 15 phút trước giờ hẹn (SCHEDULED, đúng 15 phút nữa)
    {
      title: 'Tư vấn dán sứ Veneer thẩm mỹ bảo tồn răng thật tối đa',
      scheduledAt: new Date(Date.now() + 15 * 60 * 1000), // Đúng 15 phút nữa
      durationMinutes: 60,
      fee: 150000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      notes: '[BN Nguyễn Văn An] 2 răng cửa bị thưa nhẹ 1.5mm và ố màu nhẹ do thuốc kháng sinh.',
      complaint: 'Tư vấn phục hình dán sứ Veneer 2 răng cửa.',
      hasAiBrief: true,
    },

    // Ca 5: ĐÃ QUA GIỜ HẸN 5 PHÚT - BÁC SĨ CHƯA BẮT ĐẦU (SCHEDULED - Test Bệnh nhân vào Phòng Chờ)
    {
      title: 'Tư vấn phòng ngừa viêm nướu & Hướng dẫn lấy cao răng định kỳ',
      scheduledAt: new Date(Date.now() - 5 * 60 * 1000), // Đã quá giờ hẹn 5 phút
      durationMinutes: 60,
      fee: 100000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      notes: '[BN Nguyễn Văn An] Hay bị chảy máu chân răng khi đánh răng buổi sáng.',
      complaint: 'Chảy máu chân răng nhẹ và hơi thở có mùi khó chịu.',
      hasAiBrief: false,
    },

    // Ca 6: ĐÃ QUA GIỜ HẸN 15 PHÚT - BÁC SĨ CHƯA BẮT ĐẦU (SCHEDULED - Test Bệnh nhân vào Phòng Chờ)
    {
      title: 'Tái khám định kỳ & Kiểm tra khớp thái dương hàm (TMJ)',
      scheduledAt: new Date(Date.now() - 15 * 60 * 1000), // Đã quá giờ hẹn 15 phút
      durationMinutes: 60,
      fee: 100000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      notes: '[BN Nguyễn Văn An] Thỉnh thoảng nghe tiếng lục cục ở khớp thái dương hàm khi há to miệng.',
      complaint: 'Khớp hàm kêu lục cục khi ngáp hoặc nhai thức ăn cứng.',
      hasAiBrief: true,
    },

    // Ca 7: Sáng mai (08:30 - Lịch hẹn tương lai SCHEDULED)
    {
      title: 'Tư vấn niềng răng mắc cài tự buộc Damon Clear',
      scheduledAt: atDay(1, 8, 30),
      durationMinutes: 30,
      fee: 100000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      notes: '[BN Nguyễn Văn An] Lên lịch tư vấn buổi sáng mai.',
      complaint: 'Muốn kiểm tra khớp cắn trước khi niềng.',
      hasAiBrief: false,
    },

    // Ca 8: Chờ thanh toán (PENDING_PAYMENT - Test nút Thanh Toán QR)
    {
      title: 'Tư vấn sâu răng hàm số 6 & Giải pháp hàn răng Composite thẩm mỹ',
      scheduledAt: atDay(2, 10, 0),
      durationMinutes: 30,
      fee: 100000,
      status: 'PENDING_PAYMENT' as const,
      isPaid: false,
      notes: '[BN Nguyễn Văn An] Răng số 6 hàm trên có vết đen nhỏ, nghi ngờ sâu răng kẽ.',
      complaint: 'Răng số 6 hàm trên có vết đen nhỏ, hơi buốt khi ăn đồ ngọt.',
      hasAiBrief: false,
    },

    // Ca 9: Đã hoàn thành (COMPLETED - Test xem lại lịch sử tư vấn & ghi chú bác sĩ)
    {
      title: 'Tư vấn kết quả chụp phim X-quang toàn cảnh răng khôn số 8',
      scheduledAt: atDay(-1, 10, 0), // Hôm qua
      durationMinutes: 30,
      fee: 100000,
      status: 'COMPLETED' as const,
      isPaid: true,
      notes: '[Bác sĩ Huỳnh Mai Chi kết luận] Răng khôn số 8 hàm dưới mọc lệch nhẹ 45 độ nhưng chưa gây chèn ép tiêu xương chân răng số 7. Chỉ định theo dõi định kỳ mỗi 6 tháng, súc miệng nước muối sinh lý sau ăn.',
      complaint: 'Xem phim X-quang kiểm tra răng khôn số 8 hàm dưới.',
      hasAiBrief: true,
    },

    // Ca 10: Đã hủy & Đã hoàn tiền thành công (CANCELLED - Test xem chi tiết hoàn tiền)
    {
      title: 'Tư vấn niềng răng mắc cài sứ tự buộc cho người đi làm',
      scheduledAt: atDay(-2, 16, 0), // 2 ngày trước
      durationMinutes: 30,
      fee: 100000,
      status: 'CANCELLED' as const,
      isPaid: true,
      notes: '[BN Nguyễn Văn An] Bận công tác đột xuất nên xin hủy đơn và đã nhận tiền hoàn 100%.',
      complaint: 'Tư vấn thời gian và chi phí niềng răng mắc cài sứ.',
      hasAiBrief: false,
      isRefunded: true,
    },
  ];

  console.log('\n[Bước 4] Đang khởi tạo 10 ca tư vấn mới cho Nguyễn Văn An với meet.darmstadt.social...');

  for (let i = 0; i < consultList.length; i++) {
    const item = consultList[i];
    const meetingUrl = `https://meet.darmstadt.social/sds-consult-chi-an-${randomUUID().slice(0, 8)}`;

    const consultation = await prisma.videoConsultation.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        scheduledAt: item.scheduledAt,
        durationMinutes: item.durationMinutes,
        fee: item.fee,
        status: item.status,
        isPaid: item.isPaid,
        meetingUrl: item.status === 'CANCELLED' ? null : meetingUrl,
        notes: item.notes,
      },
    });

    // Tạo hóa đơn tương ứng
    const invoiceCode = `INV-VC-${Date.now().toString().slice(-5)}${i + 1}`;
    await prisma.invoice.create({
      data: {
        invoiceCode,
        patientId: patient.id,
        invoiceType: 'SERVICE',
        subtotal: item.fee,
        discountAmount: 0,
        finalAmount: item.fee,
        status: item.isPaid ? 'PAID' : 'ISSUED',
        issuedAt: new Date(item.scheduledAt.getTime() - 24 * 60 * 60 * 1000),
        createdBy: user.id,
        items: [
          {
            title: item.title,
            price: item.fee,
            quantity: 1,
            videoConsultationId: consultation.id,
          },
        ],
      },
    });

    // Không seed hội thoại Chatbot AI giả lập - Chỉ hiển thị khi bệnh nhân nhắn tin thật qua ChatbotWidget

    // Tạo tóm tắt AI Brief nếu có
    if (item.hasAiBrief) {
      await prisma.patientAiBrief.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          createdBy: doctor.userId,
          consultationId: consultation.id,
          patientName: patient.fullName || 'Nguyễn Văn An',
          bulletPoints: [
            `Bệnh nhân Nguyễn Văn An phản ánh: ${item.complaint}`,
            `Mức độ khó chịu: Đã diễn ra vài ngày, mong muốn được bác sĩ Huỳnh Mai Chi tư vấn chuyên sâu.`,
            `Tiền sử bệnh lý: ${patient.medicalHistory}`,
            `Mong muốn: Được tư vấn rõ phương án điều trị bảo tồn men răng tự nhiên.`,
          ],
          questionsToAsk: [
            'Cơn khó chịu/ê buốt xuất hiện cụ thể vào thời điểm nào trong ngày?',
            'Anh có đang sử dụng bàn chải lông cứng hoặc kem đánh răng có tính mài mòn cao không?',
            'Trước đây răng khu vực này đã từng can thiệp nha khoa hay chưa?',
          ],
          riskFlags: [
            'Nguy cơ mòn ngót men răng hoặc tụt nướu nhẹ.',
            'Nếu ê buốt buốt nhói kéo dài cần kiểm tra tủy răng.',
          ],
          disclaimer: 'Tóm tắt tiền khám được Smart Dental AI tổng hợp tự động để hỗ trợ bác sĩ Huỳnh Mai Chi định hướng buổi tư vấn.',
          sourceData: {
            complaint: item.complaint,
            patientName: patient.fullName,
            medicalHistory: patient.medicalHistory,
          },
          bulletSources: {
            '0': 'Hội thoại AI Chatbot',
            '1': 'Mô tả đặt lịch của bệnh nhân',
          },
          riskSources: {
            '0': 'Dữ liệu hướng dẫn điều trị nha khoa chuẩn',
          },
          provider: 'SmartDental-AI-Engine',
          model: 'gemini-1.5-pro',
        },
      });
    }

    // Nếu là Ca 10 (Đã hủy), tạo thêm RefundRequest hoàn tiền thành công
    if ((item as any).isRefunded) {
      await prisma.refundRequest.create({
        data: {
          videoConsultationId: consultation.id,
          patientId: patient.id,
          refundCode: `REF-VC-${Date.now().toString().slice(-6)}`,
          requestedAmount: item.fee,
          refundPercent: 100,
          bankName: 'MB Bank (Ngân hàng Quân Đội)',
          accountNumber: '0901234567',
          accountHolder: 'NGUYEN VAN AN',
          reason: 'Bận công tác đột xuất không thể tham gia buổi tư vấn trực tuyến.',
          status: 'COMPLETED',
          processedAt: new Date(item.scheduledAt.getTime() - 20 * 60 * 60 * 1000),
          processedBy: doctor.userId,
          proofImageUrl:
            'https://res.cloudinary.com/dvsuhb9cj/image/upload/v1785496485/smart-dental/doctors/huynh-mai-chi.png',
        },
      });
    }

    console.log(
      `✓ [Ca ${i + 1}] ${item.title} | ${item.scheduledAt.toLocaleString('vi-VN')} | Trạng thái: ${item.status}`,
    );
  }

  console.log('\n=== ĐÃ HOÀN TẤT SEED 10 CA TƯ VẤN MỚI THÀNH CÔNG CHO NGUYỄN VĂN AN & BS. HUỲNH MAI CHI! ===\n');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
