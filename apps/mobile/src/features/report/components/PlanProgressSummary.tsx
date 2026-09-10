import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { TreatmentRecordView } from '../types';

type PlanProgressSummaryProps = {
  treatment: TreatmentRecordView;
};

export function PlanProgressSummary({ treatment }: PlanProgressSummaryProps) {
  const percent = Math.round(
    (treatment.completedStepsCount / (treatment.totalStepsCount || 1)) * 100,
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.dot} />
          <Text style={styles.title}>Tóm Tắt Chẩn Đoán & Tiến Trình</Text>
        </View>

        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>
            {treatment.category}
          </Text>
        </View>
      </View>

      {/* Grid boxes */}
      <View style={styles.box}>
        <Text style={styles.boxLabel}>Chẩn Đoán Y Khoa Chính</Text>
        <Text style={styles.boxValue}>{treatment.title}</Text>
        <Text style={styles.boxSub}>{treatment.description}</Text>
      </View>

      <View style={styles.boxRow}>
        <View style={[styles.box, styles.halfBox]}>
          <Text style={styles.boxLabel}>Vùng Răng Điều Trị</Text>
          <Text style={styles.toothValue}>🦷 {treatment.tooth}</Text>
        </View>

        <View style={[styles.box, styles.halfBox]}>
          <Text style={styles.boxLabel}>Tiến Độ Thực Hiện</Text>
          <Text style={styles.progressValue}>
            {treatment.completedStepsCount}/{treatment.totalStepsCount} bước ({percent}%)
          </Text>
          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  boxLabel: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  boxRow: {
    flexDirection: 'row',
    gap: 10,
  },
  boxSub: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  boxValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  categoryPill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryPillText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
  },
  dot: {
    backgroundColor: '#0863c5',
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  halfBox: {
    flex: 1,
  },
  headerRow: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  progressBarFill: {
    backgroundColor: '#0863c5',
    borderRadius: 4,
    height: '100%',
  },
  progressBarTrack: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    height: 6,
    marginTop: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  title: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleGroup: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  toothValue: {
    color: '#0863c5',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
});
