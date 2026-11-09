import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Screen } from '~src/components/ui';
import { CACHE_TIMES, queryKeys } from '~src/config/queryClient';
import { SCREEN_NAME } from '~src/constants/screenName';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import type { PatientHomeScreenProps } from '~src/routes/types';
import { getPatientDoctorDetail, type PatientDoctorDetail } from '../api';

type Props = PatientHomeScreenProps<'PatientDoctorDetail'>;

const BRAND = '#0863c5';

function formatMonthYear(value?: string | null) {
  if (!value) return 'Đang cập nhật';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Đang cập nhật';
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function EmptyContent({ label }: { label: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

function HeroCard({ doctor }: { doctor: PatientDoctorDetail }) {
  const stats = [
    { value: String(doctor.yearsExperience), label: 'Năm kinh nghiệm', color: BRAND, bg: '#EFF6FF' },
    { value: String(doctor.educations.length), label: 'Bằng cấp', color: '#059669', bg: '#ECFDF5' },
    {
      value: doctor.averageRating ? `★ ${doctor.averageRating}` : 'Mới',
      label: `${doctor.reviews.length} đánh giá`,
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    { value: String(doctor.certificates.length), label: 'Chứng chỉ', color: '#7C3AED', bg: '#F5F3FF' },
  ];

  return (
    <View style={[styles.card, styles.heroCard]}>
      <View style={styles.heroMedia}>
        {doctor.avatarUrl ? (
          <Image resizeMode="cover" source={{ uri: doctor.avatarUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroInitials}>
            <Text style={styles.heroInitialsText}>{doctor.initials}</Text>
          </View>
        )}
        <View style={styles.workplaceBox}>
          <Text style={styles.workplaceLabel}>Nơi công tác</Text>
          <Text numberOfLines={2} style={styles.workplaceValue}>
            {doctor.workplace}
          </Text>
        </View>
      </View>

      <View style={styles.heroBody}>
        <View style={styles.specialtyPill}>
          <Text style={styles.specialtyPillText}>{doctor.specialization}</Text>
        </View>
        <Text style={styles.doctorName}>{doctor.name}</Text>
        <Text style={styles.positionText}>
          <Text style={styles.positionLabel}>Chức vụ: </Text>
          {doctor.position}
        </Text>
        <Text style={styles.bioText}>{doctor.bio}</Text>

        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <View key={stat.label} style={[styles.statBox, { backgroundColor: stat.bg }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function DoctorDetailScreen({ navigation, route }: Props) {
  const doctorId = route.params?.doctorId;

  const doctorQuery = useQuery({
    queryKey: queryKeys.doctors.detail(doctorId ?? ''),
    queryFn: () => getPatientDoctorDetail(doctorId as string),
    enabled: Boolean(doctorId),
    staleTime: CACHE_TIMES.CATALOG.staleTime,
    gcTime: CACHE_TIMES.CATALOG.gcTime,
  });
  const doctor = doctorQuery.data ?? null;

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(SCREEN_NAME.PATIENT_DOCTORS);
  };

  const handleBook = () => {
    if (!doctor) return;
    (navigation.getParent() as any)?.navigate(SCREEN_NAME.FUNCTION, {
      screen: 'AppointmentMain',
      params: { dedicatedDoctorId: doctor.id, initialMode: 'booking' },
    });
  };

  const topBar = (
    <View style={styles.topBar}>
      <TouchableOpacity accessibilityLabel="Quay lại" activeOpacity={0.8} onPress={goBack} style={styles.backButton}>
        <FontAwesome6 color="#334155" iconStyle="solid" name="arrow-left" size={14} />
      </TouchableOpacity>
      <Text numberOfLines={1} style={styles.topBarTitle}>
        Hồ sơ bác sĩ
      </Text>
    </View>
  );

  if (doctorQuery.isLoading) {
    return (
      <Screen>
        {topBar}
        <View style={styles.centerBox}>
          <ActivityIndicator color={BRAND} size="large" />
          <Text style={styles.centerText}>Đang tải hồ sơ bác sĩ...</Text>
        </View>
      </Screen>
    );
  }

  if (!doctor) {
    return (
      <Screen>
        {topBar}
        <View style={styles.centerBox}>
          <Text style={styles.notFoundTitle}>Không tìm thấy bác sĩ</Text>
          <Text style={styles.centerText}>
            Hồ sơ bác sĩ có thể đã ngừng hoạt động hoặc chưa được công khai.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={doctorQuery.isRefetching}
            onPress={() => void doctorQuery.refetch()}
            style={[styles.primaryButton, styles.notFoundButton]}
          >
            <Text style={styles.primaryButtonText}>
              {doctorQuery.isRefetching ? 'Đang tải lại...' : 'Thử lại'}
            </Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const visibleMedia = doctor.media.slice(0, 4);

  return (
    <Screen>
      {topBar}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            colors={[BRAND]}
            onRefresh={doctorQuery.refetch}
            refreshing={doctorQuery.isRefetching}
            tintColor={BRAND}
          />
        }
      >
        <HeroCard doctor={doctor} />

        {/* Đặt lịch với bác sĩ */}
        <View style={styles.card}>
          <View style={styles.rowCenter}>
            <FontAwesome6 color={BRAND} iconStyle="solid" name="calendar-check" size={16} />
            <Text style={styles.subTitle}>Đặt lịch khám với bác sĩ</Text>
          </View>
          <Text style={[styles.smallText, styles.mt8]}>
            Hệ thống tự động ưu tiên chọn {doctor.name} làm bác sĩ điều trị chính khi bạn đăng ký.
          </Text>
          <TouchableOpacity activeOpacity={0.86} onPress={handleBook} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Đặt lịch khám ngay</Text>
          </TouchableOpacity>
        </View>

        <SectionCard title="Học vấn và bằng cấp">
          {doctor.educations.length ? (
            doctor.educations.map((education, index) => (
              <View key={education.id} style={styles.timelineRow}>
                <View style={styles.timelineIndex}>
                  <Text style={styles.timelineIndexText}>{index + 1}</Text>
                </View>
                <View
                  style={[
                    styles.timelineContent,
                    index < doctor.educations.length - 1 && styles.timelineDivider,
                  ]}
                >
                  <Text style={styles.subTitle}>{education.degree}</Text>
                  <Text style={styles.linkText}>
                    {education.school}
                    {education.graduationYear ? ` · ${education.graduationYear}` : ''}
                  </Text>
                  {education.description ? (
                    <Text style={[styles.bodyText, styles.mt4]}>{education.description}</Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <EmptyContent label="Thông tin học vấn đang được cập nhật." />
          )}
        </SectionCard>

        <SectionCard title="Chứng chỉ chuyên môn">
          {doctor.certificates.length ? (
            doctor.certificates.map(certificate => (
              <View key={certificate.id} style={styles.mediaCard}>
                {certificate.imageUrl ? (
                  <Image
                    resizeMode="cover"
                    source={{ uri: certificate.imageUrl }}
                    style={styles.certificateImage}
                  />
                ) : (
                  // Chưa có ảnh scan thật: hiển thị huy hiệu chứng nhận thay vì ảnh minh họa
                  <View style={styles.certificateBadge}>
                    <View style={styles.certificateBadgeFrame} />
                    <View style={styles.certificateBadgeIcon}>
                      <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="award" size={22} />
                    </View>
                    <Text style={styles.certificateBadgeLabel}>Chứng nhận chuyên môn</Text>
                    <Text numberOfLines={1} style={styles.certificateBadgeIssuer}>
                      {certificate.issuer}
                    </Text>
                  </View>
                )}
                <View style={styles.mediaCardBody}>
                  <Text style={styles.subTitle}>{certificate.title}</Text>
                  <Text style={styles.certificateMeta}>
                    {certificate.issuer} · {formatMonthYear(certificate.issuedAt)}
                  </Text>
                  {certificate.description ? (
                    <Text style={[styles.smallText, styles.mt4]}>{certificate.description}</Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <EmptyContent label="Chứng chỉ chuyên môn đang được cập nhật." />
          )}
        </SectionCard>

        {visibleMedia.length ? (
          <SectionCard title="Hình ảnh minh chứng">
            <View style={styles.mediaGrid}>
              {visibleMedia.map(media => (
                <View key={media.id} style={[styles.mediaCard, styles.mediaGridItem]}>
                  <Image resizeMode="cover" source={{ uri: media.url }} style={styles.mediaImage} />
                  <Text numberOfLines={2} style={styles.mediaCaption}>
                    {media.alt || 'Hình ảnh hồ sơ bác sĩ'}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Đánh giá từ bệnh nhân">
          {doctor.reviews.length ? (
            doctor.reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.flex1}>
                    <Text style={styles.subTitle}>{review.patientName}</Text>
                    <Text style={styles.smallText}>{review.serviceName}</Text>
                  </View>
                  <View style={styles.ratingPill}>
                    <Text style={styles.ratingPillText}>★ {review.rating}</Text>
                  </View>
                </View>
                {review.comment ? (
                  <Text style={[styles.bodyText, styles.mt8]}>{review.comment}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.bodyText}>Bác sĩ chưa có đánh giá công khai.</Text>
          )}
        </SectionCard>

        {/* Tư vấn trực tuyến */}
        <View style={styles.card}>
          <View style={styles.rowCenter}>
            <View style={styles.consultIcon}>
              <FontAwesome6 color={BRAND} iconStyle="solid" name="video" size={14} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.subTitle}>Tư vấn trực tuyến 1:1</Text>
              <Text style={styles.smallText}>Kết nối trực tiếp qua video call</Text>
            </View>
          </View>
          <Text style={[styles.smallText, styles.mt8]}>
            Đăng ký lịch tư vấn trực tuyến từ xa với bác sĩ để nhận chẩn đoán sơ bộ và phương án điều trị.
          </Text>
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => navigation.navigate(SCREEN_NAME.PATIENT_CONSULTATION)}
            style={styles.outlineButton}
          >
            <Text style={styles.outlineButtonText}>Đăng ký tư vấn Telehealth</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <FloatingChatButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBarTitle: { color: '#0F172A', flex: 1, fontSize: 16, fontWeight: '800' },
  backButton: {
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  scroll: { gap: 14, padding: 14, paddingBottom: 96 },
  centerBox: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  centerText: { color: '#64748B', fontSize: 13, marginTop: 10, textAlign: 'center' },
  notFoundTitle: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  notFoundButton: { marginTop: 18, paddingHorizontal: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  flex1: { flex: 1 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  rowCenter: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  sectionTitle: { color: '#020617', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  sectionBody: { gap: 12, marginTop: 14 },
  subTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  bodyText: { color: '#475569', fontSize: 13, lineHeight: 20 },
  smallText: { color: '#64748B', fontSize: 12, lineHeight: 18 },
  linkText: { color: BRAND, fontSize: 13, marginTop: 2 },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 70,
    padding: 14,
  },
  emptyText: { color: '#64748B', fontSize: 13, textAlign: 'center' },

  // Hero
  heroCard: { overflow: 'hidden', padding: 0 },
  heroMedia: {
    aspectRatio: 4 / 3.6,
    backgroundColor: '#EFF6FF',
    position: 'relative',
    width: '100%',
  },
  heroImage: { height: '100%', width: '100%' },
  heroInitials: {
    alignItems: 'center',
    backgroundColor: BRAND,
    flex: 1,
    justifyContent: 'center',
  },
  heroInitialsText: { color: '#FFFFFF', fontSize: 40, fontWeight: '900' },
  workplaceBox: {
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    bottom: 14,
    left: 14,
    padding: 12,
    position: 'absolute',
    right: 14,
  },
  workplaceLabel: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 11 },
  workplaceValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 2 },
  heroBody: { padding: 16 },
  specialtyPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  specialtyPillText: { color: BRAND, fontSize: 12, fontWeight: '800' },
  doctorName: { color: BRAND, fontSize: 24, fontWeight: '900', marginTop: 12 },
  positionText: { color: '#475569', fontSize: 14, marginTop: 6 },
  positionLabel: { color: '#0F172A', fontWeight: '800' },
  bioText: { color: '#475569', fontSize: 13, lineHeight: 21, marginTop: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  statBox: { borderRadius: 16, flexBasis: '47%', flexGrow: 1, padding: 14 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#64748B', fontSize: 12, marginTop: 2 },

  // Học vấn
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineIndex: {
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  timelineIndexText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  timelineContent: { flex: 1, paddingBottom: 12 },
  timelineDivider: { borderBottomColor: '#F1F5F9', borderBottomWidth: 1 },

  // Chứng chỉ & hình ảnh
  mediaCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mediaCardBody: { padding: 12 },
  certificateImage: { aspectRatio: 16 / 9, width: '100%' },
  certificateBadge: {
    alignItems: 'center',
    aspectRatio: 16 / 9,
    backgroundColor: '#EFF6FF',
    gap: 6,
    justifyContent: 'center',
    padding: 14,
    width: '100%',
  },
  certificateBadgeFrame: {
    borderColor: '#BFDBFE',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    bottom: 10,
    left: 10,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  certificateBadgeIcon: {
    alignItems: 'center',
    backgroundColor: BRAND,
    borderColor: '#DBEAFE',
    borderRadius: 28,
    borderWidth: 4,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  certificateBadgeLabel: {
    color: BRAND,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  certificateBadgeIssuer: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  certificateMeta: { color: BRAND, fontSize: 12, fontWeight: '700', marginTop: 4 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mediaGridItem: { flexBasis: '47%', flexGrow: 1 },
  mediaImage: { aspectRatio: 4 / 3, width: '100%' },
  mediaCaption: { color: '#64748B', fontSize: 11, padding: 8 },

  // Đánh giá
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  reviewHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  ratingPill: { backgroundColor: '#FFFBEB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  ratingPillText: { color: '#D97706', fontSize: 12, fontWeight: '800' },

  // Nút
  primaryButton: {
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    marginTop: 14,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  consultIcon: {
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  outlineButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 246, 255, 0.6)',
    borderColor: '#BFDBFE',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginTop: 12,
  },
  outlineButtonText: { color: BRAND, fontSize: 13, fontWeight: '800' },
});
