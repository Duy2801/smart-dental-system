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
import { SCREEN_NAME } from '~src/constants/screenName';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import type { PatientHomeScreenProps } from '~src/routes/types';
import { formatVnd, getPatientPromotions } from '../api';

type Props = PatientHomeScreenProps<'PatientPromotionDetail'>;

const BRAND = '#0863c5';

const defaultPromoBanner =
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=60';

export default function PromotionDetailScreen({ navigation, route }: Props) {
  const promotionId = route.params?.promotionId;

  // Dùng chung cache với danh sách ưu đãi nên mở từ danh sách là có dữ liệu ngay
  const promotionsQuery = useQuery({
    queryFn: () => getPatientPromotions(),
    queryKey: ['patient', 'promotions'],
  });
  const promo = promotionsQuery.data?.find(item => item.id === promotionId) ?? null;

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(SCREEN_NAME.PATIENT_PROMOTIONS);
  };

  const handleApply = () => {
    if (!promo) return;
    (navigation.getParent() as any)?.navigate(SCREEN_NAME.FUNCTION, {
      screen: 'AppointmentMain',
      params: {
        promoCode: promo.code,
        treatmentMethodId: promo.applicable_treatment_method_id,
        serviceId: promo.applicable_treatment_method?.serviceId,
      },
    });
  };

  const topBar = (
    <View style={styles.topBar}>
      <TouchableOpacity accessibilityLabel="Quay lại" activeOpacity={0.8} onPress={goBack} style={styles.backButton}>
        <FontAwesome6 color="#334155" iconStyle="solid" name="arrow-left" size={14} />
      </TouchableOpacity>
      <Text numberOfLines={1} style={styles.topBarTitle}>
        Chi tiết ưu đãi
      </Text>
    </View>
  );

  if (promotionsQuery.isLoading) {
    return (
      <Screen>
        {topBar}
        <View style={styles.centerBox}>
          <ActivityIndicator color={BRAND} size="large" />
          <Text style={styles.centerText}>Đang tải thông tin ưu đãi...</Text>
        </View>
      </Screen>
    );
  }

  if (!promo) {
    return (
      <Screen>
        {topBar}
        <View style={styles.centerBox}>
          <Text style={styles.notFoundTitle}>Không tìm thấy ưu đãi</Text>
          <Text style={styles.centerText}>
            Chương trình có thể đã kết thúc hoặc ngừng áp dụng.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate(SCREEN_NAME.PATIENT_PROMOTIONS)}
            style={[styles.primaryButton, styles.notFoundButton]}
          >
            <Text style={styles.primaryButtonText}>Xem ưu đãi khác</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const discountLabel =
    promo.discount_type === 'PERCENTAGE'
      ? `Giảm ${promo.discount_value}%`
      : `Giảm ${formatVnd(promo.discount_value)}`;

  // Bảng tính chi phí dự kiến cho dịch vụ được áp dụng (giống web)
  const method = promo.applicable_treatment_method;
  const basePrice = method?.basePrice ? Number(method.basePrice) : 0;
  let calculatedDiscount = 0;
  if (basePrice > 0) {
    calculatedDiscount =
      promo.discount_type === 'PERCENTAGE'
        ? Math.round((basePrice * promo.discount_value) / 100)
        : Math.min(basePrice, promo.discount_value);
    if (promo.max_discount_amount) {
      calculatedDiscount = Math.min(calculatedDiscount, promo.max_discount_amount);
    }
  }
  const finalPrice = Math.max(0, basePrice - calculatedDiscount);

  const conditions = [
    {
      icon: 'cart-shopping',
      label: 'Đơn tối thiểu',
      value: promo.min_order_amount > 0 ? formatVnd(promo.min_order_amount) : 'Không giới hạn',
      color: BRAND,
      bg: '#EFF6FF',
    },
    {
      icon: 'ticket',
      label: 'Lượt dùng còn lại',
      value:
        promo.max_uses > 0
          ? `${Math.max(0, promo.max_uses - promo.used_count)} / ${promo.max_uses}`
          : 'Không giới hạn',
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      icon: 'calendar-days',
      label: 'Hiệu lực đến',
      value: promo.expiry,
      color: '#D97706',
      bg: '#FFFBEB',
    },
    {
      icon: 'tags',
      label: 'Giảm tối đa',
      value: promo.max_discount_amount ? formatVnd(promo.max_discount_amount) : 'Không giới hạn',
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
  ];

  return (
    <Screen>
      {topBar}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            colors={[BRAND]}
            onRefresh={promotionsQuery.refetch}
            refreshing={promotionsQuery.isRefetching}
            tintColor={BRAND}
          />
        }
      >
        {/* 1. Hero */}
        <View style={styles.card}>
          <View style={styles.heroMedia}>
            <Image
              resizeMode="cover"
              source={{ uri: promo.image_url || defaultPromoBanner }}
              style={styles.heroImage}
            />
            <View style={styles.heroDiscountBadge}>
              <Text style={styles.heroDiscountText}>{discountLabel}</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.brandBadge}>
              <View style={styles.badgeDot} />
              <Text style={styles.brandBadgeText}>Ưu đãi nha khoa</Text>
            </View>
            <View style={styles.expiryBadge}>
              <Text style={styles.expiryBadgeText}>HSD: {promo.expiry}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{promo.name || promo.title}</Text>
          {promo.description ? <Text style={styles.heroDesc}>{promo.description}</Text> : null}

          <View style={styles.statsGrid}>
            {conditions.map(item => (
              <View key={item.label} style={[styles.statBox, { backgroundColor: item.bg }]}>
                <FontAwesome6 color={item.color} iconStyle="solid" name={item.icon as never} size={14} />
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text numberOfLines={1} style={[styles.statValue, { color: item.color }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Đặt lịch với ưu đãi */}
        <View style={styles.card}>
          <View style={styles.rowCenter}>
            <FontAwesome6 color={BRAND} iconStyle="solid" name="calendar-check" size={16} />
            <Text style={styles.subTitle}>Đặt lịch với ưu đãi</Text>
          </View>
          <Text style={[styles.smallText, styles.mt8]}>
            Ưu đãi sẽ được tự động áp dụng khi bạn đặt lịch từ trang này.
          </Text>
          <TouchableOpacity activeOpacity={0.86} onPress={handleApply} style={styles.primaryButton}>
            <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="calendar-check" size={14} />
            <Text style={styles.primaryButtonText}>Đặt lịch ngay với ưu đãi</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Dịch vụ áp dụng */}
        {method ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dịch vụ áp dụng</Text>
            <View style={styles.serviceRow}>
              {method.imageUrl ? (
                <Image resizeMode="cover" source={{ uri: method.imageUrl }} style={styles.serviceImage} />
              ) : (
                <View style={[styles.serviceImage, styles.serviceImageFallback]}>
                  <FontAwesome6 color="#93C5FD" iconStyle="solid" name="tooth" size={22} />
                </View>
              )}
              <View style={styles.flex1}>
                <Text numberOfLines={2} style={styles.subTitle}>
                  {method.name}
                </Text>
                <Text style={styles.servicePrice}>{formatVnd(method.basePrice)}</Text>
                {method.durationMinutes ? (
                  <Text style={styles.smallText}>Thời gian: {method.durationMinutes} phút</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.calcBox}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Giá gốc</Text>
                <Text style={styles.calcValue}>{formatVnd(basePrice)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, styles.calcDiscount]}>Ưu đãi</Text>
                <Text style={[styles.calcValue, styles.calcDiscount]}>-{formatVnd(calculatedDiscount)}</Text>
              </View>
              <View style={styles.calcDivider} />
              <View style={styles.calcRow}>
                <Text style={styles.totalLabel}>Chi phí dự kiến</Text>
                <Text style={styles.totalPrice}>{formatVnd(finalPrice)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* 4. Hướng dẫn sử dụng */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hướng dẫn sử dụng</Text>
          <View style={styles.sectionBody}>
            {[
              'Áp dụng khi đặt lịch khám trực tuyến hoặc thanh toán tại quầy.',
              'Mỗi lịch hẹn chỉ áp dụng tối đa 1 mã ưu đãi.',
              'Mã không quy đổi thành tiền mặt.',
            ].map((note, index) => (
              <View key={note} style={styles.stepRow}>
                <View style={styles.stepIndex}>
                  <Text style={styles.stepIndexText}>{index + 1}</Text>
                </View>
                <Text style={[styles.bodyText, styles.flex1]}>{note}</Text>
              </View>
            ))}
          </View>
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
  mt8: { marginTop: 8 },
  rowCenter: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  sectionTitle: { color: '#020617', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  sectionBody: { gap: 12, marginTop: 14 },
  subTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  bodyText: { color: '#475569', fontSize: 13, lineHeight: 20 },
  smallText: { color: '#64748B', fontSize: 12, lineHeight: 18 },

  // Hero
  heroMedia: {
    aspectRatio: 16 / 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  heroImage: { height: '100%', width: '100%' },
  heroDiscountBadge: {
    backgroundColor: BRAND,
    borderRadius: 10,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    top: 12,
  },
  heroDiscountText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  brandBadge: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeDot: { backgroundColor: BRAND, borderRadius: 3, height: 6, width: 6 },
  brandBadgeText: { color: BRAND, fontSize: 12, fontWeight: '800' },
  expiryBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  expiryBadgeText: { color: '#B45309', fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#020617', fontSize: 22, fontWeight: '900', letterSpacing: -0.3, marginTop: 10 },
  heroDesc: { color: '#475569', fontSize: 13, lineHeight: 21, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  statBox: { borderRadius: 16, flexBasis: '47%', flexGrow: 1, gap: 4, padding: 12 },
  statLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', marginTop: 2 },
  statValue: { fontSize: 15, fontWeight: '900' },

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

  // Dịch vụ áp dụng
  serviceRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 14 },
  serviceImage: { borderRadius: 14, height: 72, width: 72 },
  serviceImageFallback: { alignItems: 'center', backgroundColor: '#EFF6FF', justifyContent: 'center' },
  servicePrice: { color: BRAND, fontSize: 14, fontWeight: '800', marginTop: 4 },
  calcBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 14,
    padding: 12,
  },
  calcRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  calcLabel: { color: '#64748B', fontSize: 13 },
  calcValue: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  calcDiscount: { color: '#16A34A', fontWeight: '800' },
  calcDivider: { backgroundColor: '#E2E8F0', height: 1 },
  totalLabel: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  totalPrice: { color: BRAND, fontSize: 18, fontWeight: '900' },

  // Hướng dẫn
  stepRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  stepIndex: {
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepIndexText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
