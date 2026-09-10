import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { HOME_ASSETS } from '~src/assets';
import type {
  ClinicConfigInfo,
  HomeClinicalCase,
  HomeDoctorCard,
  HomeServiceCard,
  TreatmentMethod,
} from '../api';
import type { PatientPromotion } from '~src/features/patient/api';

type ActionHandlers = {
  onAppointmentPress: (serviceId?: string, methodId?: string) => void;
  onConsultationPress: () => void;
  onDoctorsPress: (keyword?: string) => void;
  onPromotionsPress: () => void;
  onServicePress: (keyword?: string) => void;
};

const formatVnd = (value: string | number) =>
  `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

// ─── SECTION HEADER (CENTERED / SLEEK LIKE WEB) ─────────────────────────
function WebSectionHeader({
  actionLabel,
  eyebrow,
  onActionPress,
  subtitle,
  title,
}: {
  actionLabel?: string;
  eyebrow?: string;
  onActionPress?: () => void;
  subtitle?: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeaderContainer}>
      {eyebrow ? (
        <Text style={styles.sectionEyebrow}>{eyebrow.toUpperCase()}</Text>
      ) : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? (
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      ) : null}
      {actionLabel ? (
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={onActionPress}
          style={styles.actionPill}
        >
          <Text style={styles.actionPillText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── 1. TRUST METRICS SECTION ──────────────────────────────────────────
export function TrustMetricsSection() {
  const badges = [
    { icon: 'shield-halved', sub: 'Chứng nhận quốc tế', text: 'ISO 9001:2015' },
    { icon: 'heart-pulse', sub: 'Giấy phép 0123/BYT', text: 'Bộ Y Tế' },
    { icon: 'award', sub: 'Giải thưởng 2026', text: 'Top 10 Nha Khoa' },
  ];
  const metrics = [
    { label: 'Khách hàng', value: '10K+' },
    { label: 'Năm kinh nghiệm', value: '15+' },
    { label: 'Chuyên gia', value: '20+' },
  ];

  return (
    <View style={[styles.trustContainer, styles.softShadow]}>
      <View style={styles.badgesRow}>
        {badges.map((item, index) => (
          <View
            key={item.text}
            style={[
              styles.badgeCol,
              index !== 0 ? styles.badgeBorderLeft : null,
            ]}
          >
            <View style={styles.badgeIconCircle}>
              <FontAwesome6
                color="#0058BC"
                iconStyle="solid"
                name={item.icon as never}
                size={16}
              />
            </View>
            <Text numberOfLines={1} style={styles.badgeTitle}>
              {item.text}
            </Text>
            <Text numberOfLines={1} style={styles.badgeSub}>
              {item.sub}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.metricsRow}>
        {metrics.map((item, index) => (
          <View key={item.label} style={styles.metricCol}>
            <Text style={styles.metricValue}>{item.value}</Text>
            <Text style={styles.metricLabel}>{item.label}</Text>
            {index < metrics.length - 1 ? (
              <View style={styles.metricDivider} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const SERVICE_ORDER_BY_SLUG: Record<string, number> = {
  'trong-rang-implant': 1,
  'boc-rang-su': 2,
  'dan-su-veneer': 3,
  'nieng-rang': 4,
  'nieng-rang-mac-cai': 5,
  'nha-khoa-tong-quat': 6,
  'nho-rang-khon': 7,
  'nha-khoa-tre-em': 8,
};

function getServiceOrder(service: HomeServiceCard) {
  return (
    (service.slug ? SERVICE_ORDER_BY_SLUG[service.slug] : undefined) ??
    service.displayOrder ??
    999
  );
}

// ─── 2. SERVICES PREVIEW SECTION (SERVICE TILES GRID) ───────────────────
export function ServicesPreviewSection({
  handlers,
  services,
}: {
  handlers: ActionHandlers;
  services: HomeServiceCard[];
}) {
  const displayServices = useMemo(() => {
    return [...services]
      .sort((a, b) => {
        const orderDiff = getServiceOrder(a) - getServiceOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name, 'vi');
      })
      .slice(0, 8);
  }, [services]);

  return (
    <View style={styles.sectionMargin}>
      <WebSectionHeader
        eyebrow="Dịch vụ nổi bật"
        subtitle="Chọn nhóm dịch vụ để xem các dịch vụ, chi phí và quy trình điều trị chi tiết."
        title="Danh sách dịch vụ nha khoa"
      />

      {displayServices.length ? (
        <View style={styles.servicesGrid}>
          {displayServices.map(service => {
            const hasRemoteIcon = Boolean(
              service.icon &&
                (service.icon.startsWith('http://') ||
                  service.icon.startsWith('https://')),
            );

            return (
              <TouchableOpacity
                activeOpacity={0.86}
                key={service.id}
                onPress={() => handlers.onServicePress(service.name)}
                style={[styles.serviceTile, styles.softShadow]}
              >
                {/* Centered Icon Container */}
                <View style={styles.serviceIconWrap}>
                  {hasRemoteIcon ? (
                    <Image
                      resizeMode="contain"
                      source={{ uri: service.icon! }}
                      style={styles.serviceIconImg}
                    />
                  ) : (
                    <Text style={styles.serviceIconFallbackText}>
                      {service.name.slice(0, 2).toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Service Title */}
                <Text numberOfLines={2} style={styles.serviceTileTitle}>
                  {service.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Chưa có dịch vụ đang hoạt động để hiển thị.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── 3. POPULAR METHODS SECTION (MOST BOOKED SERVICES) ─────────────────
type MethodMatch = {
  method: TreatmentMethod;
  service: HomeServiceCard;
};

export function PopularMethodsSection({
  handlers,
  services,
}: {
  handlers: ActionHandlers;
  services: HomeServiceCard[];
}) {
  const popularMethods = useMemo<MethodMatch[]>(() => {
    const list: MethodMatch[] = [];
    services.forEach(service => {
      (service.treatmentMethods ?? []).forEach(method => {
        list.push({ method, service });
      });
    });

    return list
      .sort((a, b) => {
        const countDiff =
          (b.method.bookingCount ?? 0) - (a.method.bookingCount ?? 0);
        if (countDiff !== 0) return countDiff;
        return (a.method.displayOrder ?? 0) - (b.method.displayOrder ?? 0);
      })
      .slice(0, 4);
  }, [services]);

  if (!popularMethods.length) return null;

  return (
    <View style={styles.sectionMargin}>
      <WebSectionHeader
        eyebrow="Được yêu thích"
        subtitle="Tự động xếp hạng theo số lượt đặt lịch thực tế trong hệ thống."
        title="Dịch vụ được đặt nhiều nhất"
      />

      <View style={styles.popularList}>
        {popularMethods.map(({ method, service }) => {
          const imgSrc = method.imageUrl
            ? { uri: method.imageUrl }
            : HOME_ASSETS.BANNER_SERVICE;

          return (
            <View
              key={method.id}
              style={[styles.popularCard, styles.softShadow]}
            >
              {/* Method Photo Banner */}
              <View style={styles.popularPhotoWrap}>
                <Image
                  resizeMode="cover"
                  source={imgSrc}
                  style={styles.popularPhoto}
                />
              </View>

              {/* Content Body */}
              <View style={styles.popularContent}>
                <Text style={styles.popularCategoryBadge}>
                  {service.name.toUpperCase()}
                </Text>

                <Text numberOfLines={1} style={styles.popularMethodName}>
                  {method.name}
                </Text>

                <Text numberOfLines={2} style={styles.popularDesc}>
                  {method.description ||
                    service.description ||
                    'Dịch vụ nha khoa công nghệ cao được cá nhân hóa.'}
                </Text>

                <View style={styles.popularFooter}>
                  <View>
                    <Text style={styles.popularPrice}>
                      {formatVnd(method.basePrice)}
                    </Text>
                    <Text style={styles.popularBookingCount}>
                      {method.bookingCount ?? 0} lượt đặt
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      handlers.onAppointmentPress(service.id, method.id)
                    }
                    style={styles.bookMethodBtn}
                  >
                    <Text style={styles.bookMethodBtnText}>Đặt lịch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── 4. DOCTORS PREVIEW SECTION (INTERACTIVE ROTATING DIRECTORY) ────────
export function DoctorsPreviewSection({
  doctors,
  handlers,
}: {
  doctors: HomeDoctorCard[];
  handlers: ActionHandlers;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!doctors.length) {
    return (
      <View style={styles.sectionMargin}>
        <WebSectionHeader
          eyebrow="Đội ngũ bác sĩ"
          subtitle="Đội ngũ bác sĩ tận tâm, chuyên nghiệp, luôn lắng nghe và mang đến trải nghiệm điều trị tốt nhất."
          title="Gặp gỡ đội ngũ bác sĩ giàu kinh nghiệm"
        />
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Đội ngũ bác sĩ đang được cập nhật.
          </Text>
        </View>
      </View>
    );
  }

  const currentDoctor = doctors[activeIdx % doctors.length];
  const bullets = currentDoctor.bullets.slice(0, 3);

  const prevDoctor = () => {
    setActiveIdx(prev => (prev === 0 ? doctors.length - 1 : prev - 1));
  };

  const nextDoctor = () => {
    setActiveIdx(prev => (prev + 1) % doctors.length);
  };

  return (
    <View style={styles.sectionMargin}>
      <WebSectionHeader
        actionLabel="Xem tất cả"
        eyebrow="Đội ngũ bác sĩ"
        onActionPress={() => handlers.onDoctorsPress()}
        subtitle="Đội ngũ bác sĩ tận tâm, chuyên nghiệp, luôn lắng nghe và mang đến trải nghiệm điều trị tốt nhất."
        title="Gặp gỡ đội ngũ bác sĩ giàu kinh nghiệm"
      />

      <View style={[styles.doctorCarouselWrap, styles.softShadow]}>
        {/* Navigation Arrows */}
        {doctors.length > 1 ? (
          <>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={prevDoctor}
              style={styles.arrowBtnLeft}
            >
              <Text style={styles.arrowBtnText}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={nextDoctor}
              style={styles.arrowBtnRight}
            >
              <Text style={styles.arrowBtnText}>›</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {/* Doctor Info (Top) */}
        <View style={styles.doctorInfoTop}>
          <Text style={styles.doctorEyebrow}>Bác sĩ chuyên khoa</Text>
          <Text numberOfLines={1} style={styles.doctorName}>
            {currentDoctor.name}
          </Text>

          {/* Bullet Points */}
          <View style={styles.doctorBulletsList}>
            {bullets.map((b, i) => (
              <View key={`bullet-${i}`} style={styles.doctorBulletRow}>
                <View style={styles.bulletDot} />
                <Text numberOfLines={2} style={styles.bulletText}>
                  {b}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handlers.onDoctorsPress(currentDoctor.name)}
            style={styles.viewDoctorBtn}
          >
            <Text style={styles.viewDoctorBtnText}>Xem chi tiết bác sĩ ›</Text>
          </TouchableOpacity>
        </View>

        {/* Doctor Visual Area with Circular Backdrop & Cutout Photo */}
        <View style={styles.doctorVisualArea}>
          <View style={styles.doctorPastelCircle} />
          <Image
            resizeMode="contain"
            source={
              currentDoctor.avatarUrl
                ? { uri: currentDoctor.avatarUrl }
                : HOME_ASSETS.DS_BACSI
            }
            style={styles.doctorCutoutImg}
          />
        </View>
      </View>
    </View>
  );
}

// ─── 5. CLINICAL CASES PREVIEW SECTION (KIỆT TÁC NỤ CƯỜI) ──────────────
export function ClinicalCasesPreviewSection({
  cases,
}: {
  cases: HomeClinicalCase[];
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const prevCase = () => {
    setCurrentIdx(prev => (prev === 0 ? Math.max(0, cases.length - 2) : prev - 1));
  };

  const nextCase = () => {
    setCurrentIdx(prev => (prev >= cases.length - 2 ? 0 : prev + 1));
  };

  const visibleCases =
    cases.length > 2 ? cases.slice(currentIdx, currentIdx + 2) : cases;

  return (
    <View style={styles.sectionMargin}>
      <WebSectionHeader
        eyebrow="Kết quả điều trị"
        subtitle="Hình ảnh trước và sau từ các ca điều trị thực tế đã được bệnh nhân đồng ý công khai."
        title="Kiệt tác Nụ cười"
      />

      {cases.length ? (
        <View style={styles.casesWrapper}>
          {/* Carousel Navigation Arrows if > 2 cases */}
          {cases.length > 2 ? (
            <View style={styles.casesNavRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={prevCase}
                style={styles.caseNavArrow}
              >
                <Text style={styles.caseNavArrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.casesCounterText}>
                {currentIdx + 1} - {Math.min(currentIdx + 2, cases.length)} / {cases.length}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={nextCase}
                style={styles.caseNavArrow}
              >
                <Text style={styles.caseNavArrowText}>›</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.casesList}>
            {visibleCases.map(item => (
              <View key={item.id} style={[styles.caseCard, styles.softShadow]}>
                <Text numberOfLines={2} style={styles.caseTitle}>
                  {item.title}
                </Text>
                <Text style={styles.caseServiceName}>{item.serviceName}</Text>

                {/* Before Treatment Info */}
                <View style={styles.treatmentInfoBox}>
                  <Text style={styles.treatmentLabel}>Trước điều trị:</Text>
                  <Text numberOfLines={2} style={styles.treatmentDesc}>
                    {item.description}
                  </Text>
                </View>

                {/* After Treatment Bullets */}
                <View style={styles.treatmentInfoBox}>
                  <Text style={styles.treatmentLabel}>Sau điều trị:</Text>
                  <View style={styles.afterBulletsList}>
                    <View style={styles.afterBulletRow}>
                      <View style={styles.blueBulletDot} />
                      <Text style={styles.afterBulletText}>
                        Sắp đều răng, khớp cắn chuẩn
                      </Text>
                    </View>
                    <View style={styles.afterBulletRow}>
                      <View style={styles.blueBulletDot} />
                      <Text style={styles.afterBulletText}>
                        Chức năng ăn nhai ổn định
                      </Text>
                    </View>
                    <View style={styles.afterBulletRow}>
                      <View style={styles.blueBulletDot} />
                      <Text style={styles.afterBulletText}>
                        Khuôn cười tươi tắn, tự tin
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Meta: Doctor & Duration */}
                <View style={styles.caseMetaRow}>
                  <View style={styles.metaItem}>
                    <FontAwesome6
                      color="#0058BC"
                      iconStyle="regular"
                      name="user"
                      size={11}
                    />
                    <Text numberOfLines={1} style={styles.metaText}>
                      {item.doctorName}
                    </Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <View style={styles.metaItem}>
                    <FontAwesome6
                      color="#0058BC"
                      iconStyle="regular"
                      name="clock"
                      size={11}
                    />
                    <Text style={styles.metaText}>{item.duration}</Text>
                  </View>
                </View>

                {/* Before & After Photos Side-by-Side */}
                <View style={styles.comparisonImagesRow}>
                  <ImageBackground
                    imageStyle={styles.roundCaseImg}
                    source={
                      item.beforeImageUrl
                        ? { uri: item.beforeImageUrl }
                        : HOME_ASSETS.BANNER_SERVICE
                    }
                    style={styles.comparisonImgBox}
                  >
                    <View style={styles.imgLabelBanner}>
                      <Text style={styles.imgLabelText}>Trước điều trị</Text>
                    </View>
                  </ImageBackground>

                  <ImageBackground
                    imageStyle={styles.roundCaseImg}
                    source={
                      item.afterImageUrl
                        ? { uri: item.afterImageUrl }
                        : HOME_ASSETS.BANNER_SERVICE
                    }
                    style={styles.comparisonImgBox}
                  >
                    <View style={styles.imgLabelBanner}>
                      <Text style={styles.imgLabelText}>Sau điều trị</Text>
                    </View>
                  </ImageBackground>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Chưa có case lâm sàng được phép công khai.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── 6. PROMOTION CTA SECTION (MATCHING WEB RESPONSIVE EXACTLY) ──────────
export function PromotionCtaSection({
  handlers,
  promotion,
}: {
  handlers: ActionHandlers;
  promotion?: PatientPromotion;
}) {
  return (
    <View style={[styles.promoCard, styles.promoShadow]}>
      <View style={styles.promoDecorativeCircle} />

      <View style={styles.promoTag}>
        <FontAwesome6
          color="#FDE047"
          iconStyle="solid"
          name="wand-magic-sparkles"
          size={10}
        />
        <Text style={styles.promoTagText}>Chương trình Ưu Đãi Đặc Biệt</Text>
      </View>

      <Text style={styles.promoTitle}>
        {promotion?.title || 'Cùng sẻ chia nụ cười, nhận ưu đãi không giới hạn'}
      </Text>

      <Text numberOfLines={3} style={styles.promoDesc}>
        {promotion?.description ||
          'Khám phá các gói ưu đãi nha khoa cao cấp, tích điểm đổi quà và nhận Voucher giảm giá dịch vụ hấp dẫn dành riêng cho bạn và gia đình.'}
      </Text>

      {/* 2 CTA Buttons Row matching Web */}
      <View style={styles.promoButtonsRow}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlers.onPromotionsPress}
          style={styles.promoPrimaryBtn}
        >
          <FontAwesome6
            color="#0058BC"
            iconStyle="solid"
            name="wand-magic-sparkles"
            size={12}
          />
          <Text style={styles.promoPrimaryBtnText}>Khám phá ưu đãi ngay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.84}
          onPress={handlers.onPromotionsPress}
          style={styles.promoOutlineBtn}
        >
          <Text style={styles.promoOutlineBtnText}>Xem tất cả ưu đãi</Text>
        </TouchableOpacity>
      </View>

      {/* 2 Voucher Cards + 1 VIP Gold Card */}
      <View style={styles.promoBadgesGrid}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlers.onPromotionsPress}
          style={styles.promoBadgeBox}
        >
          <Text style={styles.promoBadgeValue}>
            {promotion?.discount || '500K'}
          </Text>
          <Text style={styles.promoBadgeLabel}>Voucher quà tặng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlers.onPromotionsPress}
          style={styles.promoBadgeBox}
        >
          <Text style={styles.promoBadgeValue}>10%</Text>
          <Text style={styles.promoBadgeLabel}>Giảm phí dịch vụ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlers.onPromotionsPress}
          style={styles.promoVipCard}
        >
          <FontAwesome6
            color="#FDE047"
            iconStyle="solid"
            name="crown"
            size={13}
          />
          <Text style={styles.promoVipText}>
            Đặc quyền thành viên & Thẻ VIP Gold
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── 7. FAQ KNOWLEDGE PREVIEW SECTION ──────────────────────────────────
export function KnowledgePreviewSection({
  clinic,
  handlers,
  services,
}: {
  clinic?: ClinicConfigInfo;
  handlers: ActionHandlers;
  services: HomeServiceCard[];
}) {
  const serviceFaqs = services.slice(0, 2).map((service, index) => {
    const questions = [
      `Dịch vụ ${service.name} mất bao lâu?`,
      `${service.name} có chi phí từ bao nhiêu?`,
      `Khi nào nên đặt lịch ${service.name}?`,
      `${service.name} có cần tư vấn trước không?`,
    ];
    const answers = [
      `Thời gian dự kiến khoảng ${service.durationMinutes} phút, tùy tình trạng răng miệng thực tế khi bác sĩ thăm khám.`,
      `Chi phí tham khảo ${service.price}. Mức cuối cùng sẽ được xác nhận sau khi bác sĩ đánh giá.`,
      service.description,
      'Bạn nên đặt lịch trước để phòng khám chuẩn bị khung giờ phù hợp và tư vấn đúng nhu cầu điều trị.',
    ];

    return {
      answer: answers[index % answers.length],
      badge: service.name,
      question: questions[index % questions.length],
    };
  });

  const clinicFaqs = [
    {
      answer:
        clinic?.businessHours
          ?.filter(day => day.isOpen)
          .map(day => `${day.label} ${day.start} - ${day.end}`)
          .join(', ') ||
        'Phòng khám mở cửa đón khách các ngày trong tuần từ 08:00 - 20:00.',
      badge: 'Giờ làm việc',
      question: 'Phòng khám làm việc vào những khung giờ nào?',
    },
    {
      answer: clinic?.phone
        ? `Bạn có thể gọi trực tiếp hotline ${clinic.phone}${clinic.email ? ` hoặc gửi email tới ${clinic.email}` : ''} để được phản hồi nhanh nhất.`
        : 'Bạn có thể gọi hotline phòng khám hoặc đặt lịch tư vấn trực tuyến bất kỳ lúc nào.',
      badge: 'Tư vấn nhanh',
      question: 'Tôi có thể liên hệ phòng khám bằng cách nào?',
    },
  ];

  const faqItems = [...serviceFaqs, ...clinicFaqs];

  return (
    <View style={styles.sectionMargin}>
      <WebSectionHeader
        eyebrow="Hỏi đáp nha khoa"
        subtitle="Những thắc mắc phổ biến được tổng hợp từ dữ liệu dịch vụ và cấu hình thực tế của phòng khám."
        title="Câu hỏi thường gặp"
      />

      {faqItems.length ? (
        <View style={styles.faqList}>
          {faqItems.map(item => (
            <TouchableOpacity
              activeOpacity={0.86}
              key={item.question}
              onPress={handlers.onConsultationPress}
              style={[styles.faqCard, styles.softShadow]}
            >
              <View style={styles.faqHeaderRow}>
                <View style={styles.faqTag}>
                  <Text style={styles.faqTagText}>FAQ</Text>
                </View>
                <Text numberOfLines={1} style={styles.faqCategoryBadge}>
                  {item.badge}
                </Text>
              </View>

              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text numberOfLines={3} style={styles.faqAnswer}>
                {item.answer}
              </Text>

              <View style={styles.faqFooterRow}>
                <Text style={styles.faqCtaText}>Đặt lịch tư vấn</Text>
                <View style={styles.faqBookBtn}>
                  <Text style={styles.faqBookBtnText}>Đặt ngay</Text>
                  <FontAwesome6
                    color="#FFFFFF"
                    iconStyle="solid"
                    name="chevron-right"
                    size={8}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Chưa có dữ liệu để hiển thị câu hỏi thường gặp.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── 8. CLINIC LOCATION PREVIEW SECTION (WITH MAP & STATUS) ────────────
export function ClinicLocationPreviewSection({
  clinic,
  handlers,
}: {
  clinic?: ClinicConfigInfo;
  handlers: ActionHandlers;
}) {
  const [copied, setCopied] = useState(false);
  const openHours = clinic?.businessHours?.filter(day => day.isOpen) ?? [];

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCall = () => {
    if (clinic?.phone) {
      Linking.openURL(`tel:${clinic.phone.replace(/\s+/g, '')}`).catch(() => {});
    }
  };

  const handleDirections = () => {
    const address = clinic?.address;
    if (address) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          address,
        )}`,
      ).catch(() => undefined);
    }
  };

  return (
    <View style={[styles.locationCard, styles.softShadow]}>
      {/* 1. Header Section */}
      <View style={styles.locationHeaderBlock}>
        <View style={styles.locationEyebrowTag}>
          <View style={styles.livePulseDot} />
          <Text style={styles.locationEyebrowText}>Vị trí phòng khám & Bản đồ</Text>
        </View>
        <Text style={styles.locationTitle}>Thông tin & Vị trí Phòng khám</Text>
        <Text style={styles.locationSubtitle}>
          Thông tin được lấy trực tiếp từ cấu hình phòng khám trong hệ thống.
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleDirections}
          style={styles.openMapDirectBtn}
        >
          <Text style={styles.openMapDirectText}>Mở chỉ đường Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Card 1: Clinic Info Box */}
      <View style={styles.clinicInfoBox}>
        {/* Header: Building Icon, Clinic Name, Open Badge */}
        <View style={styles.clinicInfoHeader}>
          <View style={styles.clinicIconBox}>
            <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="hospital" size={20} />
          </View>
          <View style={styles.clinicNameWrap}>
            <Text numberOfLines={1} style={styles.clinicNameText}>
              {clinic?.name || 'Smart Dental Clinic'}
            </Text>
            <View style={styles.clinicStatusBadge}>
              <Text style={styles.clinicStatusBadgeText}>● Đang mở cửa đón khách</Text>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.clinicDetailRow}>
          <View style={styles.clinicDetailIconBox}>
            <FontAwesome6 color="#0058BC" iconStyle="solid" name="location-dot" size={14} />
          </View>
          <View style={styles.clinicDetailTextWrap}>
            <Text style={styles.clinicDetailLabel}>ĐỊA CHỈ PHÒNG KHÁM</Text>
            <Text style={styles.clinicDetailValue}>
              {clinic?.address || '123 Nguyen Van Linh, Da Nang'}
            </Text>
            <TouchableOpacity activeOpacity={0.75} onPress={handleCopy} style={styles.copyAddressRow}>
              <Text style={[styles.copyAddressLink, copied ? styles.copiedGreen : null]}>
                {copied ? '✓ Đã sao chép địa chỉ' : 'Sao chép địa chỉ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hotline & Tư vấn đặt lịch */}
        <View style={styles.clinicDetailRow}>
          <View style={styles.clinicDetailIconBox}>
            <FontAwesome6 color="#0058BC" iconStyle="solid" name="phone" size={13} />
          </View>
          <View style={styles.clinicDetailTextWrap}>
            <Text style={styles.clinicDetailLabel}>HOTLINE & TƯ VẤN ĐẶT LỊCH</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={handleCall}>
              <Text style={styles.clinicPhoneValue}>{clinic?.phone || '1900 1234'}</Text>
            </TouchableOpacity>
            <Text style={styles.clinicEmailValue}>
              {clinic?.email || 'contact@smartdental.com'}
            </Text>
          </View>
        </View>

        {/* Action Button: Đặt lịch khám tại đây */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handlers.onAppointmentPress()}
          style={styles.clinicAppointmentBtn}
        >
          <Text style={styles.clinicAppointmentBtnText}>Đặt lịch khám tại đây</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Card 2: Google Map */}
      <TouchableOpacity
        activeOpacity={0.94}
        onPress={handleDirections}
        style={styles.mapContainerCard}
      >
        <Image
          source={HOME_ASSETS.CLINIC_MAP}
          style={styles.mapImageCover}
          resizeMode="cover"
        />

        {/* Top Overlay Row (Pill & Directions button) */}
        <View style={styles.mapTopOverlayRow}>
          <View style={styles.mapClinicPill}>
            <View style={styles.mapBlueDot} />
            <Text numberOfLines={1} style={styles.mapClinicPillText}>
              {clinic?.name || 'Smart Dental Clinic'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDirections}
            style={styles.mapDirectionsDarkBtn}
          >
            <Text style={styles.mapDirectionsDarkBtnText}>Chỉ đường</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── 9. DASHBOARD BRAND FOOTER SECTION (MATCHING WEB RESPONSIVE EXACTLY) ──
