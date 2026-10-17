import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { formatMoney, formatShortDate } from '../api';
import type {
  MedicalRecord,
  PatientRecordsResponse,
  RichPrescription,
  TimelineStepView,
  TreatmentRecordView,
} from '../types';

type RecordSectionTabsProps = {
  treatment: TreatmentRecordView;
  recordsData: PatientRecordsResponse;
  onOpenInvoiceModal: (step: TimelineStepView) => void;
};

type ExpandedSection =
  | 'none'
  | 'workflow'
  | 'prescription'
  | 'images'
  | 'medical-record'
  | 'all';

export function RecordSectionTabs({
  treatment,
  recordsData,
  onOpenInvoiceModal,
}: RecordSectionTabsProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('none');
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    category: string;
    date: string;
    doctor: string;
    notes: string;
  } | null>(null);

  // 1. Toàn bộ hồ sơ bệnh án từ API (bao gồm cả records theo phác đồ và records trực tiếp của bệnh nhân)
  const currentPlanData = useMemo(() => {
    return recordsData?.treatmentPlans?.find((plan) => plan.id === treatment.id);
  }, [recordsData, treatment.id]);

  const allMedicalRecords = useMemo(() => {
    const list: MedicalRecord[] = [];
    const seen = new Set<string>();

    (recordsData?.medicalRecords ?? []).forEach((r) => {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        list.push(r);
      }
    });

    currentPlanData?.steps?.forEach((step) => {
      step.medicalRecords?.forEach((r) => {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          list.push({
            id: r.id,
            createdAt: step.completedAt || treatment.date,
            doctor: treatment.doctor,
            service: step.title || treatment.title,
            chiefComplaint: r.chiefComplaint,
            diagnosis: r.diagnosis,
            treatmentNotes: r.treatmentNotes,
            followUpDate: r.followUpDate,
            images: r.images,
            prescriptions: r.prescriptions,
          });
        }
      });
    });

    return list;
  }, [recordsData, currentPlanData, treatment]);

  // 2. Chẩn đoán & Ghi chú từ backend động theo hồ sơ
  const planDiagnosisNotes = useMemo(() => {
    const activeMedicalRecord = allMedicalRecords[0];
    const toothDisplay =
      treatment.tooth && treatment.tooth !== 'Theo chỉ định'
        ? treatment.tooth
        : 'Vùng răng chỉ định';

    if (!activeMedicalRecord) {
      return {
        chiefComplaint: 'Khám và kiểm tra răng định kỳ',
        diagnosis: treatment.description || 'Chưa có chẩn đoán cho phác đồ này',
        clinicalNotes: 'Chưa có ghi chú điều trị.',
        toothNumber: toothDisplay,
      };
    }

    return {
      chiefComplaint: activeMedicalRecord.chiefComplaint || 'Khám và kiểm tra răng định kỳ',
      diagnosis: activeMedicalRecord.diagnosis || treatment.description || 'Chẩn đoán nha khoa chuyên khoa',
      clinicalNotes: activeMedicalRecord.treatmentNotes || 'Điều trị hoàn tất theo phác đồ.',
      toothNumber: toothDisplay,
    };
  }, [allMedicalRecords, treatment]);

  // 3. Toàn bộ đơn thuốc trích xuất từ database (medical_records + phác đồ)
  const allRichPrescriptions = useMemo(() => {
    const list: RichPrescription[] = [...(treatment.richPrescriptions || [])];
    const existingIds = new Set(list.map((p) => p.id));

    allMedicalRecords.forEach((record, recIdx) => {
      (record.prescriptions ?? []).forEach((presc, prescIdx) => {
        if (!existingIds.has(presc.id)) {
          existingIds.add(presc.id);
          list.push({
            id: presc.id || `presc-${record.id}-${prescIdx}`,
            code: `DT-${String(recIdx + 1).padStart(3, '0')}`,
            doctor: record.doctor || treatment.doctor,
            date: record.createdAt ? formatShortDate(record.createdAt) : treatment.date,
            notes: presc.notes || record.treatmentNotes || 'Đơn thuốc theo chỉ định của bác sĩ',
            prescriptionImageUrl: null,
            items: (presc.items ?? []).map((item) => ({
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency || 'Theo chỉ định',
              duration: item.duration || '5 ngày',
              instruction: item.instruction || 'Uống sau ăn',
            })),
          });
        }
      });
    });

    return list;
  }, [treatment, allMedicalRecords]);

  // 4. Hình ảnh lâm sàng & X-quang trích xuất từ medical_records
  const realClinicalImages = useMemo(() => {
    const imagesList: Array<{
      id: string;
      url: string;
      title: string;
      category: string;
      date: string;
      doctor: string;
      notes: string;
    }> = [];

    allMedicalRecords.forEach((record, recordIdx) => {
      const rawImages = record.images;
      if (Array.isArray(rawImages) && rawImages.length > 0) {
        rawImages.forEach((img: any, imgIdx: number) => {
          const isXray =
            img?.type === 'XRAY' ||
            `${img?.title || ''} ${img?.type || ''}`.toLowerCase().includes('xray') ||
            `${img?.title || ''}`.toLowerCase().includes('xquang');

          const rawUrl = img?.url || img?.imageUrl || img?.src;
          if (typeof rawUrl !== 'string' || !rawUrl.trim()) return;

          imagesList.push({
            id: img?.id || `img-rec-${record.id || recordIdx}-${imgIdx}`,
            url: rawUrl.trim(),
            title:
              img?.title && img.title !== 'X-Ray' && img.title !== 'Clinical'
                ? img.title
                : isXray
                ? 'Phim X-Quang Panorama Chẩn Đoán'
                : 'Ảnh Lâm Sàng Vùng Điều Trị',
            category: isXray ? 'PHIM X-QUANG PANORAMA' : 'ẢNH THỰC TẾ LÂM SÀNG',
            date: record.createdAt ? formatShortDate(record.createdAt) : treatment.date,
            doctor: record.doctor || treatment.doctor,
            notes:
              img?.notes ||
              record.treatmentNotes ||
              record.chiefComplaint ||
              record.diagnosis ||
              'Dữ liệu hình ảnh được liên kết trực tiếp từ hồ sơ bệnh án điện tử.',
          });
        });
      }
    });

    return Array.from(new Map(imagesList.map((item) => [item.id, item])).values());
  }, [allMedicalRecords, treatment]);

  // 5. Phác đồ chi tiết & các bước
  const visibleSteps: TimelineStepView[] = useMemo(() => {
    const raw = (treatment.treatmentPlan ?? []).filter((s) => s.status !== 'summary');
    if (raw.length > 0) return raw;

    return [
      {
        id: 'step-plan-main',
        order: 1,
        date: treatment.date,
        title: treatment.title,
        description:
          treatment.description ||
          'Khám lâm sàng, chẩn đoán và điều trị theo phác đồ chỉ định.',
        status: 'completed' as const,
        targetTooth: treatment.tooth,
        estimatedCost: treatment.paidAmount || 0,
        paymentAmount: treatment.paidAmount || 0,
        paymentStatusLabel: treatment.paymentStatusLabel || 'Thanh toán đủ',
        prescriptions: treatment.prescriptions || [],
        richPrescriptions: allRichPrescriptions,
        careInstructions: [
          'Tuân thủ hướng dẫn và dặn dò của bác sĩ.',
        ],
        images: { xray: null, clinical: null },
        invoices: [],
      },
    ];
  }, [treatment, allRichPrescriptions]);

  const selectedStep = visibleSteps[selectedStepIndex] ?? visibleSteps[0];
  const actualStepsCount = visibleSteps.length;
  const planMedicalRecordCount = allMedicalRecords.length;
  const medicineCount = allRichPrescriptions.reduce(
    (count, p) => count + p.items.length,
    0,
  );

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection((prev) => (prev === section ? 'none' : section));
  };

  const isWorkflowActive =
    expandedSection === 'workflow' || expandedSection === 'all';
  const isPrescriptionActive =
    expandedSection === 'prescription' || expandedSection === 'all';
  const isImagesActive =
    expandedSection === 'images' || expandedSection === 'all';
  const isMedicalRecordActive =
    expandedSection === 'medical-record' || expandedSection === 'all';

  return (
    <View style={styles.container}>
      {/* ========================================================================= */}
      {/* 1. THANH NÚT BẤM TINH GỌN (TOGGLE BUTTONS HUB - 2x2 GRID MATCHING WEB)     */}
      {/* ========================================================================= */}
      <View style={styles.hubContainer}>
        {/* Hub Header */}
        <View style={styles.hubHeader}>
          <View style={styles.hubTitleGroup}>
            <Text style={styles.hubTitle}>
              Chi Tiết Phác Đồ: {treatment.title}
            </Text>
            <Text style={styles.hubSubtitle}>
              Ngày lập:{' '}
              <Text style={styles.hubSubtitleStrong}>{treatment.date}</Text>
              {' '}• Nhấp vào các nút bên dưới để mở rộng xem chi tiết
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              setExpandedSection((prev) => (prev === 'all' ? 'none' : 'all'))
            }
            style={[
              styles.expandAllBtn,
              expandedSection === 'all'
                ? styles.expandAllBtnActive
                : styles.expandAllBtnDefault,
            ]}
          >
            <Text
              style={[
                styles.expandAllBtnText,
                expandedSection === 'all'
                  ? styles.expandAllBtnTextActive
                  : styles.expandAllBtnTextDefault,
              ]}
            >
              {expandedSection === 'all' ? 'Thu gọn tất cả' : 'Hiện tất cả'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2x2 Action Buttons Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <HubCard
              active={isWorkflowActive}
              badge={`${actualStepsCount} bước`}
              icon="list-check"
              onPress={() => toggleSection('workflow')}
              subtitle="Các giai đoạn điều trị & lịch tái khám"
              title="Quy Trình & Phác Đồ"
              tone="blue"
            />
            <HubCard
              active={isPrescriptionActive}
              badge={`${allRichPrescriptions.length} đơn`}
              icon="capsules"
              onPress={() => toggleSection('prescription')}
              subtitle="Danh mục thuốc từ bệnh án"
              title="Đơn Thuốc Bác Sĩ"
              tone="emerald"
            />
          </View>

          <View style={styles.gridRow}>
            <HubCard
              active={isImagesActive}
              badge={`${realClinicalImages.length} ảnh`}
              icon="image"
              onPress={() => toggleSection('images')}
              subtitle="Xem ảnh thực tế & phim chụp chẩn đoán"
              title="Phim X-Quang & Ảnh"
              tone="indigo"
            />
            <HubCard
              active={isMedicalRecordActive}
              badge={`${planMedicalRecordCount} hồ sơ`}
              icon="file-lines"
              onPress={() => toggleSection('medical-record')}
              subtitle="Xem chi tiết chẩn đoán & đơn thuốc y khoa"
              title="Hồ Sơ Bệnh Án"
              tone="sky"
            />
          </View>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* 2. EXPANDED SECTIONS (MATCHING WEB LAYOUT 1:1)                           */}
      {/* ========================================================================= */}
      <View style={styles.expandedContainer}>
        {/* ======================================================================= */}
        {/* SECTION 1: WORKFLOW (QUY TRÌNH & PHÁC ĐỒ)                              */}
        {/* ======================================================================= */}
        {isWorkflowActive && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionMiniIconBox, styles.iconBlue]}>
                  <Text style={styles.miniIconEmoji}>📋</Text>
                </View>
                <View style={styles.sectionTitleContent}>
                  <Text style={styles.sectionTitle}>
                    Quy Trình Khám Bệnh & Tiến Trình Phác Đồ Chi Tiết
                  </Text>
                  <Text style={styles.sectionSub}>
                    Theo dõi từng bước thủ thuật y khoa và lịch hẹn tái khám.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('workflow')}
                style={styles.collapseSectionBtn}
              >
                <Text style={styles.collapseSectionText}>Thu gọn</Text>
              </TouchableOpacity>
            </View>

            {/* Stepper Header Pills */}
            <View style={styles.stepsPillsContainer}>
              <Text style={styles.stepsPillsLabel}>
                Danh sách các bước thực hiện ({actualStepsCount} bước):
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stepsScrollContent}
              >
                {visibleSteps.map((step, idx) => {
                  const active = selectedStepIndex === idx;
                  const isCompleted = step.status === 'completed';
                  const isCurrent = step.status === 'current';

                  return (
                    <TouchableOpacity
                      key={step.id || idx}
                      activeOpacity={0.8}
                      onPress={() => setSelectedStepIndex(idx)}
                      style={[
                        styles.stepPill,
                        active
                          ? styles.stepPillActive
                          : isCompleted
                          ? styles.stepPillCompleted
                          : isCurrent
                          ? styles.stepPillCurrent
                          : styles.stepPillUpcoming,
                      ]}
                    >
                      <View
                        style={[
                          styles.stepPillNumberBox,
                          active
                            ? styles.stepPillNumberBoxActive
                            : styles.stepPillNumberBoxDefault,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepPillNumberText,
                            active && styles.stepPillNumberTextActive,
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.stepPillTitle,
                          active
                            ? styles.stepPillTitleActive
                            : isCompleted
                            ? styles.stepPillTitleCompleted
                            : styles.stepPillTitleDefault,
                        ]}
                      >
                        {step.title}
                      </Text>
                      {isCompleted && (
                        <Text
                          style={[
                            styles.checkMark,
                            active && styles.checkMarkActive,
                          ]}
                        >
                          ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Active Step Box */}
            {selectedStep && (
              <View style={styles.activeStepBox}>
                <View style={styles.activeStepTop}>
                  <View style={styles.activeStepTitleGroup}>
                    <Text style={styles.activeStepNumberLabel}>
                      Chi Tiết Bước #{selectedStepIndex + 1}
                    </Text>
                    <Text style={styles.activeStepTitle}>
                      {selectedStep.title}
                    </Text>
                  </View>

                  <View style={styles.activeStepActions}>
                    <View
                      style={[
                        styles.stepStatusTag,
                        selectedStep.status === 'completed'
                          ? styles.stepStatusCompleted
                          : selectedStep.status === 'current'
                          ? styles.stepStatusCurrent
                          : styles.stepStatusUpcoming,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepStatusText,
                          selectedStep.status === 'completed'
                            ? styles.stepStatusTextCompleted
                            : selectedStep.status === 'current'
                            ? styles.stepStatusTextCurrent
                            : styles.stepStatusTextUpcoming,
                        ]}
                      >
                        {selectedStep.status === 'completed'
                          ? '✓ Đã hoàn thành'
                          : selectedStep.status === 'current'
                          ? '● Đang thực hiện'
                          : '⏳ Sắp diễn ra'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => onOpenInvoiceModal(selectedStep)}
                      style={styles.invoiceStepBtn}
                    >
                      <Text style={styles.invoiceStepBtnText}>🧾 Hóa Đơn</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Grid Info */}
                <View style={styles.activeStepDetailsGrid}>
                  <View style={styles.activeStepDetailCard}>
                    <Text style={styles.detailCardLabel}>
                      Thủ thuật & Mô tả thực hiện:
                    </Text>
                    <Text style={styles.detailCardDesc}>
                      {selectedStep.description ||
                        'Thực hiện thủ thuật theo đúng quy chuẩn vô trùng y tế.'}
                    </Text>
                    <Text style={styles.detailCardMeta}>
                      📅 {selectedStep.date}
                    </Text>
                  </View>

                  <View style={styles.activeStepDetailCard}>
                    <Text style={styles.detailCardLabel}>
                      Chi phí dịch vụ bước này:
                    </Text>
                    <Text style={styles.detailCardCost}>
                      {formatMoney(
                        selectedStep.paymentAmount ||
                          selectedStep.estimatedCost ||
                          0,
                      )}
                    </Text>
                    <Text style={styles.detailCardPaymentStatus}>
                      Trạng thái: {selectedStep.paymentStatusLabel}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ======================================================================= */}
        {/* SECTION 2: PRESCRIPTIONS (ĐƠN THUỐC BÁC SĨ - MATCHING WEB 1:1)        */}
        {/* ======================================================================= */}
        {isPrescriptionActive && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionMiniIconBox, styles.iconEmerald]}>
                  <Text style={styles.miniIconEmoji}>💊</Text>
                </View>
                <View style={styles.sectionTitleContent}>
                  <Text style={styles.sectionTitle}>
                    Danh Mục Đơn Thuốc Y Khoa Được Bác Sĩ Chỉ Định
                  </Text>
                  <Text style={styles.sectionSub}>
                    Uống thuốc đúng liều lượng và thời gian theo sự hướng dẫn của
                    bác sĩ.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('prescription')}
                style={styles.collapseSectionBtn}
              >
                <Text style={styles.collapseSectionText}>Thu gọn</Text>
              </TouchableOpacity>
            </View>

            {allRichPrescriptions.length === 0 ? (
              <View style={styles.emptyPrescBox}>
                <Text style={styles.emptyPrescEmoji}>💊</Text>
                <Text style={styles.emptyPrescTitle}>
                  Chưa có đơn thuốc nào trong hồ sơ này
                </Text>
                <Text style={styles.emptyPrescSub}>
                  Bác sĩ chưa khởi tạo hoặc chỉ định đơn thuốc trực tiếp cho phác
                  đồ điều trị này.
                </Text>
              </View>
            ) : (
              allRichPrescriptions.map((presc) => (
                <View key={presc.id} style={styles.prescBlock}>
                  {/* Presc Info Bar (matching Web emerald banner) */}
                  <View style={styles.prescInfoBar}>
                    <View style={styles.prescCodeBadge}>
                      <Text style={styles.prescCodeBadgeText}>
                        MÃ THAM CHIẾU: {presc.code}
                      </Text>
                    </View>
                    <View style={styles.prescMetaRow}>
                      <Text style={styles.prescMetaText}>
                        Ngày: <Text style={styles.boldText}>{presc.date}</Text>
                      </Text>
                      <Text style={styles.prescMetaDot}>•</Text>
                      <Text style={styles.prescMetaText}>
                        Bác sĩ: <Text style={styles.boldText}>{presc.doctor}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Medicines List / Table Cards */}
                  <View style={styles.medicinesContainer}>
                    {presc.items.map((item, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.medicineItemCard,
                          idx === presc.items.length - 1 &&
                            styles.medicineItemCardLast,
                        ]}
                      >
                        <View style={styles.medIndexCircle}>
                          <Text style={styles.medIndexText}>{idx + 1}</Text>
                        </View>

                        <View style={styles.medItemDetails}>
                          <View style={styles.medNameRow}>
                            <Text style={styles.medNameText}>
                              {item.medicineName}
                            </Text>
                            <View style={styles.dosagePill}>
                              <Text style={styles.dosagePillText}>
                                {item.dosage}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.medFreqText}>
                            ⏱️ {item.frequency}{' '}
                            <Text style={styles.medDurationText}>
                              ({item.duration})
                            </Text>
                          </Text>

                          {item.instruction ? (
                            <View style={styles.medInstructionBox}>
                              <Text style={styles.medInstructionText}>
                                💡 Hướng dẫn: {item.instruction}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Doctor's Advice Note Box (matching Web amber box) */}
                  {presc.notes ? (
                    <View style={styles.prescNotesBox}>
                      <Text style={styles.prescNotesText}>
                        <Text style={styles.prescNotesBold}>
                          📌 Ghi chú dặn dò của bác sĩ:{' '}
                        </Text>
                        {presc.notes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}

        {/* ======================================================================= */}
        {/* SECTION 3: CLINICAL IMAGES (PHIM X-QUANG & ẢNH - MATCHING WEB 1:1)     */}
        {/* ======================================================================= */}
        {isImagesActive && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionMiniIconBox, styles.iconIndigo]}>
                  <Text style={styles.miniIconEmoji}>🩻</Text>
                </View>
                <View style={styles.sectionTitleContent}>
                  <Text style={styles.sectionTitle}>
                    Dữ Liệu Hình Ảnh Lâm Sàng & Phim X-Quang ({realClinicalImages.length})
                  </Text>
                  <Text style={styles.sectionSub}>
                    {realClinicalImages.length > 0
                      ? 'Nhấp vào bất kỳ ảnh nào để phóng to và xem chi tiết.'
                      : 'Hình ảnh và phim chụp được liên kết từ hồ sơ bệnh án.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('images')}
                style={styles.collapseSectionBtn}
              >
                <Text style={styles.collapseSectionText}>Thu gọn</Text>
              </TouchableOpacity>
            </View>

            {realClinicalImages.length === 0 ? (
              <View style={styles.emptyPrescBox}>
                <Text style={styles.emptyPrescEmoji}>📷</Text>
                <Text style={styles.emptyPrescTitle}>
                  Chưa có hình ảnh hoặc phim X-quang được đính kèm
                </Text>
                <Text style={styles.emptyPrescSub}>
                  Bác sĩ chưa tải lên tệp ảnh lâm sàng cho các bước thuộc phác
                  đồ này. Khi bác sĩ cập nhật vào bệnh án, dữ liệu sẽ hiển thị tự
                  động tại đây.
                </Text>
              </View>
            ) : (
              <View style={styles.imagesGrid}>
                {realClinicalImages.map((img) => (
                  <TouchableOpacity
                    key={img.id}
                    activeOpacity={0.88}
                    onPress={() => setPreviewImage(img)}
                    style={styles.imageCard}
                  >
                    <Image
                      source={{ uri: img.url }}
                      style={styles.imageThumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                      <View style={styles.imageCategoryBadge}>
                        <Text style={styles.imageCategoryText}>
                          {img.category}
                        </Text>
                      </View>
                      <View>
                        <Text numberOfLines={1} style={styles.imageCardTitle}>
                          {img.title}
                        </Text>
                        <Text style={styles.imageCardDate}>
                          {img.date} • Nhấp để phóng to
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ======================================================================= */}
        {/* SECTION 4: MEDICAL RECORD (HỒ SƠ BỆNH ÁN - MATCHING WEB 1:1)           */}
        {/* ======================================================================= */}
        {isMedicalRecordActive && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionMiniIconBox, styles.iconBlue]}>
                  <Text style={styles.miniIconEmoji}>📄</Text>
                </View>
                <View style={styles.sectionTitleContent}>
                  <Text style={styles.sectionTitle}>
                    Hồ Sơ Bệnh Án Y Khoa Điện Tử
                  </Text>
                  <Text style={styles.sectionSub}>
                    Thông tin chẩn đoán y khoa, thủ thuật chỉ định và đơn thuốc
                    chính thức.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('medical-record')}
                style={styles.collapseSectionBtn}
              >
                <Text style={styles.collapseSectionText}>Thu gọn</Text>
              </TouchableOpacity>
            </View>

            {planMedicalRecordCount === 0 ? (
              <View style={styles.emptyPrescBox}>
                <Text style={styles.emptyPrescEmoji}>📄</Text>
                <Text style={styles.emptyPrescTitle}>
                  Chưa có bệnh án gắn với phác đồ này
                </Text>
              </View>
            ) : (
              <View style={styles.medicalRecordContent}>
                {/* 1. Main Diagnosis Box */}
                <View style={styles.diagCardSky}>
                  <Text style={styles.diagCardHeaderSky}>
                    🩺 CHẨN ĐOÁN Y KHOA CHÍNH
                  </Text>

                  {planDiagnosisNotes.chiefComplaint ? (
                    <View style={styles.diagSubBox}>
                      <Text style={styles.diagSubLabel}>
                        Lý do khám / Triệu chứng:
                      </Text>
                      <Text style={styles.diagSubValue}>
                        {planDiagnosisNotes.chiefComplaint}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.diagSubBox}>
                    <Text style={styles.diagSubLabel}>
                      Kết luận chẩn đoán y khoa:
                    </Text>
                    <Text style={styles.diagSubValueBold}>
                      {planDiagnosisNotes.diagnosis}
                    </Text>
                  </View>
                </View>

                {/* 2. Tooth Area & Clinical Notes Box */}
                <View style={styles.diagCardSlate}>
                  <View style={styles.diagSlateHeaderRow}>
                    <Text style={styles.diagCardHeaderSlate}>
                      🦷 VÙNG RĂNG & GHI CHÚ BÁC SĨ
                    </Text>
                    <View style={styles.toothTag}>
                      <Text style={styles.toothTagText}>
                        Vùng răng: {planDiagnosisNotes.toothNumber}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.diagSubBox}>
                    <Text style={styles.diagSubLabel}>
                      Ghi chú thủ thuật & Chỉ định chuyên khoa:
                    </Text>
                    <Text style={styles.diagSubValue}>
                      {planDiagnosisNotes.clinicalNotes}
                    </Text>
                  </View>
                </View>

                {/* 3. Medicines Row */}
                <View style={styles.diagCardEmerald}>
                  <Text style={styles.diagCardHeaderEmerald}>
                    💊 ĐƠN THUỐC ĐÃ KÊ THEO BỆNH ÁN
                  </Text>
                  <View style={styles.medChipsRow}>
                    {allRichPrescriptions.length === 0 ? (
                      <Text style={styles.emptyTextSub}>
                        Chưa có đơn thuốc được kê.
                      </Text>
                    ) : (
                      allRichPrescriptions
                        .flatMap((p) => p.items)
                        .map((med, idx) => (
                          <View key={idx} style={styles.medChip}>
                            <Text style={styles.medChipName}>
                              ● {med.medicineName}
                            </Text>
                            <Text style={styles.medChipMeta}>
                              ({med.dosage} • {med.frequency} • {med.duration})
                            </Text>
                          </View>
                        ))
                    )}
                  </View>

                  <View style={styles.doctorSignatureRow}>
                    <Text style={styles.doctorSigLabel}>Bác sĩ lập bệnh án:</Text>
                    <Text style={styles.doctorSigName}>
                      {treatment.doctor}
                    </Text>
                    <View style={styles.doctorSigBadge}>
                      <Text style={styles.doctorSigBadgeText}>
                        ✓ Đã ký số y khoa
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ========================================================================= */}
      {/* 3. LIGHTBOX IMAGE PREVIEW MODAL                                          */}
      {/* ========================================================================= */}
      <Modal
        visible={Boolean(previewImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
                <View style={styles.modalCategoryBadge}>
                  <Text style={styles.modalCategoryText}>
                    {previewImage?.category}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.modalTitle}>
                  {previewImage?.title}
                </Text>
                <Text style={styles.modalDate}>
                  📅 {previewImage?.date} • BS: {previewImage?.doctor}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setPreviewImage(null)}
                style={styles.modalCloseBtn}
              >
                <FontAwesome6
                  color="#FFFFFF"
                  iconStyle="solid"
                  name="xmark"
                  size={16}
                />
              </TouchableOpacity>
            </View>

            {previewImage && (
              <Image
                source={{ uri: previewImage.url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}

            {previewImage?.notes ? (
              <View style={styles.modalNotesBox}>
                <Text style={styles.modalNotesText}>
                  📝 Ghi chú: {previewImage.notes}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const hubTones = {
  blue: { accent: '#1996E0', iconBg: '#DBEAFE', iconColor: '#0863c5', soft: '#EFF6FF', softBorder: '#BFDBFE', softText: '#0863c5', activeBg: '#E8F4FC' },
  emerald: { accent: '#059669', iconBg: '#D1FAE5', iconColor: '#047857', soft: '#ECFDF5', softBorder: '#A7F3D0', softText: '#047857', activeBg: '#ECFDF5' },
  indigo: { accent: '#4F46E5', iconBg: '#E0E7FF', iconColor: '#4338CA', soft: '#EEF2FF', softBorder: '#C7D2FE', softText: '#4338CA', activeBg: '#EEF2FF' },
  sky: { accent: '#0EA5E9', iconBg: '#E0F2FE', iconColor: '#0863c5', soft: '#F0F9FF', softBorder: '#BAE6FD', softText: '#0863c5', activeBg: '#F0F9FF' },
} as const;

type HubCardProps = {
  active: boolean;
  badge: string;
  icon: string;
  onPress: () => void;
  subtitle: string;
  title: string;
  tone: keyof typeof hubTones;
};

function HubCard({ active, badge, icon, onPress, subtitle, title, tone }: HubCardProps) {
  const c = hubTones[tone];
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ expanded: active }}
      onPress={onPress}
      style={[
        styles.gridCard,
        active
          ? { backgroundColor: c.activeBg, borderColor: c.accent, elevation: 2, shadowColor: c.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 5 }
          : styles.gridCardDefault,
      ]}
    >
      <View>
        <View style={styles.hubCardTopRow}>
          <View style={[styles.hubCardIcon, { backgroundColor: c.iconBg }]}>
            <FontAwesome6 color={c.iconColor} iconStyle="solid" name={icon as any} size={14} />
          </View>
          <View style={[styles.hubCardBadge, { backgroundColor: c.soft, borderColor: c.softBorder }]}>
            <Text style={[styles.hubCardBadgeText, { color: c.softText }]}>{badge}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={[styles.actionTitle, active && { color: c.accent }]}>
          {title}
        </Text>
        <Text numberOfLines={2} style={styles.actionSub}>
          {subtitle}
        </Text>
      </View>

      <View style={[styles.hubCardFooter, { borderTopColor: active ? `${c.accent}4D` : '#F1F5F9' }]}>
        <View style={styles.hubCardStatus}>
          {active && <View style={[styles.hubCardDot, { backgroundColor: c.accent }]} />}
          <Text style={[styles.hubCardStatusText, { color: active ? c.accent : '#64748B' }]}>
            {active ? 'Đang xem' : 'Bấm để xem'}
          </Text>
        </View>
        <View style={[styles.hubCardPill, { backgroundColor: active ? c.accent : c.soft }]}>
          <Text style={[styles.hubCardPillText, { color: active ? '#FFFFFF' : c.softText }]}>
            {active ? 'Thu gọn' : 'Chi tiết'}
          </Text>
          <FontAwesome6
            color={active ? '#FFFFFF' : c.softText}
            iconStyle="solid"
            name={active ? 'chevron-up' : 'chevron-right'}
            size={8}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },

  // Hub Container
  hubContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  // Tiêu đề chiếm hết chiều ngang, nút "Hiện tất cả" xuống dòng dưới để không bóp tiêu đề dài
  hubHeader: {
    gap: 10,
    marginBottom: 14,
  },
  hubTitleGroup: {
    width: '100%',
  },
  hubTitle: {
    color: '#0F172A',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  hubSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  hubSubtitleStrong: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  hubCardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  hubCardIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  hubCardBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  hubCardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hubCardFooter: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
  },
  hubCardStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 4,
  },
  hubCardDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  hubCardStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hubCardPill: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  hubCardPillText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  expandAllBtn: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
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

  // 2x2 Grid
  gridContainer: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  gridCardDefault: {
    borderColor: '#E2E8F0',
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionIconBox: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconBlue: {
    backgroundColor: '#0863c5',
  },
  iconEmerald: {
    backgroundColor: '#059669',
  },
  iconIndigo: {
    backgroundColor: '#4F46E5',
  },
  actionIconEmoji: {
    fontSize: 18,
  },
  badgeTag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeTagDefault: {
    backgroundColor: '#F1F5F9',
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
  badgeTagText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  badgeTagTextDefault: {
    color: '#64748B',
  },
  badgeTagTextActive: {
    color: '#FFFFFF',
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  actionSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 1,
  },

  // Expanded Container
  expandedContainer: {
    marginTop: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  sectionTitleRow: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 8,
  },
  sectionMiniIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    width: 32,
  },
  miniIconEmoji: {
    fontSize: 16,
  },
  sectionTitleContent: {
    flex: 1,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionSub: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  collapseSectionBtn: {
    paddingLeft: 6,
    paddingVertical: 2,
  },
  collapseSectionText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
  },

  // Workflow section styles
  stepsPillsContainer: {
    marginTop: 12,
  },
  stepsPillsLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  stepsScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  stepPill: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  stepPillActive: {
    backgroundColor: '#0863c5',
    borderColor: '#0863c5',
  },
  stepPillCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  stepPillCurrent: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  stepPillUpcoming: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  stepPillNumberBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  stepPillNumberBoxActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  stepPillNumberBoxDefault: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  stepPillNumberText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stepPillNumberTextActive: {
    color: '#FFFFFF',
  },
  stepPillTitle: {
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 140,
  },
  stepPillTitleActive: {
    color: '#FFFFFF',
  },
  stepPillTitleCompleted: {
    color: '#065F46',
  },
  stepPillTitleDefault: {
    color: '#334155',
  },
  checkMark: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '900',
  },
  checkMarkActive: {
    color: '#FFFFFF',
  },

  // Active step box
  activeStepBox: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  activeStepTop: {
    borderBottomColor: '#E0F2FE',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  activeStepTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  activeStepNumberLabel: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  activeStepTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  activeStepActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stepStatusTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stepStatusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  stepStatusCurrent: {
    backgroundColor: '#FEF3C7',
  },
  stepStatusUpcoming: {
    backgroundColor: '#E2E8F0',
  },
  stepStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stepStatusTextCompleted: {
    color: '#065F46',
  },
  stepStatusTextCurrent: {
    color: '#92400E',
  },
  stepStatusTextUpcoming: {
    color: '#475569',
  },
  invoiceStepBtn: {
    backgroundColor: '#0863c5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  invoiceStepBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  activeStepDetailsGrid: {
    gap: 8,
    marginTop: 10,
  },
  activeStepDetailCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  detailCardLabel: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  detailCardDesc: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  detailCardMeta: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  detailCardCost: {
    color: '#0863c5',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  detailCardPaymentStatus: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  // Prescriptions Section Styles
  emptyPrescBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: 12,
    padding: 24,
  },
  emptyPrescEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyPrescTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyPrescSub: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  prescBlock: {
    marginTop: 12,
  },
  prescInfoBar: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  prescCodeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  prescCodeBadgeText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '800',
  },
  prescMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  prescMetaText: {
    color: '#475569',
    fontSize: 11,
  },
  boldText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  prescMetaDot: {
    color: '#94A3B8',
    marginHorizontal: 6,
  },
  medicinesContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  medicineItemCard: {
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
  medicineItemCardLast: {
    borderBottomWidth: 0,
  },
  medIndexCircle: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    width: 20,
  },
  medIndexText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  medItemDetails: {
    flex: 1,
  },
  medNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  medNameText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  dosagePill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dosagePillText: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '800',
  },
  medFreqText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  medDurationText: {
    color: '#64748B',
    fontWeight: '400',
  },
  medInstructionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    marginTop: 6,
    padding: 6,
  },
  medInstructionText: {
    color: '#475569',
    fontSize: 10,
    lineHeight: 14,
  },
  prescNotesBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    padding: 10,
  },
  prescNotesText: {
    color: '#92400E',
    fontSize: 11,
    lineHeight: 16,
  },
  prescNotesBold: {
    fontWeight: '800',
  },

  // Images Section Styles
  imagesGrid: {
    gap: 10,
    marginTop: 12,
  },
  imageCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    height: 160,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbnail: {
    height: '100%',
    opacity: 0.85,
    width: '100%',
  },
  imageOverlay: {
    bottom: 0,
    justifyContent: 'space-between',
    left: 0,
    padding: 10,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  imageCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0863c5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  imageCategoryText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  imageCardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  imageCardDate: {
    color: '#BAE6FD',
    fontSize: 10,
    marginTop: 2,
  },

  // Medical Record Section Styles
  medicalRecordContent: {
    gap: 10,
    marginTop: 12,
  },
  diagCardSky: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderLeftColor: '#0863c5',
    borderLeftWidth: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  diagCardHeaderSky: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  diagCardSlate: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  diagSlateHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  diagCardHeaderSlate: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  toothTag: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  toothTagText: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '800',
  },
  diagSubBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    padding: 8,
  },
  diagSubLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  diagSubValue: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 2,
  },
  diagSubValueBold: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: 2,
  },
  diagCardEmerald: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  diagCardHeaderEmerald: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  medChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  medChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BAE6FD',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  medChipName: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '800',
  },
  medChipMeta: {
    color: '#475569',
    fontSize: 10,
    marginTop: 1,
  },
  emptyTextSub: {
    color: '#64748B',
    fontSize: 11,
  },
  doctorSignatureRow: {
    alignItems: 'center',
    borderTopColor: '#A7F3D0',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
  },
  doctorSigLabel: {
    color: '#64748B',
    fontSize: 10,
  },
  doctorSigName: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  doctorSigBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  doctorSigBadgeText: {
    color: '#065F46',
    fontSize: 9,
    fontWeight: '800',
  },

  // Modal Image Preview
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#334155',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  modalHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  modalCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0863c5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modalCategoryText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  modalDate: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  modalCloseBtn: {
    backgroundColor: '#334155',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
  modalImage: {
    height: 300,
    width: '100%',
  },
  modalNotesBox: {
    backgroundColor: '#1E293B',
    padding: 12,
  },
  modalNotesText: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 16,
  },
});
