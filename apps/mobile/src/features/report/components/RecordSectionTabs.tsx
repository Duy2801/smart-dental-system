import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatMoney } from '../api';
import type { TimelineStepView, TreatmentRecordView } from '../types';

type RecordSectionTabsProps = {
  treatment: TreatmentRecordView;
  onOpenInvoiceModal: (step: TimelineStepView) => void;
};

type ExpandedSection = 'none' | 'workflow' | 'prescription' | 'images' | 'medical-record' | 'all';

export function RecordSectionTabs({
  treatment,
  onOpenInvoiceModal,
}: RecordSectionTabsProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('none');

  const steps = treatment.treatmentPlan || [];
  const richPrescriptions = treatment.richPrescriptions || [];
  const clinicalImages = steps.flatMap(s => [
    s.images?.xray ? { type: 'X-Quang', url: s.images.xray, stepTitle: s.title, date: s.date } : null,
    s.images?.clinical ? { type: 'Lâm sàng', url: s.images.clinical, stepTitle: s.title, date: s.date } : null,
  ]).filter(Boolean) as Array<{ type: string; url: string; stepTitle: string; date: string }>;

  const prescriptionCount = richPrescriptions[0]?.items?.length || 3;
  const imageCount = clinicalImages.length || 1;

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(prev => (prev === section ? 'none' : section));
  };

  const isWorkflowActive = expandedSection === 'workflow' || expandedSection === 'all';
  const isPrescriptionActive = expandedSection === 'prescription' || expandedSection === 'all';
  const isImagesActive = expandedSection === 'images' || expandedSection === 'all';
  const isMedicalRecordActive = expandedSection === 'medical-record' || expandedSection === 'all';

  return (
    <View style={styles.container}>
      {/* 1. THANH NÚT BẤM TINH GỌN (TOGGLE BUTTONS HUB - MODERN UI MATCHING WEB SCREENSHOT 2) */}
      <View style={styles.hubContainer}>
        {/* Hub Header */}
        <View style={styles.hubHeader}>
          <View style={styles.hubTitleGroup}>
            <View style={styles.hubTitleRow}>
              <Text style={styles.hubSearchEmoji}>🔍</Text>
              <Text style={styles.hubTitle}>
                Xem Chi Tiết Hồ Sơ Khám & Phác Đồ
              </Text>
            </View>
            <Text style={styles.hubSubtitle}>
              Nhấp vào các nút bên dưới để mở rộng xem từng mục chi tiết theo nhu cầu:
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setExpandedSection(prev => (prev === 'all' ? 'none' : 'all'))}
            style={[
              styles.expandAllBtn,
              expandedSection === 'all' ? styles.expandAllBtnActive : styles.expandAllBtnDefault,
            ]}
          >
            <Text
              style={[
                styles.expandAllBtnText,
                expandedSection === 'all' ? styles.expandAllBtnTextActive : styles.expandAllBtnTextDefault,
              ]}
            >
              {expandedSection === 'all' ? '▲ Thu gọn tất cả' : '⚡ Hiện tất cả mục'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons List - Full width stacked cards (matching Screenshot 2) */}
        <View style={styles.buttonsList}>
          {/* Card 1: Quy Trình & Phác Đồ */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleSection('workflow')}
            style={[
              styles.actionCard,
              isWorkflowActive ? styles.actionCardActive : styles.actionCardDefault,
            ]}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#0863c5' }]}>
                <Text style={styles.actionIconEmoji}>📋</Text>
              </View>
              <View
                style={[
                  styles.badgeTag,
                  isWorkflowActive ? styles.badgeTagActiveBlue : styles.badgeTagDefault,
                ]}
              >
                <Text
                  style={[
                    styles.badgeTagText,
                    isWorkflowActive ? styles.badgeTagTextActive : styles.badgeTagTextDefault,
                  ]}
                >
                  {steps.length} BƯỚC
                </Text>
              </View>
            </View>

            <View style={styles.actionCardBottom}>
              <Text style={styles.actionTitle}>Quy Trình & Phác Đồ</Text>
              <Text style={styles.actionSub}>Các giai đoạn điều trị & lịch tái khám</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Đơn Thuốc Bác Sĩ */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleSection('prescription')}
            style={[
              styles.actionCard,
              isPrescriptionActive ? styles.actionCardActive : styles.actionCardDefault,
            ]}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#059669' }]}>
                <Text style={styles.actionIconEmoji}>💊</Text>
              </View>
              <View
                style={[
                  styles.badgeTag,
                  isPrescriptionActive ? styles.badgeTagActiveEmerald : styles.badgeTagDefault,
                ]}
              >
                <Text
                  style={[
                    styles.badgeTagText,
                    isPrescriptionActive ? styles.badgeTagTextActive : styles.badgeTagTextDefault,
                  ]}
                >
                  {prescriptionCount} LOẠI
                </Text>
              </View>
            </View>

            <View style={styles.actionCardBottom}>
              <Text style={styles.actionTitle}>Đơn Thuốc Bác Sĩ</Text>
              <Text style={styles.actionSub}>Danh mục thuốc & bản scan đơn thuốc</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Phim X-Quang & Ảnh */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleSection('images')}
            style={[
              styles.actionCard,
              isImagesActive ? styles.actionCardActive : styles.actionCardDefault,
            ]}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#4F46E5' }]}>
                <Text style={styles.actionIconEmoji}>🩻</Text>
              </View>
              <View
                style={[
                  styles.badgeTag,
                  isImagesActive ? styles.badgeTagActiveIndigo : styles.badgeTagDefault,
                ]}
              >
                <Text
                  style={[
                    styles.badgeTagText,
                    isImagesActive ? styles.badgeTagTextActive : styles.badgeTagTextDefault,
                  ]}
                >
                  {imageCount} HÌNH ẢNH
                </Text>
              </View>
            </View>

            <View style={styles.actionCardBottom}>
              <Text style={styles.actionTitle}>Phim X-Quang & Ảnh</Text>
              <Text style={styles.actionSub}>Xem ảnh thực tế & phim chụp chẩn đoán</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Hồ Sơ Bệnh Án */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleSection('medical-record')}
            style={[
              styles.actionCard,
              isMedicalRecordActive ? styles.actionCardActive : styles.actionCardDefault,
            ]}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#0863c5' }]}>
                <Text style={styles.actionIconEmoji}>📄</Text>
              </View>
              <View
                style={[
                  styles.badgeTag,
                  isMedicalRecordActive ? styles.badgeTagActiveBlue : styles.badgeTagDefaultBlue,
                ]}
              >
                <Text
                  style={[
                    styles.badgeTagText,
                    isMedicalRecordActive ? styles.badgeTagTextActive : styles.badgeTagTextBlue,
                  ]}
                >
                  1 BỆNH ÁN
                </Text>
              </View>
            </View>

            <View style={styles.actionCardBottom}>
              <Text style={styles.actionTitle}>Hồ Sơ Bệnh Án</Text>
              <Text style={styles.actionSub}>Xem chi tiết chẩn đoán & đơn thuốc y khoa</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* 2. EXPANDED SECTIONS CONTAINER */}
      {/* ========================================================================= */}
      <View style={styles.expandedContainer}>
        {/* SECTION 1: WORKFLOW (QUY TRÌNH & PHÁC ĐỒ) */}
        {isWorkflowActive && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionMiniIconBox, { backgroundColor: '#0863c5' }]}>
                  <Text style={styles.miniIconEmoji}>📋</Text>
                </View>
                <View style={styles.sectionTitleContent}>
                  <Text style={styles.sectionTitle}>
                    Quy Trình Khám Bệnh & Tiến Trình Phác Đồ Chi Tiết
                  </Text>
                  <Text style={styles.sectionSub}>
                    Theo dõi từng bước thủ thuật y khoa và lịch hẹn tái khám của bác sĩ.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('workflow')}
                style={styles.collapseSectionBtn}
              >
                <Text style={styles.collapseSectionText}>▲ Thu gọn</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepsList}>
              {steps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                const isSummary = step.status === 'summary';

                return (
                  <View
                    key={step.id || idx}
                    style={[
                      styles.stepItemCard,
                      isCurrent ? styles.stepItemCardCurrent : null,
                    ]}
                  >
                    <View style={styles.stepItemHeader}>
                      <View style={styles.stepOrderBadge}>
                        <Text style={styles.stepOrderText}>
                          {isSummary ? 'Tổng kết' : `Bước #${step.order}`}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusPill,
                          isCompleted
                            ? styles.statusCompleted
                            : isCurrent
                            ? styles.statusCurrent
                            : styles.statusUpcoming,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            isCompleted
                              ? styles.statusTextCompleted
                              : isCurrent
                              ? styles.statusTextCurrent
                              : styles.statusTextUpcoming,
                          ]}
                        >
                          {isCompleted
                            ? '● Hoàn tất'
                            : isCurrent
                            ? '● Đang thực hiện'
                            : isSummary
                            ? '● Tổng quan phác đồ'
                            : '○ Sắp tới'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.stepItemTitle}>{step.title}</Text>
                    <Text style={styles.stepItemDesc}>{step.description}</Text>

                    <View style={styles.stepMetaRow}>
                      <Text style={styles.stepMetaText}>📅 {step.date}</Text>
                      {step.targetTooth ? (
                        <Text style={styles.stepMetaText}>🦷 Răng: {step.targetTooth}</Text>
                      ) : null}
                    </View>

                    {/* Step Cost & Invoice Button */}
                    {!isSummary ? (
                      <View style={styles.stepFooterRow}>
                        <View>
                          <Text style={styles.stepCostLabel}>Chi phí dự kiến</Text>
                          <Text style={styles.stepCostValue}>
                            {formatMoney(step.estimatedCost)}
                          </Text>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => onOpenInvoiceModal(step)}
                          style={styles.invoiceBtn}
                        >
                          <FontAwesome6 color="#0863c5" iconStyle="solid" name="receipt" size={12} />
                          <Text style={styles.invoiceBtnText}>Hóa đơn bước</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SECTION 2: PRESCRIPTIONS (ĐƠN THUỐC BÁC SĨ) */}
        {isPrescriptionActive && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionMiniIconBox, { backgroundColor: '#059669' }]}>
                  <Text style={styles.miniIconEmoji}>💊</Text>
                </View>
                <View style={styles.sectionTitleContent}>
                  <Text style={styles.sectionTitle}>
                    Đơn Thuốc Bác Sĩ Kê Đơn
                  </Text>
                  <Text style={styles.sectionSub}>
                    Danh mục thuốc chính thức từ hệ thống nha khoa.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('prescription')}
                style={styles.collapseSectionBtn}
              >
                <Text style={styles.collapseSectionText}>▲ Thu gọn</Text>
              </TouchableOpacity>
            </View>

            {richPrescriptions.length > 0 ? (
              richPrescriptions.map((p, idx) => (
                <View key={p.id || idx} style={styles.prescCard}>
                  <View style={styles.prescHeader}>
                    <View>
                      <Text style={styles.prescCode}>Mã đơn: {p.code}</Text>
                      <Text style={styles.prescDoctor}>👨‍⚕️ {p.doctor}</Text>
                    </View>
                    <Text style={styles.prescDate}>{p.date}</Text>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.prescListTitle}>Danh mục thuốc chỉ định:</Text>
                  {p.items.map((item, i) => (
                    <View key={i} style={styles.medicineRow}>
                      <View style={styles.medicineDot} />
                      <View style={styles.medicineInfo}>
                        <Text style={styles.medicineName}>
                          {item.medicineName} ({item.dosage})
                        </Text>
                        <Text style={styles.medicineFreq}>
                          {item.frequency} • {item.duration}
                        </Text>
                        <Text style={styles.medicineInst}>
                          💡 {item.instruction}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {p.notes ? (
                    <View style={styles.prescNotesBox}>
                      <Text style={styles.prescNotesText}>
                        📝 Lời dặn: {p.notes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Chưa có đơn thuốc cho phác đồ này.</Text>
              </View>
            )}
          </View>
        )}

        {/* SECTION 3: CLINICAL IMAGES (PHIM X-QUANG & ẢNH) */}
        {isImagesActive && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionMiniIconBox, { backgroundColor: '#4F46E5' }]}>
                  <Text style={styles.miniIconEmoji}>🩻</Text>
                </View>
                <View style={styles.sectionTitleContent}>
                  <Text style={styles.sectionTitle}>
                    Phim X-Quang & Hình Ảnh Lâm Sàng
                  </Text>
                  <Text style={styles.sectionSub}>
                    Xem ảnh thực tế & phim chụp chẩn đoán y khoa.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('images')}
                style={styles.collapseSectionBtn}
              >
                <Text style={styles.collapseSectionText}>▲ Thu gọn</Text>
              </TouchableOpacity>
            </View>

            {clinicalImages.length > 0 ? (
              <View style={styles.imagesGrid}>
                {clinicalImages.map((img, idx) => (
                  <View key={idx} style={styles.imageCard}>
                    <Image
                      source={{ uri: img.url }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.imageCardFooter}>
                      <View style={styles.imageTypeBadge}>
                        <Text style={styles.imageTypeBadgeText}>{img.type}</Text>
                      </View>
                      <Text numberOfLines={1} style={styles.imageTitle}>
                        {img.stepTitle}
                      </Text>
                      <Text style={styles.imageDate}>{img.date}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.imageSampleCard}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
                  }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <View style={styles.imageCardFooter}>
                  <View style={styles.imageTypeBadge}>
                    <Text style={styles.imageTypeBadgeText}>X-QUANG TOÀN CẢNH</Text>
                  </View>
                  <Text style={styles.imageTitle}>Phim Chụp Khảo Sát Cung Răng</Text>
                  <Text style={styles.imageDate}>{treatment.date}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* SECTION 4: MEDICAL RECORD (HỒ SƠ BỆNH ÁN) */}
        {isMedicalRecordActive && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionMiniIconBox, { backgroundColor: '#0863c5' }]}>
                  <Text style={styles.miniIconEmoji}>📄</Text>
                </View>
                <View style={styles.sectionTitleContent}>
                  <Text style={styles.sectionTitle}>
                    Hồ Sơ Bệnh Án Y Khoa Điện Tử
                  </Text>
                  <Text style={styles.sectionSub}>
                    Thông tin chẩn đoán y khoa, thủ thuật chỉ định và đơn thuốc chính thức.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('medical-record')}
                style={styles.collapseSectionBtn}
              >
                <Text style={styles.collapseSectionText}>▲ Thu gọn</Text>
              </TouchableOpacity>
            </View>

            {/* Diagnostic Block */}
            <View style={styles.diagBlock}>
              <Text style={styles.diagBlockLabel}>🩺 CHẨN ĐOÁN Y KHOA CHÍNH</Text>
              <View style={styles.diagBox}>
                <Text style={styles.diagBoxTitle}>Lý do khám / Triệu chứng:</Text>
                <Text style={styles.diagBoxDesc}>{treatment.title}</Text>
              </View>
              <View style={styles.diagBox}>
                <Text style={styles.diagBoxTitle}>Kết luận chẩn đoán:</Text>
                <Text style={styles.diagBoxDesc}>{treatment.description}</Text>
              </View>
            </View>

            {/* Dental Area Block */}
            <View style={styles.diagBlock}>
              <Text style={styles.diagBlockLabel}>🦷 VÙNG RĂNG & GHI CHÚ</Text>
              <View style={styles.diagBox}>
                <Text style={styles.diagBoxTitle}>Vùng răng chỉ định:</Text>
                <Text style={styles.diagBoxDesc}>{treatment.tooth}</Text>
              </View>
              <View style={styles.diagBox}>
                <Text style={styles.diagBoxTitle}>Bác sĩ lập phác đồ:</Text>
                <Text style={styles.diagBoxDesc}>
                  {treatment.doctor} ({treatment.specialty})
                </Text>
              </View>
            </View>

            {/* Doctor Signature Tag */}
            <View style={styles.signedTag}>
              <Text style={styles.signedDoctor}>Bác sĩ: {treatment.doctor}</Text>
              <View style={styles.signedBadge}>
                <Text style={styles.signedBadgeText}>✓ Đã ký số y khoa</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    width: '100%',
  },
  actionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0863c5',
    elevation: 3,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  actionCardBottom: {
    marginTop: 8,
  },
  actionCardDefault: {
    borderColor: '#E2E8F0',
  },
  actionCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionIconBox: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  actionIconEmoji: {
    fontSize: 20,
  },
  actionSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  badgeTag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTagActiveBlue: {
    backgroundColor: '#0863c5',
  },
  badgeTagActiveEmerald: {
    backgroundColor: '#059669',
  },
  badgeTagActiveIndigo: {
    backgroundColor: '#4F46E5',
  },
  badgeTagDefault: {
    backgroundColor: '#F1F5F9',
  },
  badgeTagDefaultBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  badgeTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgeTagTextActive: {
    color: '#FFFFFF',
  },
  badgeTagTextBlue: {
    color: '#0863c5',
  },
  badgeTagTextDefault: {
    color: '#475569',
  },
  buttonsList: {
    gap: 10,
    marginTop: 14,
  },
  collapseSectionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  collapseSectionText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
  },
  container: {
    marginBottom: 20,
  },
  diagBlock: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  diagBlockLabel: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  diagBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    padding: 10,
  },
  diagBoxDesc: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  diagBoxTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  divider: {
    backgroundColor: '#F1F5F9',
    height: 1,
    marginVertical: 10,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 24,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  expandAllBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  expandAllBtnActive: {
    backgroundColor: '#0863c5',
    borderColor: '#0863c5',
  },
  expandAllBtnDefault: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  expandAllBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  expandAllBtnTextActive: {
    color: '#FFFFFF',
  },
  expandAllBtnTextDefault: {
    color: '#0863c5',
  },
  expandedContainer: {
    marginTop: 14,
  },
  hubContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    padding: 16,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  hubHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hubSearchEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  hubSubtitle: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  hubTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  hubTitleGroup: {
    flex: 1,
    marginRight: 10,
  },
  hubTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  imageCardFooter: {
    padding: 12,
  },
  imageDate: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  imagePreview: {
    aspectRatio: 16 / 9,
    backgroundColor: '#0F172A',
    width: '100%',
  },
  imageSampleCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  imageTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  imageTypeBadgeText: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '800',
  },
  imagesGrid: {
    marginTop: 4,
  },
  invoiceBtn: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  invoiceBtnText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
  },
  medicineDot: {
    backgroundColor: '#059669',
    borderRadius: 4,
    height: 7,
    marginTop: 5,
    width: 7,
  },
  medicineFreq: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  medicineInfo: {
    flex: 1,
    marginLeft: 8,
  },
  medicineInst: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  medicineName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  medicineRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 10,
  },
  miniIconEmoji: {
    fontSize: 14,
  },
  prescCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  prescCode: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '900',
  },
  prescDate: {
    color: '#94A3B8',
    fontSize: 11,
  },
  prescDoctor: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  prescHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prescListTitle: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  prescNotesBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    marginTop: 4,
    padding: 10,
  },
  prescNotesText: {
    color: '#166534',
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#0863c5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sectionHeader: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  sectionMiniIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  sectionSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  sectionTitleContent: {
    flex: 1,
    marginLeft: 10,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  signedBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  signedBadgeText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '800',
  },
  signedDoctor: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  signedTag: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  statusCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusCurrent: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPill: {
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextCompleted: {
    color: '#059669',
  },
  statusTextCurrent: {
    color: '#0863c5',
  },
  statusTextUpcoming: {
    color: '#64748B',
  },
  statusUpcoming: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stepCostLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  stepCostValue: {
    color: '#0863c5',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  stepFooterRow: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
  },
  stepItemCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  stepItemCardCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0863c5',
    borderWidth: 1.5,
  },
  stepItemDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  stepItemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItemTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  stepMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  stepMetaText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  stepOrderBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stepOrderText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stepsList: {
    marginTop: 12,
  },
});