function getOpenHoursText(
  hours: { id?: number; label: string; isOpen: boolean; start: string; end: string }[] = [],
): string[] {
  const openDays = hours.filter((day) => day.isOpen);
  if (!openDays.length) {
    return [
      'Thu Hai - Thu Sau: 08:00 - 17:00',
      'Thu Bay: 08:00 - 12:00',
    ];
  }

  const firstTime = `${openDays[0].start} - ${openDays[0].end}`;
  const allSameTime = openDays.every(
    (day) => `${day.start} - ${day.end}` === firstTime,
  );

  if (allSameTime && openDays.length > 1) {
    const firstDayLabel = openDays[0].label;
    const lastDayLabel = openDays[openDays.length - 1].label;
    if (openDays.length === 7) {
      return [`Thứ 2 - Chủ Nhật: ${firstTime}`];
    }
    return [`${firstDayLabel} - ${lastDayLabel}: ${firstTime}`];
  }

  const result: string[] = [];
  let currentGroup: typeof openDays = [];

  for (let i = 0; i < openDays.length; i++) {
    const day = openDays[i];
    if (currentGroup.length === 0) {
      currentGroup.push(day);
    } else {
      const prev = currentGroup[currentGroup.length - 1];
      if (prev.start === day.start && prev.end === day.end) {
        currentGroup.push(day);
      } else {
        const timeStr = `${currentGroup[0].start} - ${currentGroup[0].end}`;
        if (currentGroup.length === 1) {
          result.push(`${currentGroup[0].label}: ${timeStr}`);
        } else {
          result.push(
            `${currentGroup[0].label} - ${currentGroup[currentGroup.length - 1].label}: ${timeStr}`,
          );
        }
        currentGroup = [day];
      }
    }
  }

  if (currentGroup.length > 0) {
    const timeStr = `${currentGroup[0].start} - ${currentGroup[0].end}`;
    if (currentGroup.length === 1) {
      result.push(`${currentGroup[0].label}: ${timeStr}`);
    } else {
      result.push(
        `${currentGroup[0].label} - ${currentGroup[currentGroup.length - 1].label}: ${timeStr}`,
      );
    }
  }

  return result;
}

