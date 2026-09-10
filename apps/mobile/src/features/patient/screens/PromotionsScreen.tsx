import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { EmptyState, Screen, ScreenList } from '~src/components/ui';
import { SCREEN_NAME } from '~src/constants/screenName';
import { PatientDrawerModal } from '~src/features/home/components/PatientDrawerModal';
import { PatientFooter } from '~src/features/home/components/PatientFooter';
import { PatientHomeHeader } from '~src/features/home/components/PatientHomeHeader';
import { usePatientDrawerActions } from '~src/features/home/hooks/usePatientDrawerActions';
import type { RootState } from '~src/reducers/store';
import { formatVnd, getPatientPromotions, type PatientPromotion } from '../api';

type FilterTab = 'all' | 'percentage' | 'fixed' | 'expiring';

const defaultPromoBanner =
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=60';

export default function PromotionsScreen({ navigation }: any) {
  const user = useSelector((state: RootState) => state.login?.user ?? null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedPromo, setSelectedPromo] = useState<PatientPromotion | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  const promotionsQuery = useQuery({
    queryFn: () => getPatientPromotions(),
    queryKey: ['patient', 'promotions'],
  });

  const promotions = useMemo(
    () => promotionsQuery.data ?? [],
    [promotionsQuery.data],
  );

  const filteredPromotions = useMemo(() => {
    return promotions.filter(item => {
      const q = searchQuery.trim().toLowerCase();
      const name = (item.name || item.title || '').toLowerCase();
      const code = (item.code || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const matchesSearch =
        !q ||
        name.includes(q) ||
        code.includes(q) ||
        desc.includes(q);

      if (!matchesSearch) return false;

      if (activeTab === 'percentage') {
        return item.discount_type === 'PERCENTAGE';
      }
      if (activeTab === 'fixed') {
        return item.discount_type === 'FIXED_AMOUNT';
      }
      if (activeTab === 'expiring') {
        if (!item.end_date) return false;
        const daysLeft =
          (new Date(item.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysLeft >= 0 && daysLeft <= 30;
      }

      return true;
    });
  }, [promotions, searchQuery, activeTab]);

  const handleCopyCode = (promo: PatientPromotion) => {
    setCopiedId(promo.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleApplyPromotion = (promo: PatientPromotion) => {
    setSelectedPromo(null);
    const tabNav = navigation.getParent?.() || navigation;
    tabNav.navigate(SCREEN_NAME.FUNCTION as never, {
      screen: 'AppointmentMain',
      params: {
        promoCode: promo.code,
        treatmentMethodId: promo.applicable_treatment_method_id,
        serviceId: promo.applicable_treatment_method?.serviceId,
      },
    } as never);
  };

  // Calculation breakdown for selected promotion (matching web)
  const tm = selectedPromo?.applicable_treatment_method;
  const basePrice = tm?.basePrice ? Number(tm.basePrice) : 0;
  const isPercentage = selectedPromo?.discount_type === 'PERCENTAGE';
  const calculatedDiscount = useMemo(() => {
    if (!selectedPromo || basePrice <= 0) return 0;
    if (isPercentage) {
      return Math.round((basePrice * selectedPromo.discount_value) / 100);
    }
    return Math.min(basePrice, selectedPromo.discount_value);
  }, [selectedPromo, basePrice, isPercentage]);
  const finalPrice = Math.max(0, basePrice - calculatedDiscount);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Intro Section */}
      <View style={styles.introBox}>
        <View style={styles.badge}>
          <FontAwesome6
            color="#0058bc"
            iconStyle="solid"
            name="wand-magic-sparkles"
            size={12}
          />
          <Text style={styles.badgeText}>Đặc quyền cho bệnh nhân</Text>
        </View>

        <Text style={styles.title}>Chương Trình Ưu Đãi & Voucher Nha Khoa</Text>

        <Text style={styles.subtitle}>
          Khám phá các mã giảm giá và chương trình ưu đãi đặc biệt từ Smart Dental.
          Áp dụng mã trực tiếp khi đặt lịch khám để tiết kiệm chi phí điều trị tối đa.
        </Text>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBar}>
        <FontAwesome6
          color="#94A3B8"
          iconStyle="solid"
          name="magnifying-glass"
          size={14}
        />
        <TextInput
          onChangeText={setSearchQuery}
          placeholder="Tìm mã ưu đãi, dịch vụ..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={searchQuery}
        />
        {Boolean(searchQuery) && (
          <TouchableOpacity
            hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
            onPress={() => setSearchQuery('')}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {[
          { id: 'all', label: `Tất cả (${promotions.length})` },
          { id: 'percentage', label: 'Giảm phần trăm (%)' },
          { id: 'fixed', label: 'Giảm số tiền' },
          { id: 'expiring', label: 'Sắp hết hạn' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              key={tab.id}
              onPress={() => setActiveTab(tab.id as FilterTab)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderPromotionCard = ({ item }: { item: PatientPromotion }) => {
    const isCopied = copiedId === item.id;
    const isPercentage = item.discount_type === 'PERCENTAGE';
    const discountLabel = isPercentage
      ? `Giảm ${item.discount_value}%`
      : `Giảm ${formatVnd(item.discount_value)}`;

    const usagePercent =
      item.max_uses > 0
        ? Math.min(100, Math.round((item.used_count / item.max_uses) * 100))
        : 0;

    return (
      <View style={styles.card}>
        {/* Card Banner Image */}
        <View style={styles.imageBox}>
          <Image
            resizeMode="cover"
            source={{ uri: item.image_url || defaultPromoBanner }}
            style={styles.cardImage}
          />
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discountLabel}</Text>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardBody}>
          {/* Code badge and Expiry */}
          <View style={styles.codeRow}>
            <View style={styles.codePill}>
              <Text style={styles.codeText}>MÃ: {item.code}</Text>
            </View>
            <View style={styles.expiryRow}>
              <FontAwesome6
                color="#64748B"
                iconStyle="regular"
                name="calendar"
                size={11}
              />
              <Text style={styles.expiryText}>HSD: {item.expiry}</Text>
            </View>
          </View>

          {/* Title */}
          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.name || item.title}
          </Text>

          {/* Description */}
          <Text numberOfLines={2} style={styles.cardDesc}>
            {item.description}
          </Text>

          {/* Progress Bar (if max_uses > 0) */}
          {item.max_uses > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Lượt đã dùng</Text>
                <Text style={styles.progressValue}>
                  {item.used_count}/{item.max_uses}
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${usagePercent}%` },
                    usagePercent >= 90 && styles.progressBarWarn,
                  ]}
                />
              </View>
            </View>
          )}

          {/* Bottom Row */}
          <View style={styles.cardFooter}>
            <Text numberOfLines={1} style={styles.minOrderText}>
              {item.min_order_amount > 0
                ? `Đơn từ ${formatVnd(item.min_order_amount)}`
                : 'Áp dụng mọi đơn'}
            </Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPromo(item)}
                style={styles.detailBtn}
              >
                <Text style={styles.detailBtnText}>Chi tiết</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCopyCode(item)}
                style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
              >
                <FontAwesome6
                  color="#FFFFFF"
                  iconStyle="solid"
                  name={isCopied ? 'check' : 'copy'}
                  size={11}
                />
                <Text style={styles.copyBtnText}>
                  {isCopied ? 'Đã chép mã!' : 'Sao chép mã'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <PatientHomeHeader
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() =>
          navigation.navigate(SCREEN_NAME.PATIENT_NOTIFICATIONS as never)
        }
      />

      <PatientDrawerModal
        isOpen={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onLogout={handleLogout}
        onNavigate={handleDrawerNavigate}
        user={user}
      />

      {promotionsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#0058bc" size="large" />
          <Text style={styles.loadingText}>Đang tải ưu đãi...</Text>
        </View>
      ) : (
        <ScreenList
          contentContainerStyle={styles.listContent}
          data={filteredPromotions}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <FontAwesome6
                  color="#0058bc"
                  iconStyle="solid"
                  name="circle-info"
                  size={26}
                />
              </View>
              <Text style={styles.emptyTitle}>
                Không tìm thấy ưu đãi phù hợp
              </Text>
              <Text style={styles.emptySubtitle}>
                Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác để xem danh sách khuyến mãi khả dụng.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                style={styles.emptyResetBtn}
              >
                <Text style={styles.emptyResetBtnText}>Đặt lại tìm kiếm</Text>
              </TouchableOpacity>
            </View>
          }
          ListHeaderComponent={renderHeader}
          ListFooterComponent={<PatientFooter />}
          onRefresh={promotionsQuery.refetch}
          refreshing={promotionsQuery.isRefetching}
          renderItem={renderPromotionCard}
        />
      )}

      {/* Promotion Detail Modal */}
      {selectedPromo && (
        <Modal
          animationType="fade"
          hardwareAccelerated
          onRequestClose={() => setSelectedPromo(null)}
          statusBarTranslucent
          transparent
          visible={Boolean(selectedPromo)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setSelectedPromo(null)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.modalSheet}>
              {/* Modal Header */}
              <View style={styles.modalHeaderWeb}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalHeaderIconBox}>
                    <FontAwesome6
                      color="#FACC15"
                      iconStyle="solid"
                      name="wand-magic-sparkles"
                      size={15}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalHeaderSub}>
                      Chi Tiết Chương Trình Ưu Đãi
                    </Text>
                    <Text numberOfLines={1} style={styles.modalHeaderTitleWeb}>
                      {selectedPromo.name || selectedPromo.title}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                  onPress={() => setSelectedPromo(null)}
                  style={styles.modalCloseBtnWeb}
                >
                  <FontAwesome6
                    color="#FFFFFF"
                    iconStyle="solid"
                    name="xmark"
                    size={14}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalBody}
              >
                {/* Modal Banner */}
                <View style={styles.modalBannerBox}>
                  <Image
                    resizeMode="cover"
                    source={{
                      uri: selectedPromo.image_url || defaultPromoBanner,
                    }}
                    style={styles.modalBannerImage}
                  />
                  <View style={styles.modalDiscountBadge}>
                    <Text style={styles.discountBadgeText}>
                      {selectedPromo.discount_type === 'PERCENTAGE'
                        ? `Giảm ${selectedPromo.discount_value}%`
                        : `Giảm ${formatVnd(selectedPromo.discount_value)}`}
                    </Text>
                  </View>
                </View>

                {/* Badges Row */}
                <View style={styles.modalBadgesRow}>
                  <View style={styles.modalBadgePill}>
                    <Text style={styles.modalBadgePillText}>
                      {selectedPromo.discount_type === 'PERCENTAGE'
                        ? `Giảm ${selectedPromo.discount_value}%`
                        : `Giảm ${formatVnd(selectedPromo.discount_value)}`}
                    </Text>
                  </View>
                  <View style={styles.modalExpiryPill}>
                    <Text style={styles.modalExpiryPillText}>
                      Hiệu lực: {selectedPromo.expiry}
                    </Text>
                  </View>
                </View>

                {/* Description Section */}
                <View style={styles.modalSectionBox}>
                  <Text style={styles.modalSectionTitle}>Nội Dung Ưu Đãi</Text>
                  <Text style={styles.modalPromoDesc}>
                    {selectedPromo.description}
                  </Text>
                </View>

                {/* Conditions Grid (2 Columns) */}
                <View style={styles.modalConditionGrid}>
                  <View style={styles.modalConditionCard}>
                    <Text style={styles.modalConditionLabel}>Đơn Hàng Tối Thiểu</Text>
                    <Text style={styles.modalConditionValue}>
                      {selectedPromo.min_order_amount > 0
                        ? formatVnd(selectedPromo.min_order_amount)
                        : 'Không giới hạn'}
                    </Text>
                  </View>
                  <View style={styles.modalConditionCard}>
                    <Text style={styles.modalConditionLabel}>Lượt Dùng Còn Lại</Text>
                    <Text style={styles.modalConditionValue}>
                      {selectedPromo.max_uses > 0
                        ? `${Math.max(0, selectedPromo.max_uses - selectedPromo.used_count)} / ${selectedPromo.max_uses} lượt`
                        : 'Không giới hạn'}
                    </Text>
                  </View>
                </View>

                {/* Promo Code Box */}
                <View style={styles.modalCodeBox}>
                  <View>
                    <Text style={styles.modalCodeLabel}>MÃ ƯU ĐÃI CỦA BẠN</Text>
                    <Text style={styles.modalCodeValue}>
                      {selectedPromo.code}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleCopyCode(selectedPromo)}
                    style={[
                      styles.modalCopyBtn,
                      copiedId === selectedPromo.id && styles.copyBtnSuccess,
                    ]}
                  >
                    <FontAwesome6
                      color="#FFFFFF"
                      iconStyle="solid"
                      name={copiedId === selectedPromo.id ? 'check' : 'copy'}
                      size={12}
                    />
                    <Text style={styles.modalCopyBtnText}>
                      {copiedId === selectedPromo.id
                        ? 'Đã chép mã!'
                        : 'Sao chép mã'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Service Calculation Breakdown (Matching Web) */}
                {Boolean(tm) && tm ? (
                  <View style={styles.modalServiceBox}>
                    <Text style={styles.modalServiceHeaderTitle}>
                      Dịch Vụ Muốn Áp Dụng
                    </Text>
                    <View style={styles.modalServiceSelectedCard}>
                      <Text style={styles.modalServiceName}>{tm.name}</Text>
                      <Text style={styles.modalServicePrice}>
                        {formatVnd(tm.basePrice)}
                      </Text>
                    </View>

                    <View style={styles.modalCalcBox}>
                      <View style={styles.modalCalcRow}>
                        <Text style={styles.modalCalcLabel}>
                          Giá gốc ({tm.name}):
                        </Text>
                        <Text style={styles.modalCalcValue}>
                          {formatVnd(basePrice)}
                        </Text>
                      </View>
                      <View style={styles.modalCalcRow}>
                        <Text
                          style={[
                            styles.modalCalcLabel,
                            { color: '#16A34A', fontWeight: '700' },
                          ]}
                        >
                          Ưu đãi áp dụng ({selectedPromo.code}):
                        </Text>
                        <Text
                          style={[
                            styles.modalCalcValue,
                            { color: '#16A34A', fontWeight: '800' },
                          ]}
                        >
                          -{formatVnd(calculatedDiscount)}
                        </Text>
                      </View>
                      <View style={styles.modalCalcDivider} />
                      <View style={styles.modalCalcRow}>
                        <Text style={styles.modalTotalLabel}>
                          Chi phí thanh toán dự kiến:
                        </Text>
                        <Text style={styles.modalTotalPrice}>
                          {formatVnd(finalPrice)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Terms and Note */}
                <View style={styles.modalNoteBox}>
                  <Text style={styles.modalNoteTitle}>
                    ℹ️ Hướng dẫn sử dụng:
                  </Text>
                  <Text style={styles.modalNoteText}>
                    • Áp dụng khi đặt lịch khám trực tuyến hoặc thanh toán tại quầy.
                  </Text>
                  <Text style={styles.modalNoteText}>
                    • Mỗi lịch hẹn chỉ áp dụng tối đa 1 mã ưu đãi.
                  </Text>
                  <Text style={styles.modalNoteText}>
                    • Mã không quy đổi thành tiền mặt.
                  </Text>
                </View>
              </ScrollView>

              {/* Bottom Apply CTA */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleApplyPromotion(selectedPromo)}
                  style={styles.modalApplyBtn}
                >
                  <FontAwesome6
                    color="#FFFFFF"
                    iconStyle="solid"
                    name="calendar-check"
                    size={14}
                  />
                  <Text style={styles.modalApplyBtnText}>
                    Đặt Dịch Vụ Ngay Với Mã Ưu Đãi
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedPromo(null)}
                  style={styles.modalCloseFooterBtn}
                >
                  <Text style={styles.modalCloseFooterText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardBody: {
    padding: 14,
  },
  cardDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  cardFooter: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  clearBtn: {
    paddingHorizontal: 4,
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  codePill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  codeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeText: {
    color: '#0058bc',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
  },
  conditionLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  conditionValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  copyBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  detailBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailBtnText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: '#0058bc',
    borderRadius: 8,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: 10,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  expiryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  expiryText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: '#0058bc',
    borderColor: '#0058bc',
  },
  filterPillText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterScroll: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  imageBox: {
    backgroundColor: '#F1F5F9',
    height: 140,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  introBox: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listContent: {
    paddingBottom: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 10,
  },
  minOrderText: {
    color: '#64748B',
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  modalApplyBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    flex: 1,
  },
  modalBadgePill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalBadgePillText: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '800',
  },
  modalBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  modalBannerBox: {
    borderRadius: 12,
    height: 130,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  modalBannerImage: {
    height: '100%',
    width: '100%',
  },
  modalBody: {
    padding: 16,
    paddingBottom: 24,
  },
  modalCalcBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  modalCalcDivider: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginVertical: 6,
  },
  modalCalcLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  modalCalcRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  modalCalcValue: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
  },
  modalCloseBtn: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  modalCloseBtnWeb: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  modalCloseFooterBtn: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  modalCloseFooterText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  modalCodeBox: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    padding: 12,
  },
  modalCodeLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  modalCodeValue: {
    color: '#0058bc',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  modalConditionCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  modalConditionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modalConditionLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalConditionValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  modalConditionsBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 12,
    padding: 12,
  },
  modalCopyBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalDiscountBadge: {
    backgroundColor: '#0058bc',
    borderRadius: 8,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: 10,
  },
  modalExpiryPill: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalExpiryPillText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  modalFooter: {
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalHeaderIconBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: 'rgba(250, 204, 21, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  modalHeaderLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  modalHeaderSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modalHeaderTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  modalHeaderTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalHeaderTitleWeb: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  modalHeaderWeb: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalNoteBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  modalNoteText: {
    color: '#92400E',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  modalNoteTitle: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalPromoDesc: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  modalPromoTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSectionBox: {
    marginBottom: 12,
  },
  modalSectionTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalServiceBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  modalServiceHeaderTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalServiceName: {
    color: '#0F172A',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  modalServicePrice: {
    color: '#0058bc',
    fontSize: 12,
    fontWeight: '800',
  },
  modalServiceSelectedCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalTotalLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  modalTotalPrice: {
    color: '#0058bc',
    fontSize: 13,
    fontWeight: '900',
  },
  progressBarFill: {
    backgroundColor: '#0058bc',
    borderRadius: 999,
    height: '100%',
  },
  progressBarTrack: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    height: 6,
    marginTop: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarWarn: {
    backgroundColor: '#F59E0B',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressValue: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
  },
  emptyIconBox: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56,
  },
  emptyResetBtn: {
    backgroundColor: '#0058bc',
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
});
