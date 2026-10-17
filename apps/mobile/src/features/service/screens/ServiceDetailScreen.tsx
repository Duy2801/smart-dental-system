import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
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
import { SCREEN_NAME } from '~src/constants/screenName';
import { CACHE_TIMES } from '~src/config/queryClient';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import { formatServicePrice, getPatientServiceDetail } from '../api';
import type { DentalService, TreatmentMethod } from '../types';

type RouteParams = { serviceId?: string; methodId?: string };

const BRAND = '#0863c5';

const HIGHLIGHT_ICONS: Record<string, string> = {
  shield: 'shield-halved',
  sparkles: 'wand-magic-sparkles',
  checkup: 'stethoscope',
  clock: 'clock',
};

function hasItems<T>(values?: T[] | null): values is T[] {
  return Array.isArray(values) && values.length > 0;
}

function minutesLabel(value?: number | null) {
  return value ? `${value} phút` : 'Đang cập nhật';
}

/** Tiêu đề khối nội dung giống SectionHeading của web */
function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string | null }) {
  return (
    <View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? <Text style={styles.sectionDesc}>{description}</Text> : null}
    </View>
  );
}

function EmptyContent({ label }: { label: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{label} chưa được cập nhật trong hệ thống.</Text>
    </View>
  );
}

function Bullet({ color = BRAND }: { color?: string }) {
  return <View style={[styles.bullet, { backgroundColor: color }]} />;
}