export { PatientFooter, PatientFooter as DashboardFooterSection } from './PatientFooter';

// ─── STYLESHEET ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  actionPill: {
    alignSelf: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  actionPillText: {
    color: '#0058BC',
    fontSize: 11,
    fontWeight: '900',
  },
  afterBulletRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  afterBulletText: {
    color: '#475569',
    fontSize: 12,
  },
  afterBulletsList: {
    gap: 4,
    marginTop: 3,
  },
  arrowBtnLeft: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    height: 36,
    justifyContent: 'center',
    left: 8,
    position: 'absolute',
    top: '48%',
    width: 36,
    zIndex: 20,
  },
  arrowBtnRight: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: '48%',
    width: 36,
    zIndex: 20,
  },
  arrowBtnText: {
    color: '#334155',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
  badgeBorderLeft: {
    borderLeftColor: '#E0EAF7',
    borderLeftWidth: 1,
  },
  badgeCol: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  badgeIconCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  badgeSub: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  badgeTitle: {
    color: '#1E293B',
    fontSize: 10.5,
    fontWeight: '900',
    marginTop: 6,
    textAlign: 'center',
  },
  badgesRow: {
    backgroundColor: '#F5FAFF',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  blueBulletDot: {
    backgroundColor: '#0058BC',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  bookHereBtn: {
    alignItems: 'center',
    backgroundColor: '#0058BC',
    borderRadius: 16,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  bookHereBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  bookMethodBtn: {
    backgroundColor: '#0863C5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  bookMethodBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
  },
  bulletDot: {
    backgroundColor: '#1E293B',
    borderRadius: 3,
    height: 5,
    marginTop: 6,
    width: 5,
  },
  bulletText: {
    color: '#334155',
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  caseMetaRow: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
  },
  caseServiceName: {
    color: '#0058BC',
    fontSize: 11.5,
    fontWeight: '900',
    marginTop: 2,
  },
  caseTitle: {
    color: '#173761',
    fontSize: 16.5,
    fontWeight: '900',
    lineHeight: 22,
  },
  casesList: {
    paddingHorizontal: 16,
  },
  comparisonImagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  comparisonImgBox: {
    aspectRatio: 4 / 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  doctorBulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 7,
  },
  doctorBulletsList: {
    gap: 6,
    marginVertical: 10,
  },
  doctorCarouselWrap: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 28,
    borderWidth: 1,
    marginHorizontal: 16,
    overflow: 'hidden',
    padding: 16,
    position: 'relative',
  },
  doctorCutoutImg: {
    bottom: 0,
    height: 180,
    position: 'absolute',
    width: '100%',
  },
  doctorEyebrow: {
    color: '#3B4C7C',
    fontSize: 11.5,
    fontWeight: '700',
  },
  doctorInfoTop: {
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  doctorName: {
    color: '#1F2B56',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  doctorPastelCircle: {
    backgroundColor: '#D0E2FE',
    borderRadius: 85,
    height: 170,
    width: 170,
  },
  doctorVisualArea: {
    alignItems: 'center',
    height: 190,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginHorizontal: 16,
    padding: 24,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12.5,
    textAlign: 'center',
  },
  faqAnswer: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  faqArrowCircle: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  faqCategoryBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  faqCtaText: {
    color: '#0058BC',
    fontSize: 11.5,
    fontWeight: '900',
  },
  faqFooterRow: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
  },
  faqHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  faqList: {
    paddingHorizontal: 16,
  },
  faqQuestion: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '900',
    lineHeight: 20,
    marginTop: 8,
  },
  faqTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  faqTagText: {
    color: '#0058BC',
    fontSize: 10,
    fontWeight: '900',
  },
  getDirectionsBtn: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  getDirectionsBtnText: {
    color: '#0058BC',
    fontSize: 12.5,
    fontWeight: '900',
  },
  imgLabelBanner: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingVertical: 4,
  },
  imgLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  locationActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  locationAddressText: {
    color: '#1E293B',
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 18,
    padding: 16,
  },
  locationDetailsGroup: {
    gap: 8,
    marginTop: 12,
  },
  locationEyebrowTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  locationEyebrowText: {
    color: '#0058BC',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  locationHoursBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
  },
  locationHoursText: {
    color: '#334155',
    fontSize: 11.5,
    fontWeight: '600',
  },
  locationIconBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  locationPhoneText: {
    color: '#0058BC',
    fontSize: 13,
    fontWeight: '900',
  },
  locationRowItem: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  locationSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  locationTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  metaDot: {
    color: '#94A3B8',
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  metaText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    backgroundColor: '#E2E8F0',
    height: 28,
    position: 'absolute',
    right: 0,
    top: 6,
    width: 1,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  metricValue: {
    color: '#0058BC',
    fontSize: 24,
    fontWeight: '900',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  popularBookingCount: {
    color: '#94A3B8',
    fontSize: 9.5,
    marginTop: 1,
  },
  popularCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  popularCategoryBadge: {
    color: '#0863C5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  popularContent: {
    padding: 14,
  },
  popularDesc: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  popularFooter: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
  },
  popularList: {
    paddingHorizontal: 16,
  },
  popularMethodName: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '900',
    marginTop: 3,
  },
  popularPhoto: {
    height: '100%',
    width: '100%',
  },
  popularPhotoWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: '#EFF6FF',
    width: '100%',
  },
  popularPrice: {
    color: '#0863C5',
    fontSize: 13,
    fontWeight: '900',
  },
  promoActionRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  promoActionText: {
    color: '#0058BC',
    fontSize: 12,
    fontWeight: '900',
  },
  promoBadgeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  promoBadgeLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  promoBadgeValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  promoBadgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  promoCard: {
    backgroundColor: '#0058BC',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 18,
    overflow: 'hidden',
    padding: 16,
    position: 'relative',
  },
  promoDecorativeCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 90,
    height: 180,
    position: 'absolute',
    right: -30,
    top: -40,
    width: 180,
  },
  promoDesc: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  promoShadow: {
    elevation: 6,
    shadowColor: '#0058BC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  promoTag: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  promoTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
    lineHeight: 26,
    marginTop: 10,
  },
  roundCaseImg: {
    borderRadius: 16,
    resizeMode: 'cover',
  },
  sectionEyebrow: {
    color: '#0058BC',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  sectionHeaderContainer: {
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionMargin: {
    marginTop: 24,
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#07366F',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 4,
    textAlign: 'center',
  },
  serviceIconFallbackText: {
    color: '#0863C5',
    fontSize: 18,
    fontWeight: '900',
  },
  serviceIconImg: {
    height: 44,
    width: 44,
  },
  serviceIconWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    height: 62,
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    width: 62,
  },
  serviceTile: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 128,
    padding: 10,
    width: '48%',
  },
  serviceTileTitle: {
    color: '#1E293B',
    fontSize: 12.5,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  softShadow: {
    elevation: 3,
    shadowColor: '#0F315F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  treatmentDesc: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  treatmentInfoBox: {
    marginTop: 8,
  },
  treatmentLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  trustContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE8F6',
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 14,
    overflow: 'hidden',
  },
  caseNavArrow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  caseNavArrowText: {
    color: '#0058BC',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  casesCounterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  casesNavRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  casesWrapper: {
    width: '100%',
  },
  consultHereBtn: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  consultHereBtnText: {
    color: '#0058BC',
    fontSize: 12,
    fontWeight: '800',
  },
  copiedText: {
    color: '#10B981',
  },
  copyAddressBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  copyAddressText: {
    color: '#0058BC',
    fontSize: 11,
    fontWeight: '700',
  },
  faqBookBtn: {
    alignItems: 'center',
    backgroundColor: '#0058BC',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  faqBookBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  footerBlock: {
    marginBottom: 20,
  },
  footerBlockBody: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 19,
  },
  footerBlockHeading: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerBottomBlock: {
    gap: 10,
    paddingRight: 64,
  },
  footerBottomDivider: {
    backgroundColor: '#F1F5F9',
    height: 1,
    marginBottom: 18,
    marginTop: 6,
  },
  footerBrandDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 19,
  },
  footerBrandName: {
    color: '#0863C5',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  footerCopyrightText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  footerHotlineBlue: {
    color: '#0863C5',
    fontWeight: '800',
  },
  footerLinkText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '500',
  },
  footerLinksRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 2,
  },
  footerWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    marginTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  livePulseDot: {
    backgroundColor: '#0058BC',
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  locationAddressWrap: {
    flex: 1,
  },
  locationHeaderBlock: {
    gap: 4,
  },
  openMapDirectBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  openMapDirectText: {
    color: '#0058BC',
    fontSize: 11.5,
    fontWeight: '800',
  },
  clinicInfoBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  clinicInfoHeader: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
  },
  clinicIconBox: {
    alignItems: 'center',
    backgroundColor: '#0058BC',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  clinicNameWrap: {
    flex: 1,
  },
  clinicNameText: {
    color: '#0F172A',
    fontSize: 16.5,
    fontWeight: '800',
  },
  clinicStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  clinicStatusBadgeText: {
    color: '#166534',
    fontSize: 10.5,
    fontWeight: '700',
  },
  clinicDetailRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  clinicDetailIconBox: {
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    marginTop: 2,
    width: 32,
  },
  clinicDetailTextWrap: {
    flex: 1,
  },
  clinicDetailLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clinicDetailValue: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 2,
  },
  copyAddressRow: {
    marginTop: 3,
  },
  copyAddressLink: {
    color: '#0058BC',
    fontSize: 11,
    fontWeight: '700',
  },
  copiedGreen: {
    color: '#10B981',
  },
  clinicPhoneValue: {
    color: '#0058BC',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  clinicEmailValue: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2,
  },
  clinicAppointmentBtn: {
    alignItems: 'center',
    backgroundColor: '#0058BC',
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 12,
  },
  clinicAppointmentBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  mapContainerCard: {
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    height: 340,
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImageCover: {
    height: '100%',
    width: '100%',
  },
  mapTopOverlayRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 12,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  mapClinicPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapBlueDot: {
    backgroundColor: '#0058BC',
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  mapClinicPillText: {
    color: '#1E293B',
    fontSize: 11.5,
    fontWeight: '700',
    maxWidth: 160,
  },
  mapDirectionsDarkBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    elevation: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mapDirectionsDarkBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  promoBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  promoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  promoOutlineBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  promoOutlineBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  promoPrimaryBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 2,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  promoPrimaryBtnText: {
    color: '#0058BC',
    fontSize: 12,
    fontWeight: '900',
  },
  promoVipCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
  },
  promoVipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  viewDoctorBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECF3FE',
    borderRadius: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  viewDoctorBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
});
