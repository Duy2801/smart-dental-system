import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import type { HomeBanner, HomeDoctorCard, HomeServiceCard } from '../api';

const fallbackBanner = require('~src/assets/home/bannerhome.png');
const DEFAULT_PLACEHOLDER = 'Tìm kiếm theo dịch vụ, bác sĩ, triệu chứng...';

type SearchResults = {
  doctorMatches: HomeDoctorCard[];
  serviceMatches: HomeServiceCard[];
};

type Suggestion = {
  id: string;
  label: string;
  type: 'service' | 'doctor';
};

type PatientHomeHeroSearchProps = {
  banner?: HomeBanner;
  banners?: HomeBanner[];
  keyword: string;
  onConsultationPress: () => void;
  onKeywordChange: (value: string) => void;
  onQuickAppointmentPress: () => void;
  onSearchSubmit: () => void;
  onSuggestionPress: (suggestion: Suggestion) => void;
  searchResults: SearchResults;
  showResults: boolean;
  suggestions: Suggestion[];
};

function ResultRow({
  icon,
  label,
  meta,
  onPress,
  type,
}: {
  icon: string;
  label: string;
  meta: string;
  onPress: () => void;
  type: 'doctor' | 'service';
}) {
  const isDoctor = type === 'doctor';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.resultRow}
    >
      <View
        style={[
          styles.resultIconBox,
          isDoctor ? styles.docIconBox : styles.svcIconBox,
        ]}
      >
        <FontAwesome6
          color="#0058bc"
          iconStyle="solid"
          name={icon as never}
          size={14}
        />
      </View>
      <View style={styles.resultTextWrapper}>
        <Text numberOfLines={1} style={styles.resultLabel}>
          {label}
        </Text>
        <Text numberOfLines={1} style={styles.resultMeta}>
          {meta}
        </Text>
      </View>
      <View style={styles.resultBadge}>
        <Text style={styles.resultBadgeText}>
          {isDoctor ? 'Bác sĩ ›' : 'Chi tiết ›'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function PatientHomeHeroSearch({
  banner,
  banners = [],
  keyword,
  onConsultationPress,
  onKeywordChange,
  onQuickAppointmentPress,
  onSearchSubmit,
  onSuggestionPress,
  searchResults,
  showResults,
  suggestions,
}: PatientHomeHeroSearchProps) {
  const allBanners = banners.length ? banners : banner ? [banner] : [];
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');

  // Auto-slideshow for hero banners
  useEffect(() => {
    if (allBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx(prev => (prev + 1) % allBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [allBanners.length]);

  // Typewriter effect for placeholder
  useEffect(() => {
    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx = charIdx >= DEFAULT_PLACEHOLDER.length ? 0 : charIdx + 1;
      setAnimatedPlaceholder(DEFAULT_PLACEHOLDER.slice(0, charIdx));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const currentBanner = allBanners[activeBannerIdx % Math.max(allBanners.length, 1)];
  const bannerSource = currentBanner?.imageUrl
    ? { uri: currentBanner.imageUrl }
    : fallbackBanner;

  const noResults =
    searchResults.doctorMatches.length === 0 &&
    searchResults.serviceMatches.length === 0;

  return (
    <View style={styles.container}>
      {/* Top Banner with Carousel */}
      <View style={styles.bannerWrapper}>
        <Image source={bannerSource} style={styles.bannerImage} />
        {allBanners.length > 1 ? (
          <View style={styles.bannerDots}>
            {allBanners.map((_, i) => (
              <View
                key={`dot-${i}`}
                style={[
                  styles.dot,
                  i === activeBannerIdx ? styles.dotActive : null,
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>

      {/* Floating White Search Card */}
      <View style={styles.searchCard}>
        {/* Search Input Row */}
        <View style={styles.inputRow}>
          <FontAwesome6
            color="#94A3B8"
            iconStyle="solid"
            name="magnifying-glass"
            size={15}
          />
          <TextInput
            accessibilityLabel="Tìm kiếm dịch vụ nha khoa hoặc bác sĩ"
            onChangeText={onKeywordChange}
            onSubmitEditing={onSearchSubmit}
            placeholder={animatedPlaceholder || DEFAULT_PLACEHOLDER}
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            style={styles.textInput}
            value={keyword}
          />
          {keyword ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onKeywordChange('')}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onSearchSubmit}
            style={styles.searchBtn}
          >
            <Text style={styles.searchBtnText}>Tìm kiếm</Text>
          </TouchableOpacity>
        </View>

        {/* Live Search Autocomplete Dropdown */}
        {showResults ? (
          <View style={styles.dropdown}>
            {noResults ? (
              <View style={styles.emptyResults}>
                <FontAwesome6
                  color="#CBD5E1"
                  iconStyle="solid"
                  name="magnifying-glass"
                  size={20}
                />
                <Text style={styles.emptyResultsTitle}>
                  Không tìm thấy dịch vụ hoặc bác sĩ
                </Text>
                <Text style={styles.emptyResultsSub}>
                  Hãy thử tìm kiếm từ khóa dịch vụ hoặc tên bác sĩ khác.
                </Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                {searchResults.doctorMatches.length > 0 ? (
                  <View style={styles.resultGroup}>
                    <Text style={styles.groupHeader}>
                      🩺 Bác sĩ phù hợp ({searchResults.doctorMatches.length})
                    </Text>
                    {searchResults.doctorMatches.map(doctor => (
                      <ResultRow
                        icon="user-doctor"
                        key={`doctor-${doctor.id}`}
                        label={`BS. ${doctor.name}`}
                        meta={doctor.specialization}
                        onPress={() =>
                          onSuggestionPress({
                            id: doctor.id,
                            label: doctor.name,
                            type: 'doctor',
                          })
                        }
                        type="doctor"
                      />
                    ))}
                  </View>
                ) : null}

                {searchResults.serviceMatches.length > 0 ? (
                  <View style={styles.resultGroup}>
                    <Text style={styles.groupHeader}>
                      🦷 Dịch vụ nha khoa ({searchResults.serviceMatches.length})
                    </Text>
                    {searchResults.serviceMatches.map(service => (
                      <ResultRow
                        icon="tooth"
                        key={`service-${service.id}`}
                        label={service.name}
                        meta={service.price}
                        onPress={() =>
                          onSuggestionPress({
                            id: service.id,
                            label: service.name,
                            type: 'service',
                          })
                        }
                        type="service"
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            )}
          </View>
        ) : null}

        {/* Suggestions Row */}
        {suggestions.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.suggestionsContainer}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <Text style={styles.suggestionsTitle}>GỢI Ý:</Text>
            {suggestions.map(item => (
              <TouchableOpacity
                activeOpacity={0.8}
                key={`${item.type}-${item.id}`}
                onPress={() => onSuggestionPress(item)}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {/* Quick Action Links matching Web exactly */}
        <View style={styles.quickLinksWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onConsultationPress}
            style={styles.quickLinkRow}
          >
            <View style={styles.quickLinkLeft}>
              <View style={[styles.quickLinkIconBox, styles.quickLinkBlue]}>
                <FontAwesome6
                  color="#0058bc"
                  iconStyle="solid"
                  name="user"
                  size={14}
                />
              </View>
              <Text style={styles.quickLinkLabel}>
                Liên hệ bác sĩ tư vấn
              </Text>
            </View>
            <FontAwesome6
              color="#94A3B8"
              iconStyle="solid"
              name="chevron-right"
              size={12}
            />
          </TouchableOpacity>

          <View style={styles.quickLinkDivider} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onQuickAppointmentPress}
            style={styles.quickLinkRow}
          >
            <View style={styles.quickLinkLeft}>
              <View style={[styles.quickLinkIconBox, styles.quickLinkCyan]}>
                <FontAwesome6
                  color="#0284C7"
                  iconStyle="solid"
                  name="calendar-days"
                  size={14}
                />
              </View>
              <Text style={styles.quickLinkLabel}>Đặt lịch khám nhanh</Text>
            </View>
            <FontAwesome6
              color="#94A3B8"
              iconStyle="solid"
              name="chevron-right"
              size={12}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export type { Suggestion };

const styles = StyleSheet.create({
  bannerDots: {
    bottom: 8,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bannerImage: {
    height: 142,
    resizeMode: 'cover',
    width: '100%',
  },
  bannerWrapper: {
    backgroundColor: '#0058bc',
    height: 142,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  clearBtn: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 4,
    width: 24,
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    width: '100%',
  },
  docIconBox: {
    backgroundColor: '#EFF6FF',
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 3,
    height: 4,
    width: 12,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 10,
    left: 8,
    maxHeight: 280,
    overflow: 'hidden',
    position: 'absolute',
    right: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    top: 56,
    zIndex: 50,
  },
  emptyResults: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  emptyResultsSub: {
    color: '#64748B',
    fontSize: 11,
  },
  emptyResultsTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  groupHeader: {
    color: '#0058bc',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickLinkBlue: {
    backgroundColor: '#EFF6FF',
  },
  quickLinkCyan: {
    backgroundColor: '#E0F2FE',
  },
  quickLinkDivider: {
    backgroundColor: '#F1F5F9',
    height: 1,
    marginHorizontal: 14,
  },
  quickLinkIconBox: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  quickLinkLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  quickLinkLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  quickLinkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickLinksWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  resultBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resultBadgeText: {
    color: '#0058bc',
    fontSize: 10,
    fontWeight: '800',
  },
  resultGroup: {
    marginBottom: 8,
  },
  resultIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  resultLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  resultMeta: {
    color: '#64748B',
    fontSize: 11,
  },
  resultRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resultTextWrapper: {
    flex: 1,
  },
  resultsList: {
    padding: 8,
  },
  searchBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 12,
    elevation: 2,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 6,
    marginHorizontal: 16,
    marginTop: -20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    zIndex: 20,
  },
  suggestionChip: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  suggestionText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionsContainer: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionsTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginRight: 2,
  },
  svcIconBox: {
    backgroundColor: '#ECFEFF',
  },
  textInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
  },
});