export function ServiceDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { serviceId, methodId } = (route.params ?? {}) as RouteParams;
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Mở sang dịch vụ / phương pháp khác: bỏ lựa chọn cũ để theo đúng tham số mới
  useEffect(() => {
    setSelectedMethodId(null);
    setOpenFaqId(null);
  }, [serviceId, methodId]);

  const serviceQuery = useQuery({
    queryKey: ['patient-service-detail', serviceId],
    queryFn: () => getPatientServiceDetail(serviceId as string),
    enabled: Boolean(serviceId),
    staleTime: CACHE_TIMES.CATALOG.staleTime,
    gcTime: CACHE_TIMES.CATALOG.gcTime,
  });
  const service: DentalService | null = serviceQuery.data ?? null;
  const methods = useMemo(() => service?.treatmentMethods ?? [], [service]);

  const activeMethod: TreatmentMethod | null =
    methods.find(m => m.id === selectedMethodId) ||
    methods.find(m => m.id === methodId) ||
    methods[0] ||
    null;

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('ServiceCatalogMain');
  };

  const goToCatalog = () => navigation.navigate('ServiceCatalogMain');

  const handleBook = () => {
    if (!service) return;
    const parentNav = navigation?.getParent?.() || navigation;
    parentNav?.navigate?.(SCREEN_NAME.FUNCTION as never, {
      screen: 'AppointmentMain',
      params: {
        initialServiceId: service.id,
        initialMethodId: activeMethod?.id,
        initialMode: 'booking',
      },
    } as never);
  };

  const topBar = (
    <View style={styles.topBar}>
      <TouchableOpacity accessibilityLabel="Quay lại" activeOpacity={0.8} onPress={goBack} style={styles.backButton}>
        <FontAwesome6 color="#334155" iconStyle="solid" name="arrow-left" size={14} />
      </TouchableOpacity>
    </View>
  );

  if (serviceQuery.isLoading) {
    return (
      <Screen>
        {topBar}
        <View style={styles.centerBox}>
          <ActivityIndicator color={BRAND} size="large" />
          <Text style={styles.centerText}>Đang tải thông tin dịch vụ...</Text>
        </View>
      </Screen>
    );
  }

  if (!service || service.isActive === false) {
    return (
      <Screen>
        {topBar}
        <View style={styles.centerBox}>
          <Text style={styles.notFoundTitle}>Không tìm thấy dịch vụ</Text>
          <Text style={styles.centerText}>Dịch vụ có thể đã ngừng hiển thị hoặc chưa được cập nhật.</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={goToCatalog} style={[styles.primaryButton, styles.notFoundButton]}>
            <Text style={styles.primaryButtonText}>Quay lại danh sách</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const heroMedia = activeMethod?.media?.[0];
  const heroTitle = activeMethod?.name ?? service.title;
  const heroDescription = activeMethod?.description || service.detailSummary || service.description;
  const heroImage = activeMethod?.imageUrl || heroMedia?.url || service.image;
  const price = activeMethod ? formatServicePrice(activeMethod.basePrice) : service.price;
  const duration = activeMethod?.durationMinutes || service.durationMinutes;
  const steps = hasItems(activeMethod?.procedureSteps) ? activeMethod!.procedureSteps! : service.procedureSteps;
  const faqs = hasItems(activeMethod?.faqs) ? activeMethod!.faqs! : service.faqs;

  return (
    <Screen>
      {topBar}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            colors={[BRAND]}
            onRefresh={serviceQuery.refetch}
            refreshing={serviceQuery.isRefetching}
            tintColor={BRAND}
          />
        }
      >
        {/* 1. Hero */}
        <View style={styles.card}>
          <View style={styles.heroMedia}>
            {heroImage ? (
              <Image resizeMode="cover" source={{ uri: heroImage }} style={styles.heroImage} />
            ) : (
              <FontAwesome6 color="#93C5FD" iconStyle="solid" name="tooth" size={48} />
            )}
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.serviceBadge}>
              <View style={styles.badgeDot} />
              <Text style={styles.serviceBadgeText}>{service.title}</Text>
            </View>
            {activeMethod ? (
              <View style={styles.deepBadge}>
                <Text style={styles.deepBadgeText}>Chuyên sâu</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.heroTitle}>{heroTitle}</Text>
          {heroDescription ? (
            <Text numberOfLines={4} style={styles.heroDesc}>
              {heroDescription}
            </Text>
          ) : (
            <EmptyContent label="Thông tin phương pháp điều trị" />
          )}

          <View style={styles.specGrid}>
            <View style={[styles.specBox, styles.specBlue]}>
              <View style={[styles.specIcon, styles.specIconBlue]}>
                <FontAwesome6 color={BRAND} iconStyle="solid" name="shield-halved" size={16} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.specLabel}>Tiêu chuẩn phục vụ</Text>
                <Text style={styles.specValue}>Chuẩn Y Khoa</Text>
              </View>
            </View>
            <View style={[styles.specBox, styles.specGreen]}>
              <View style={[styles.specIcon, styles.specIconGreen]}>
                <FontAwesome6 color="#059669" iconStyle="solid" name="user-check" size={15} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.specLabel}>Kế hoạch điều trị</Text>
                <Text style={styles.specValue}>Cá nhân hóa</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Phương pháp điều trị */}
        {hasItems(methods) ? (
          <View style={[styles.card, styles.methodsCard]}>
            <SectionHeading
              eyebrow="Tùy chọn & Phương pháp"
              title="Các phương pháp điều trị"
              description="Lựa chọn phương pháp điều trị phù hợp với nhu cầu và ngân sách của bạn."
            />
            <View style={styles.stack}>
              {methods.map(method => {
                const selected = activeMethod?.id === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    activeOpacity={0.85}
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedMethodId(method.id)}
                    style={[styles.methodOption, selected ? styles.methodOptionActive : null]}
                  >
                    <View style={styles.methodTop}>
                      <View style={styles.methodTag}>
                        <Text style={styles.methodTagText}>Phương pháp</Text>
                      </View>
                      {selected ? (
                        <View style={styles.checkCircle}>
                          <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="check" size={10} />
                        </View>
                      ) : null}
                    </View>
                    <Text numberOfLines={2} style={styles.methodName}>
                      {method.name}
                    </Text>
                    <Text numberOfLines={3} style={styles.methodDesc}>
                      {method.description || 'Chi tiết phương pháp điều trị chuyên sâu.'}
                    </Text>
                    <View style={styles.methodFooter}>
                      <Text style={styles.methodCostLabel}>Chi phí:</Text>
                      <Text style={styles.methodCost}>{formatServicePrice(method.basePrice)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* 3. Điểm nổi bật */}
        {hasItems(service.highlights) ? (
          <View style={styles.stack}>
            {service.highlights.map(item => (
              <View key={`${item.title}-${item.description}`} style={styles.card}>
                <View style={styles.highlightIcon}>
                  <FontAwesome6
                    color={BRAND}
                    iconStyle="solid"
                    name={(HIGHLIGHT_ICONS[item.icon] ?? 'shield-halved') as never}
                    size={18}
                  />
                </View>
                <Text style={styles.highlightTitle}>{item.title}</Text>
                <Text style={styles.bodyText}>{item.description}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* 5. Quy trình */}
        <View style={styles.card}>
          <SectionHeading
            eyebrow="Quy trình"
            title={`Các bước thực hiện${activeMethod ? ` (${activeMethod.name})` : ''}`}
            description="Quy trình được quản trị từ dữ liệu dịch vụ và phương pháp điều trị."
          />
          {hasItems(steps) ? (
            <View style={styles.stack}>
              {steps.map(step => (
                <View key={step.id} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.stepOrder}</Text>
                  </View>
                  <View style={[styles.flex1, styles.stepBody]}>
                    <View style={styles.stepTitleRow}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      {step.durationMinutes ? (
                        <View style={styles.stepDuration}>
                          <Text style={styles.stepDurationText}>{minutesLabel(step.durationMinutes)}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.bodyText}>{step.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.stack}>
              <EmptyContent label="Quy trình điều trị" />
            </View>
          )}
        </View>

        {/* 6. Bảng thông tin chi phí */}
        <View style={styles.card}>
          <SectionHeading eyebrow="Chi phí" title="Bảng thông tin dịch vụ" description={service.pricingNote} />
          <View style={styles.stack}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hạng mục: Dịch vụ</Text>
              <Text style={styles.infoValue}>{service.title}</Text>
              <Text style={styles.smallText}>Theo danh mục {service.category}</Text>
            </View>
            {activeMethod ? (
              <View style={[styles.infoRow, styles.infoDivider]}>
                <Text style={styles.infoLabel}>Hạng mục: Phương pháp chọn</Text>
                <Text style={[styles.infoValue, styles.infoValueBrand]}>{activeMethod.name}</Text>
                {activeMethod.description ? <Text style={styles.smallText}>{activeMethod.description}</Text> : null}
              </View>
            ) : null}
            <View style={[styles.infoRow, styles.infoDivider]}>
              <Text style={styles.infoLabel}>Hạng mục: Chi phí</Text>
              <Text style={styles.infoPrice}>{price}</Text>
              <Text style={styles.smallText}>{service.pricingNote || 'Chưa cập nhật ghi chú giá'}</Text>
            </View>
          </View>
        </View>

        {/* 8. Lưu ý quan trọng */}
        {hasItems(service.importantNotes) ? (
          <View style={[styles.card, styles.noteCard]}>
            <View style={styles.noteTitleRow}>
              <FontAwesome6 color="#D97706" iconStyle="solid" name="shield-halved" size={16} />
              <Text style={styles.noteTitle}>Lưu ý quan trọng</Text>
            </View>
            {service.importantNotes.map(item => (
              <Text key={item} style={styles.noteText}>
                {item}
              </Text>
            ))}
          </View>
        ) : null}

        {/* 10. FAQ */}
        <View style={styles.card}>
          <SectionHeading eyebrow="FAQ" title="Câu hỏi thường gặp" description="FAQ được lấy từ dữ liệu quản trị dịch vụ." />
          {hasItems(faqs) ? (
            <View style={styles.faqList}>
              {faqs.map(faq => {
                const open = openFaqId === faq.id;
                return (
                  <View key={faq.id} style={styles.faqItem}>
                    <TouchableOpacity
                      accessibilityState={{ expanded: open }}
                      activeOpacity={0.7}
                      onPress={() => setOpenFaqId(open ? null : faq.id)}
                      style={styles.faqQuestionRow}
                    >
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                      <FontAwesome6
                        color="#94A3B8"
                        iconStyle="solid"
                        name={open ? 'chevron-down' : 'chevron-right'}
                        size={12}
                      />
                    </TouchableOpacity>
                    {open ? <Text style={styles.faqAnswer}>{faq.answer}</Text> : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.stack}>
              <EmptyContent label="FAQ" />
            </View>
          )}
        </View>

        {/* 12. Khung đặt lịch (BookingPanel) */}
        <View style={[styles.card, styles.bookingCard]}>
          <View style={styles.bookingHeader}>
            <View style={styles.ctaTag}>
              <Text style={styles.ctaTagText}>ĐẶT LỊCH ƯU TIÊN</Text>
            </View>
            <Text style={styles.bookingTitle}>Chọn ngay {activeMethod?.name ?? service.title}</Text>
            <Text style={styles.ctaDesc}>Hệ thống sẽ chuyển sang lịch hẹn và tự chọn dịch vụ này cho bạn.</Text>
          </View>
          <View style={styles.bookingBody}>
            <View style={[styles.bookingRow, styles.bookingRowBlue]}>
              <Text style={styles.bookingRowLabel}>Giá từ</Text>
              <Text style={styles.bookingPrice}>{price}</Text>
            </View>
            <View style={[styles.bookingRow, styles.bookingRowGray]}>
              <View style={styles.bookingRowLeft}>
                <FontAwesome6 color={BRAND} iconStyle="regular" name="clock" size={13} />
                <Text style={styles.bookingRowLabel}>Thời lượng</Text>
              </View>
              <Text style={styles.bookingDuration}>{minutesLabel(duration)}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={handleBook} style={[styles.primaryButton, styles.bookingButton]}>
              <Text style={styles.primaryButtonText}>Đặt dịch vụ ngay</Text>
              <FontAwesome6 color="#FFFFFF" iconStyle="regular" name="calendar" size={14} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={goToCatalog} style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Xem dịch vụ khác</Text>
            </TouchableOpacity>
          </View>

          {hasItems(service.includedItems) ? (
            <View style={styles.includedBox}>
              <View style={styles.noteTitleRow}>
                <FontAwesome6 color="#059669" iconStyle="solid" name="shield-halved" size={14} />
                <Text style={styles.includedTitle}>Bao gồm trong buổi hẹn</Text>
              </View>
              {service.includedItems.slice(0, 4).map(item => (
                <View key={item} style={styles.listRow}>
                  <Bullet color="#10B981" />
                  <Text style={[styles.smallText, styles.flex1]}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <FloatingChatButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
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
  stack: { gap: 12, marginTop: 14 },
  eyebrow: { color: BRAND, fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionTitle: { color: '#020617', fontSize: 19, fontWeight: '800', letterSpacing: -0.2, marginTop: 6 },
  sectionDesc: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 8 },
  bodyText: { color: '#475569', fontSize: 13, lineHeight: 20 },
  smallText: { color: '#64748B', fontSize: 12, lineHeight: 18 },
  subTitle: { color: '#020617', fontSize: 14, fontWeight: '800' },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 80,
    padding: 14,
  },
  emptyText: { color: '#64748B', fontSize: 13, textAlign: 'center' },
  heroMedia: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 16,
    borderWidth: 1,
    aspectRatio: 4 / 3,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
    width: '100%',
  },
  heroImage: { borderRadius: 12, height: '100%', width: '100%' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  serviceBadge: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeDot: { backgroundColor: BRAND, borderRadius: 3, height: 6, width: 6 },
  serviceBadgeText: { color: BRAND, fontSize: 12, fontWeight: '700' },
  deepBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deepBadgeText: { color: '#047857', fontSize: 12, fontWeight: '600' },
  heroTitle: { color: '#020617', fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginTop: 10 },
  heroDesc: { color: '#475569', fontSize: 14, lineHeight: 21, marginTop: 8 },
  specGrid: { gap: 10, marginTop: 16 },
  specBox: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  specBlue: { backgroundColor: '#F5F9FF', borderColor: '#DBEAFE' },
  specGreen: { backgroundColor: '#F2FBF7', borderColor: '#D1FAE5' },
  specIcon: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  specIconBlue: { backgroundColor: '#DBEAFE' },
  specIconGreen: { backgroundColor: '#D1FAE5' },
  specLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  specValue: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 14,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  methodsCard: { backgroundColor: '#F5F8FF', borderColor: '#DBEAFE' },
  methodOption: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  methodOptionActive: { backgroundColor: '#FFFFFF', borderColor: BRAND, borderWidth: 2 },
  methodTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  methodTag: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  methodTagText: { color: BRAND, fontSize: 12, fontWeight: '700' },
  checkCircle: { alignItems: 'center', backgroundColor: BRAND, borderRadius: 10, height: 20, justifyContent: 'center', width: 20 },
  methodName: { color: '#020617', fontSize: 15, fontWeight: '800', lineHeight: 22, marginTop: 10 },
  methodDesc: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 6 },
  methodFooter: { borderTopColor: '#F1F5F9', borderTopWidth: 1, marginTop: 12, paddingTop: 10 },
  methodCostLabel: { color: '#94A3B8', fontSize: 11 },
  methodCost: { color: BRAND, fontSize: 17, fontWeight: '800' },
  highlightIcon: { alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  highlightTitle: { color: '#020617', fontSize: 15, fontWeight: '800', marginBottom: 6, marginTop: 12 },
  softBox: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 16, borderWidth: 1, gap: 10, padding: 14 },
  listRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  checkSoft: { alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 10, height: 20, justifyContent: 'center', marginTop: 1, width: 20 },
  bullet: { borderRadius: 3, height: 6, marginTop: 7, width: 6 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepNumber: { alignItems: 'center', backgroundColor: BRAND, borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  stepNumberText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  stepBody: { borderBottomColor: '#F1F5F9', borderBottomWidth: 1, paddingBottom: 12 },
  stepTitleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  stepTitle: { color: '#020617', fontSize: 14, fontWeight: '800' },
  stepDuration: { backgroundColor: '#EFF6FF', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  stepDurationText: { color: BRAND, fontSize: 10, fontWeight: '700' },
  infoRow: { gap: 3 },
  infoDivider: { borderTopColor: '#F1F5F9', borderTopWidth: 1, paddingTop: 12 },
  infoLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  infoValue: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  infoValueBrand: { color: BRAND },
  infoPrice: { color: BRAND, fontSize: 20, fontWeight: '800' },
  noteCard: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  noteTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  noteTitle: { color: '#020617', fontSize: 15, fontWeight: '800' },
  noteText: { color: '#334155', fontSize: 13, lineHeight: 20, marginTop: 10 },
  galleryItem: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  galleryImage: { aspectRatio: 4 / 3, width: '100%' },
  galleryCaption: { color: '#64748B', fontSize: 12, padding: 10 },
  faqList: { marginTop: 8 },
  faqItem: { borderBottomColor: '#F1F5F9', borderBottomWidth: 1, paddingVertical: 14 },
  faqQuestionRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  faqQuestion: { color: '#020617', flex: 1, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  faqAnswer: { color: '#475569', fontSize: 13, lineHeight: 22, marginTop: 10 },
  ctaBanner: { backgroundColor: '#0863c5', borderRadius: 24, overflow: 'hidden', padding: 20 },
  ctaGlow: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 96, height: 192, position: 'absolute', right: -48, top: -48, width: 192 },
  ctaTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  ctaTagText: { color: '#DBEAFE', fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  ctaTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', lineHeight: 26, marginTop: 10 },
  ctaDesc: { color: 'rgba(219,234,254,0.9)', fontSize: 12, lineHeight: 18, marginTop: 8 },
  ctaButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, height: 48, justifyContent: 'center', marginTop: 16 },
  ctaButtonText: { color: BRAND, fontSize: 14, fontWeight: '800' },
  bookingCard: { overflow: 'hidden', padding: 0 },
  bookingHeader: { backgroundColor: '#0863c5', padding: 18 },
  bookingTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', lineHeight: 24, marginTop: 8 },
  bookingBody: { gap: 10, padding: 16 },
  bookingRow: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  bookingRowBlue: { backgroundColor: '#EFF6FF' },
  bookingRowGray: { backgroundColor: '#F8FAFC' },
  bookingRowLeft: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  bookingRowLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  bookingPrice: { color: BRAND, fontSize: 19, fontWeight: '800' },
  bookingDuration: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  bookingButton: { marginTop: 6 },
  outlineButton: { alignItems: 'center', borderColor: '#E2E8F0', borderRadius: 12, borderWidth: 1, height: 44, justifyContent: 'center' },
  outlineButtonText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  includedBox: { backgroundColor: '#ECFDF5', borderTopColor: '#D1FAE5', borderTopWidth: 1, gap: 10, padding: 16 },
  includedTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
});

export default ServiceDetailScreen;
