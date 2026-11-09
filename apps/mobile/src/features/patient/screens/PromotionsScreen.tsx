import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { EmptyState, Screen } from '~src/components/ui';
import { SCREEN_NAME } from '~src/constants/screenName';
import { getClinicConfigInfo } from '~src/features/home/api';
import { FloatingChatButton } from '~src/features/home/components/FloatingChatButton';
import { PatientDrawerModal } from '~src/features/home/components/PatientDrawerModal';
import { PatientFooter } from '~src/features/home/components/PatientFooter';
import { PatientHomeHeader } from '~src/features/home/components/PatientHomeHeader';
import { usePatientDrawerActions } from '~src/features/home/hooks/usePatientDrawerActions';
import { CACHE_TIMES, queryKeys } from '~src/config/queryClient';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  const clinicQuery = useQuery({
    queryKey: queryKeys.clinicConfig,
    queryFn: getClinicConfigInfo,
    staleTime: CACHE_TIMES.CLINIC_CONFIG.staleTime,
    gcTime: CACHE_TIMES.CLINIC_CONFIG.gcTime,
  });

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
                onPress={() =>
                  navigation.navigate(SCREEN_NAME.PATIENT_PROMOTION_DETAIL, {
                    promotionId: item.id,
                  })
                }
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
        hasNotification={true}
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationPress={() =>
          navigation.navigate(SCREEN_NAME.PATIENT_NOTIFICATIONS as never)
        }
        user={user}
      />

      <PatientDrawerModal
        clinicPhone={clinicQuery.data?.phone}
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
        <FlatList
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
          ListFooterComponent={<PatientFooter clinic={clinicQuery.data} />}
          refreshControl={
            <RefreshControl
              colors={['#0058bc']}
              tintColor="#0058bc"
              onRefresh={promotionsQuery.refetch}
              refreshing={Boolean(promotionsQuery.isRefetching)}
            />
          }
          showsVerticalScrollIndicator={false}
          renderItem={renderPromotionCard}
        />
      )}

      <FloatingChatButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexWrap: 'wrap',
    rowGap: 8,
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
    flexWrap: 'wrap',
    rowGap: 8,
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
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    position: 'relative',
  },
  introBox: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listContent: {
    gap: 0,
    padding: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
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
