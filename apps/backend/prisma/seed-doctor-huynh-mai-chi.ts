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
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('=== SEED 10 LỊCH TƯ VẤN CHO BS. HUỲNH MAI CHI ===');

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
    throw new Error('Không tìm thấy bác sĩ Huỳnh Mai Chi trong cơ sở dữ liệu. Vui lòng kiểm tra lại tài khoản seed!');
  }

  console.log(`Đã tìm thấy bác sĩ: ${doctor.user.fullName} (${doctor.doctorCode}) - ID: ${doctor.id}`);

  // 2. Lấy danh sách bệnh nhân có sẵn
  const patients = await prisma.patient.findMany({
    take: 6,
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  if (patients.length === 0) {
    throw new Error('Không tìm thấy bệnh nhân nào trong hệ thống. Hãy chạy `pnpm --filter backend prisma:seed` trước.');
  }

  console.log(`Tìm thấy ${patients.length} bệnh nhân mẫu để gán lịch.`);

  // 3. Xóa các lịch tư vấn seed trước đó của BS. Chi để tránh trùng lặp
  const existingConsultations = await prisma.videoConsultation.findMany({
    where: {
      doctorId: doctor.id,
      notes: { contains: '[Seed BS. Chi]' },
    },
    select: { id: true },
  });

  if (existingConsultations.length > 0) {
    const ids = existingConsultations.map((c) => c.id);
    await prisma.patientAiBrief.deleteMany({
      where: { consultationId: { in: ids } },
    });
    await prisma.refundRequest.deleteMany({
      where: { videoConsultationId: { in: ids } },
    });
    await prisma.videoConsultation.deleteMany({
      where: { id: { in: ids } },
    });
    console.log(`Đã xóa ${existingConsultations.length} lịch tư vấn cũ của BS. Chi.`);
  }

  // 4. Định nghĩa danh sách 10 lịch tư vấn phong phú
  const consultationConfigs = [
    // ── HÔM NAY (Day 0) ──────────────────────────────────────────────────
    {
      dayOffset: 0,
      hour: 9,
      minute: 0,
      durationMinutes: 30,
      fee: 100000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      patientIndex: 0,
      title: 'Tư vấn sâu răng sữa hàm dưới & đau buốt khi nhai',
      notes: '[Seed BS. Chi] Bé 5 tuổi sâu răng hàm dưới số 74, kêu đau khi ăn đồ ngọt và nhai cơm. Phụ huynh muốn tư vấn trám răng sinh học hay điều trị tủy buồng.',
      hasAiBrief: true,
      complaint: 'Đau răng hàm dưới bên phải khi ăn đồ ngọt, có lỗ sâu đen thấy rõ.',
    },
    {
      dayOffset: 0,
      hour: 11,
      minute: 30,
      durationMinutes: 15,
      fee: 50000,
      status: 'IN_PROGRESS' as const,
      isPaid: true,
      patientIndex: 1,
      title: 'Tư vấn nhanh: Răng cửa mọc lẫy vào trong',
      notes: '[Seed BS. Chi] Răng cửa vĩnh viễn hàm dưới của bé 7 tuổi đã nhú lên phía sau răng sữa chưa rụng. Mẹ hỏi có cần nhổ răng sữa ngay không.',
      hasAiBrief: true,
      complaint: 'Răng cửa vĩnh viễn mọc lẫy hàng 2, răng sữa phía trước hơi lung lay.',
    },
    {
      dayOffset: 0,
      hour: 15,
      minute: 0,
      durationMinutes: 60,
      fee: 150000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      patientIndex: 2,
      title: 'Khám chuyên sâu: Tư vấn can thiệp tiền chỉnh nha trẻ em',
      notes: '[Seed BS. Chi] Bé 8 tuổi có dấu hiệu khớp cắn ngược (móm nhẹ) và thở miệng khi ngủ. Bác sĩ xem phim và tư vấn khí cụ Trainer / Myobrace.',
      hasAiBrief: false,
      complaint: 'Khớp cắn ngược răng trước, cung hàm hẹp, hay thở miệng khi ngủ.',
    },

    // ── NGÀY MAI & SẮP TỚI (Day 1 - Day 3) ────────────────────────────────
    {
      dayOffset: 1,
      hour: 8,
      minute: 30,
      durationMinutes: 30,
      fee: 100000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      patientIndex: 3,
      title: 'Tư vấn bôi Vecni Fluor dự phòng sâu răng diện rộng',
      notes: '[Seed BS. Chi] Bé 3 tuổi có nhiều vệt trắng đục ở men răng cửa (dấu hiệu mất khoáng sớm). Mẹ muốn tìm hiểu phác đồ bôi Fluor định kỳ.',
      hasAiBrief: false,
      complaint: 'Men răng cửa xỉn màu và có đốm trắng mủn vôi hóa.',
    },
    {
      dayOffset: 1,
      hour: 14,
      minute: 0,
      durationMinutes: 60,
      fee: 150000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      patientIndex: 4,
      title: 'Tư vấn chấn thương mẻ răng cửa do ngã xe đạp',
      notes: '[Seed BS. Chi] Bé 9 tuổi bị ngã mẻ ngang 1/3 thân răng 11, chưa lộ tủy đỏ nhưng ê buốt khi hít thở. Cần tư vấn bảo tồn tủy và trám thẩm mỹ composite.',
      hasAiBrief: true,
      complaint: 'Mẻ góc răng cửa trên bên phải, buốt khi uống nước mát.',
    },
    {
      dayOffset: 2,
      hour: 10,
      minute: 0,
      durationMinutes: 30,
      fee: 100000,
      status: 'SCHEDULED' as const,
      isPaid: true,
      patientIndex: 5,
      title: 'Tư vấn thói quen mút ngón tay & khớp cắn hở',
      notes: '[Seed BS. Chi] Bé 6 tuổi có thói quen mút ngón tay cái khi đi ngủ, hiện tại các răng cửa cắn không khít nhau. Phụ huynh hỏi cách bỏ thói quen và định hướng khớp cắn.',
      hasAiBrief: false,
      complaint: 'Khớp cắn hở nhóm răng cửa, trẻ có tật đẩy lưỡi và mút ngón tay.',
    },
    {
      dayOffset: 3,
      hour: 16,
      minute: 30,
      durationMinutes: 15,
      fee: 50000,
      status: 'PENDING_PAYMENT' as const,
      isPaid: false,
      patientIndex: 0,
      title: 'Hỏi nhanh: Hướng dẫn chăm sóc răng miệng sau trám răng',
      notes: '[Seed BS. Chi] Bệnh nhân đăng ký gói 15 phút, đang chờ xác nhận thanh toán gateway.',
      hasAiBrief: false,
      complaint: 'Muốn hỏi chế độ ăn uống và vệ sinh sau khi hàn răng.',
    },

    // ── ĐÃ HOÀN THÀNH & LỊCH SỬ (Day -2 đến Day -1) ───────────────────────
    {
      dayOffset: -1,
      hour: 9,
      minute: 0,
      durationMinutes: 30,
      fee: 100000,
      status: 'COMPLETED' as const,
      isPaid: true,
      patientIndex: 1,
      title: 'Tái khám định kỳ sau điều trị viêm nướu trẻ em',
      notes: '[Seed BS. Chi] Đã hoàn thành tư vấn online. Nướu răng bé đã bớt đỏ sưng sau 1 tuần dùng nước súc miệng Chlorhexidine loãng. Đã dặn dò mẹ tiếp tục duy trì vệ sinh.',
      hasAiBrief: false,
      complaint: 'Kiểm tra lại nướu sau 1 tuần điều trị.',
    },
    {
      dayOffset: -2,
      hour: 14,
      minute: 30,
      durationMinutes: 60,
      fee: 150000,
      status: 'COMPLETED' as const,
      isPaid: true,
      patientIndex: 2,
      title: 'Tư vấn phục hình mão thép kim loại sẵn (SSC) răng hàm sữa',
      notes: '[Seed BS. Chi] Hoàn thành buổi tư vấn 60 phút. Bác sĩ đã giải thích kỹ ưu điểm của mão SSC bảo vệ răng hàm sữa bị vỡ lớn cho đến khi thay răng vĩnh viễn.',
      hasAiBrief: false,
      complaint: 'Răng hàm sữa vỡ to, trám nhiều lần bị bong.',
    },
    {
      dayOffset: -3,
      hour: 10,
      minute: 30,
      durationMinutes: 30,
      fee: 100000,
      status: 'CANCELLED' as const,
      isPaid: true,
      patientIndex: 3,
      title: 'Tư vấn vệ sinh răng miệng cho trẻ tự kỷ / đặc biệt',
      notes: '[Seed BS. Chi] Phụ huynh bận việc đột xuất nên đã yêu cầu dời lịch sang tuần sau. Đã hoàn tiền cọc tư vấn.',
      hasAiBrief: false,
      complaint: 'Bé không chịu hợp tác khi đánh răng, sợ tiếng bàn chải điện.',
    },
  ];

  // 5. Tiến hành tạo 10 lịch tư vấn
  let createdCount = 0;
  for (let i = 0; i < consultationConfigs.length; i++) {
    const config = consultationConfigs[i];
    const patient = patients[config.patientIndex % patients.length];
    const scheduledAt = atDay(config.dayOffset, config.hour, config.minute);
    const roomPin = String(100000 + i * 1111).slice(0, 6);
    const meetingUrl = `https://meet.darmstadt.social/sds-consult-doctor07-${randomUUID().slice(0, 8)}#sdsPin=${roomPin}`;

    const consult = await prisma.videoConsultation.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        scheduledAt,
        durationMinutes: config.durationMinutes,
        fee: config.fee,
        status: config.status,
        isPaid: config.isPaid,
        meetingUrl: config.status !== 'CANCELLED' ? meetingUrl : null,
        notes: config.notes,
      },
    });

    // Tạo phiên Chatbot AI mẫu đi kèm cho bệnh nhân để tab "Chatbot AI" có dữ liệu
    const chatSessionId = `chat-session-chi-${i + 1}-${randomUUID().slice(0, 6)}`;
    await prisma.chatbotConversation.upsert({
      where: { sessionId: chatSessionId },
      update: {},
      create: {
        sessionId: chatSessionId,
        patientId: patient.id,
        status: 'CLOSED',
        startedAt: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
        endedAt: new Date(scheduledAt.getTime() - 1.5 * 60 * 60 * 1000),
        messages: [
          {
            role: 'user',
            content: `Chào nha khoa, ${config.complaint}`,
          },
          {
            role: 'assistant',
            content: `Chào bạn! Cảm ơn bạn đã liên hệ với Smart Dental AI. Theo mô tả của bạn, BS. Huỳnh Mai Chi (Chuyên khoa Răng trẻ em & Tổng quát) là chuyên gia rất phù hợp để hỗ trợ trường hợp này. Bạn nên chuẩn bị sẵn ảnh chụp rõ răng của bé và lịch sử tiêm phòng/dị ứng thuốc trước khi vào phòng video call với bác sĩ nhé.`,
          },
          {
            role: 'user',
            content: 'Vâng, tôi đã đặt lịch hẹn trực tuyến với bác sĩ Huỳnh Mai Chi rồi ạ.',
          },
          {
            role: 'assistant',
            content: `Dạ vâng, hệ thống đã xác nhận lịch hẹn tư vấn video lúc ${scheduledAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Chúc bạn và bé có buổi thăm khám hiệu quả!`,
          },
        ],
      },
    });

    // Tạo tóm tắt AI Brief nếu ca này yêu cầu
    if (config.hasAiBrief) {
      await prisma.patientAiBrief.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          createdBy: doctor.userId,
          consultationId: consult.id,
          patientName: patient.fullName || patient.user?.fullName || 'Bệnh nhân',
          bulletPoints: [
            `Bệnh nhân: ${patient.fullName}, phụ huynh mô tả triệu chứng: ${config.complaint}`,
            `Thời gian xuất hiện: Khoảng 3 - 5 ngày gần đây, có dấu hiệu tăng dần khi ăn nhai.`,
            `Tiền sử bệnh án: ${patient.medicalHistory || 'Không ghi nhận tiền sử bệnh lý đặc biệt'}.`,
            `Mục tiêu buổi tư vấn: Định hướng chẩn đoán ban đầu và chỉ định can thiệp tại phòng khám nếu cần.`,
          ],
          questionsToAsk: [
            'Bé có bị đau nhói thức giấc vào ban đêm không?',
            'Khi uống nước đá hoặc sữa ấm bé có biểu hiện buốt hay khó chịu kéo dài không?',
            'Bé đã từng có trải nghiệm trám răng hoặc nhổ răng trước đây chưa?',
          ],
          riskFlags: [
            'Nguy cơ sâu răng lan rộng sang mầm răng vĩnh viễn bên dưới nếu không xử lý kịp thời.',
            'Cần theo dõi sát phản ứng tâm lý để tránh gây sợ hãi nha khoa (Dental Phobia) cho trẻ.',
          ],
          disclaimer: 'Bản tóm tắt hỗ trợ lâm sàng được tổng hợp tự động bởi Smart Dental AI dựa trên lời khai của bệnh nhân. Bác sĩ vui lòng thăm khám trực tiếp để ra quyết định chuyên môn.',
          sourceData: {
            bookingNotes: config.notes,
            patientMedicalHistory: patient.medicalHistory,
            complaint: config.complaint,
          },
          bulletSources: {
            '0': 'Phiên hỏi đáp AI Chatbot tiền khám',
            '1': 'Ghi chú đặt lịch hẹn của bệnh nhân',
          },
          riskSources: {
            '0': 'Dữ liệu lâm sàng nha khoa nhi khoa Smart Dental',
          },
          provider: 'SmartDental-AI-Engine',
          model: 'gemini-1.5-pro',
        },
      });
    }

    createdCount++;
    console.log(
      `[${createdCount}/10] Đã tạo: ${config.title} | ${scheduledAt.toLocaleString('vi-VN')} | Trạng thái: ${config.status} | Bệnh nhân: ${patient.fullName}`,
    );
  }

  console.log('\n=== HOÀN TẤT SEED 10 LỊCH TƯ VẤN CHO BS. HUỲNH MAI CHI! ===');
  console.log(`Bác sĩ: BS. Huỳnh Mai Chi (Email: doctor07@smartdental.test)`);
  console.log(`Đã tạo 10 ca tư vấn bao gồm:`);
  console.log(`- 3 ca Hôm nay (Hôm nay lúc 09:00, 11:30 đang diễn ra, 15:00)`);
  console.log(`- 4 ca Sắp tới trong tuần (Ngày mai & các ngày tiếp theo)`);
  console.log(`- 3 ca Lịch sử (Đã hoàn thành & Đã hủy)`);
  console.log(`- Có kèm AI Patient Brief và lịch sử Chatbot AI trực quan.`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed lịch tư vấn:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
