import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { TreatmentRecordView } from '../types';

type PlanSelectorListProps = {
  treatments: TreatmentRecordView[];
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
};

const ALL_FILTER = 'Tất cả';

export function PlanSelectorList({
  treatments,
  selectedPlanId,
  onSelectPlan,
}: PlanSelectorListProps) {
  const [filter, setFilter] = useState(ALL_FILTER);

  const filterOptions = useMemo(
    () => [ALL_FILTER, ...Array.from(new Set(treatments.map(t => t.category)))],
    [treatments],
  );

  const filteredTreatments = useMemo(
    () =>
      filter === ALL_FILTER
        ? treatments
        : treatments.filter(t => t.category === filter),
    [filter, treatments],
  );

  return (
    <View style={styles.container}>
      {/* Header & Filter Pills */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          Danh Sách Phác Đồ ({filteredTreatments.length})
        </Text>
        <View style={styles.badgeHint}>
          <Text style={styles.badgeHintText}>Chọn phác đồ</Text>
        </View>
      </View>

      {filterOptions.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterOptions.map(option => {
            const isActive = filter === option;
            return (
              <TouchableOpacity
                key={option}
                activeOpacity={0.8}
                onPress={() => setFilter(option)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillDefault,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextDefault,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Plan Cards */}
      <View style={styles.plansList}>
        {filteredTreatments.map((treatment, index) => {
          const isSelected = treatment.id === selectedPlanId;

          return (
            <TouchableOpacity
              key={treatment.id}
              activeOpacity={0.8}
              onPress={() => onSelectPlan(treatment.id)}
              style={[
                styles.planCard,
                isSelected ? styles.planCardSelected : styles.planCardDefault,
              ]}
            >
              {isSelected ? <View style={styles.activeBar} /> : null}

              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.orderTag,
                    isSelected ? styles.orderTagSelected : styles.orderTagDefault,
                  ]}
                >
                  <Text
                    style={[
                      styles.orderTagText,
                      isSelected ? styles.orderTagTextSelected : styles.orderTagTextDefault,
                    ]}
                  >
                    Phác đồ #{index + 1}
                  </Text>
                </View>

                <Text style={styles.dateText}>{treatment.date}</Text>
              </View>

              <Text
                numberOfLines={2}
                style={[
                  styles.planTitle,
                  isSelected ? styles.planTitleSelected : styles.planTitleDefault,
                ]}
              >
                {treatment.title}
              </Text>

              <Text style={styles.doctorText}>👨‍⚕️ {treatment.doctor}</Text>

              {/* Progress Footer */}
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                  Tiến trình:{' '}
                  <Text style={styles.progressBold}>
                    {treatment.completedStepsCount}/{treatment.totalStepsCount} bước
                  </Text>
                </Text>

                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {treatment.category}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeBar: {
    backgroundColor: '#0863c5',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 5,
  },
  badgeHint: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeHintText: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '800',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '700',
  },
  container: {
    marginBottom: 16,
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  doctorText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  filterPill: {
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillActive: {
    backgroundColor: '#0863c5',
    borderColor: '#0863c5',
  },
  filterPillDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterPillTextDefault: {
    color: '#475569',
  },
  filterScroll: {
    paddingBottom: 4,
    paddingTop: 8,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  orderTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  orderTagDefault: {
    backgroundColor: '#F1F5F9',
  },
  orderTagSelected: {
    backgroundColor: '#0863c5',
  },
  orderTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  orderTagTextDefault: {
    color: '#475569',
  },
  orderTagTextSelected: {
    color: '#FFFFFF',
  },
  planCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 10,
    overflow: 'hidden',
    padding: 14,
  },
  planCardDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  planCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0863c5',
    elevation: 2,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 8,
  },
  planTitleDefault: {
    color: '#0F172A',
  },
  planTitleSelected: {
    color: '#0863c5',
  },
  plansList: {
    marginTop: 10,
  },
  progressBold: {
    color: '#0F172A',
    fontWeight: '800',
  },
  progressRow: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
  },
  progressText: {
    color: '#64748B',
    fontSize: 11,
  },
});
