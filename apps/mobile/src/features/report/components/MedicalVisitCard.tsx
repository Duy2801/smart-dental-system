import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatShortDate } from '../api';
import type { MedicalRecord } from '../types';
import { HubCard } from './RecordSectionTabs';

type Props = { record: MedicalRecord };
type Section = 'clinical' | 'prescriptions' | 'images' | 'record';

function recordImages(value: unknown) {
  let images = value;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { return []; }
  }
  if (!Array.isArray(images)) return [];
  return images.flatMap((image, index) => {
    if (typeof image === 'string') return [{ id: String(index), url: image, title: `Ảnh y khoa ${index + 1}` }];
    if (!image || typeof image !== 'object') return [];
    const item = image as Record<string, unknown>;
    const url = item.url ?? item.imageUrl ?? item.src;
    if (typeof url !== 'string' || !url.trim()) return [];
    return [{
      id: typeof item.id === 'string' ? item.id : String(index),
      url,
      title: typeof item.title === 'string' && item.title ? item.title : `Ảnh y khoa ${index + 1}`,
    }];
  });
}

/**
 * Hồ sơ một lần khám (không thuộc phác đồ) — cùng bố cục với web (RecordMedicalVisitCard)
 * và với màn phác đồ trên mobile: thẻ tóm tắt + lưới 4 mục bấm để mở rộng.
 */
export function MedicalVisitCard({ record }: Props) {
  const [section, setSection] = useState<Section | 'all' | null>(null);
  const prescriptions = record.prescriptions ?? [];
  const images = recordImages(record.images);
  const hasClinicalDetails = Boolean(
    record.chiefComplaint || record.diagnosis || record.treatmentNotes || record.followUpDate,
  );

  const isOpen = (id: Section) => section === id || section === 'all';
  const toggle = (id: Section) => setSection(current => (current === id ? null : id));

  return (
    <View style={styles.wrapper}>
      {/* 1. Tóm tắt lần khám */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text numberOfLines={1} style={styles.eyebrow}>
                Bệnh án từ bác sĩ · {formatShortDate(record.createdAt)}
              </Text>
            </View>
            <Text numberOfLines={2} style={styles.title}>{record.service || 'Lần khám nha khoa'}</Text>
            <Text numberOfLines={1} style={styles.doctor}>
              Bác sĩ điều trị: <Text style={styles.doctorName}>{record.doctor || 'Đang cập nhật'}</Text>
            </Text>
          </View>
          <Text style={styles.visitBadge}>Lần khám</Text>
        </View>

        <Text style={styles.summaryHeading}>Tóm tắt chẩn đoán & lần khám</Text>
        <SummaryBox
          icon="file-medical"
          label="Chẩn đoán"
          tone="blue"
          title={record.diagnosis || 'Chưa cập nhật'}
          footer={record.chiefComplaint ? `Triệu chứng: ${record.chiefComplaint}` : 'Chưa ghi nhận triệu chứng bất thường'}
        />
        <SummaryBox
          icon="square-check"
          label="Điều trị & dặn dò"
          tone="green"
          body={record.treatmentNotes || 'Đã hoàn thành thủ thuật điều trị theo chỉ định.'}
          footer="Đã thực hiện khám chuyên khoa"
        />
        <SummaryBox
          icon="calendar-days"
          label="Theo dõi tiếp theo"
          tone="indigo"
          title={record.followUpDate ? `Tái khám: ${formatShortDate(record.followUpDate)}` : 'Chưa hẹn tái khám'}
          footer={`${prescriptions.length} đơn thuốc · ${images.length} hình ảnh`}
        />
      </View>

      {/* 2. Lưới 4 mục chi tiết */}
      <View style={styles.card}>
        <View style={styles.hubHeaderRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.hubTitle}>Xem chi tiết hồ sơ khám</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSection(current => (current === 'all' ? null : 'all'))}
            style={styles.expandBtn}
          >
            <Text style={styles.expandBtnText}>{section === 'all' ? 'Thu gọn' : 'Hiện tất cả'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <HubCard
              active={isOpen('clinical')}
              badge={hasClinicalDetails ? 'Có dữ liệu' : 'Chưa có'}
              icon="file-medical"
              onPress={() => toggle('clinical')}
              subtitle="Triệu chứng, kết luận và điều trị"
              title="Khám & chẩn đoán"
              tone="blue"
            />
            <HubCard
              active={isOpen('prescriptions')}
              badge={`${prescriptions.length} đơn`}
              icon="capsules"
              onPress={() => toggle('prescriptions')}
              subtitle="Thuốc, liều dùng và dặn dò"
              title="Đơn thuốc bác sĩ"
              tone="blue"
            />
          </View>
          <View style={styles.gridRow}>
            <HubCard
              active={isOpen('images')}
              badge={`${images.length} ảnh`}
              icon="image"
              onPress={() => toggle('images')}
              subtitle="Hình ảnh thực tế từ bệnh án"
              title="Phim X-quang & ảnh"
              tone="blue"
            />
            <HubCard
              active={isOpen('record')}
              badge="1 lần khám"
              icon="file-lines"
              onPress={() => toggle('record')}
              subtitle="Thông tin bác sĩ và lần khám"
              title="Hồ sơ bệnh án"
              tone="blue"
            />
          </View>
        </View>
      </View>

      {/* 3. Nội dung các mục đang mở */}
      {isOpen('clinical') ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Khám & chẩn đoán</Text>
          <Detail label="Lý do khám / Triệu chứng" value={record.chiefComplaint} />
          <Detail label="Chẩn đoán" value={record.diagnosis} />
          <Detail label="Điều trị & dặn dò" value={record.treatmentNotes} />
          <Detail label="Ngày tái khám" value={record.followUpDate ? formatShortDate(record.followUpDate) : null} />
        </View>
      ) : null}

      {isOpen('prescriptions') ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Đơn thuốc bác sĩ ({prescriptions.length})</Text>
          {prescriptions.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có đơn thuốc cho lần khám này.</Text>
          ) : prescriptions.map(prescription => (
            <View key={prescription.id} style={styles.detailBox}>
              {prescription.items.map((item, index) => (
                <View key={`${prescription.id}-${index}`} style={styles.medicineRow}>
                  <Text style={styles.medicineName}>{item.medicineName}</Text>
                  <Text style={styles.detailValue}>
                    {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ')}
                  </Text>
                  {item.instruction ? <Text style={styles.detailValue}>{item.instruction}</Text> : null}
                </View>
              ))}
              {prescription.notes ? <Text style={styles.detailValue}>Dặn dò: {prescription.notes}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {isOpen('images') ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phim X-quang & ảnh lâm sàng ({images.length})</Text>
          {images.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có hình ảnh cho lần khám này.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map(item => (
                <View key={item.id} style={styles.imageCard}>
                  <Image resizeMode="cover" source={{ uri: item.url }} style={styles.image} />
                  <Text numberOfLines={1} style={styles.imageTitle}>{item.title}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {isOpen('record') ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hồ sơ bệnh án</Text>
          <Detail label="Dịch vụ" value={record.service} />
          <Detail label="Bác sĩ điều trị" value={record.doctor} />
          <Detail label="Ngày khám" value={formatShortDate(record.createdAt)} />
        </View>
      ) : null}
    </View>
  );
}

const TONES = {
  blue: { bg: '#DBEAFE', fg: '#0863c5' },
  green: { bg: '#D1FAE5', fg: '#047857' },
  indigo: { bg: '#E0E7FF', fg: '#4338CA' },
} as const;

function SummaryBox({
  icon, label, tone, title, body, footer,
}: {
  icon: string;
  label: string;
  tone: keyof typeof TONES;
  title?: string;
  body?: string;
  footer: string;
}) {
  const c = TONES[tone];
  return (
    <View style={styles.summaryBox}>
      <View style={styles.summaryLabelRow}>
        <View style={[styles.summaryIcon, { backgroundColor: c.bg }]}>
          <FontAwesome6 color={c.fg} iconStyle="solid" name={icon as never} size={11} />
        </View>
        <Text style={[styles.summaryLabel, { color: c.fg }]}>{label}</Text>
      </View>
      {title ? <Text numberOfLines={2} style={styles.summaryTitle}>{title}</Text> : null}
      {body ? <Text numberOfLines={3} style={styles.summaryBody}>{body}</Text> : null}
      <Text numberOfLines={2} style={styles.summaryFooter}>{footer}</Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.detailBox}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Chưa cập nhật'}</Text>
    </View>
  );
}

const BRAND = '#0863c5';

const styles = StyleSheet.create({
  wrapper: { gap: 14, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 22,
    borderWidth: 1,
    elevation: 2,
    gap: 10,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  headerRow: { alignItems: 'flex-start', borderBottomColor: '#F1F5F9', borderBottomWidth: 1, flexDirection: 'row', gap: 10, paddingBottom: 12 },
  headerTextCol: { flex: 1, minWidth: 0 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  eyebrowDot: { backgroundColor: '#1996E0', borderRadius: 4, height: 7, width: 7 },
  eyebrow: { color: '#1996E0', flexShrink: 1, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  title: { color: '#0F172A', fontSize: 18, fontWeight: '900', marginTop: 4 },
  doctor: { color: '#64748B', fontSize: 12.5, marginTop: 4 },
  doctorName: { color: '#1E293B', fontWeight: '700' },
  visitBadge: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderRadius: 10, borderWidth: 1, color: BRAND, fontSize: 11, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4 },
  summaryHeading: { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  summaryBox: { backgroundColor: '#F8FBFE', borderColor: '#DBEAFE', borderRadius: 16, borderWidth: 1, padding: 12 },
  summaryLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  summaryIcon: { alignItems: 'center', borderRadius: 8, height: 24, justifyContent: 'center', width: 24 },
  summaryLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  summaryTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800', marginTop: 8 },
  summaryBody: { color: '#334155', fontSize: 12.5, lineHeight: 18, marginTop: 8 },
  summaryFooter: { borderTopColor: '#DBEAFE', borderTopWidth: 1, color: '#475569', fontSize: 12, marginTop: 10, paddingTop: 8 },
  hubHeaderRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  hubTitle: { color: '#0F172A', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  expandBtn: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  expandBtnText: { color: BRAND, fontSize: 11.5, fontWeight: '800' },
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  sectionTitle: { color: '#0F172A', fontSize: 14, fontWeight: '900' },
  detailBox: { backgroundColor: '#F8FAFC', borderRadius: 12, gap: 4, padding: 12 },
  detailLabel: { color: BRAND, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  detailValue: { color: '#334155', fontSize: 13, lineHeight: 19 },
  medicineRow: { gap: 2, marginBottom: 6 },
  medicineName: { color: '#0F172A', fontSize: 13.5, fontWeight: '800' },
  emptyText: { color: '#64748B', fontSize: 13 },
  imageCard: { borderColor: '#E2E8F0', borderRadius: 12, borderWidth: 1, marginRight: 10, overflow: 'hidden', width: 220 },
  image: { height: 140, width: 220 },
  imageTitle: { color: '#334155', fontSize: 12.5, fontWeight: '600', padding: 10 },
});
