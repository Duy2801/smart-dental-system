import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
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
import {
  cancelMyConsultation,
  createConsultationBooking,
  formatVnd,
  getAvailableConsultationSlots,
  getConsultationDoctors,
  getConsultationPackages,
  getPatientConsultations,
  type ConsultationDoctor,
  type ConsultationDurationMinutes,
  type ConsultationDurationOption,
  type PatientConsultation,
} from '../api';

type TabMode = 'book' | 'my-consultations';

const PACKAGES_PER_PAGE = 10;
const DOCTORS_PER_PAGE = 4;
const CONSULTATIONS_PER_PAGE = 10;

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return 'Chọn ngày';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getInitialDateStr() {
  const now = new Date();
  if (now.getHours() >= 17) {
    now.setDate(now.getDate() + 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ConsultationScreen({ navigation }: any) {
  const user = useSelector((state: RootState) => state.login?.user ?? null);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabMode>('book');
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Pagination states
  const [packagePage, setPackagePage] = useState(1);
  const [doctorPage, setDoctorPage] = useState(1);
  const [consultPage, setConsultPage] = useState(1);

  // Booking Form State
  const [selectedDuration, setSelectedDuration] =
    useState<ConsultationDurationMinutes>(30);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getInitialDateStr());
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any | null>(null);

  // Date Picker Modal state
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [calendarYear, setCalendarYear] = useState(() =>
    new Date(selectedDate || Date.now()).getFullYear(),
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    new Date(selectedDate || Date.now()).getMonth(),
  );

  // Detail Modal & Payment Modal state
  const [selectedConsultation, setSelectedConsultation] =
    useState<PatientConsultation | null>(null);
  const [paymentModalItem, setPaymentModalItem] =
    useState<PatientConsultation | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { handleDrawerNavigate, handleLogout } = usePatientDrawerActions();

  // Query: Consultation Packages
  const packagesQuery = useQuery({
    queryFn: getConsultationPackages,
    queryKey: ['consultation', 'packages'],
  });

  // Query: Consultation Doctors
  const doctorsQuery = useQuery({
    queryFn: getConsultationDoctors,
    queryKey: ['consultation', 'doctors'],
  });

  // Query: Available Slots
  const slotsQuery = useQuery({
    enabled: Boolean(selectedDoctorId && selectedDate),
    queryFn: () =>
      getAvailableConsultationSlots(
        selectedDoctorId,
        selectedDate,
        selectedDuration,
      ),
    queryKey: [
      'consultation',
      'slots',
      selectedDoctorId,
      selectedDate,
      selectedDuration,
    ],
  });

  // Query: My Consultations
  const myConsultationsQuery = useQuery({
    queryFn: getPatientConsultations,
    queryKey: ['consultation', 'my-consultations'],
  });

  const packages = useMemo(() => {
    return packagesQuery.data ?? [];
  }, [packagesQuery.data]);

  const doctors = useMemo(() => doctorsQuery.data ?? [], [doctorsQuery.data]);
  const availableSlots = useMemo(
    () => slotsQuery.data ?? [],
    [slotsQuery.data],
  );
  const myConsultations = useMemo(
    () => myConsultationsQuery.data ?? [],
    [myConsultationsQuery.data],
  );

  // Paginated Slices
  const totalPackagePages =
    Math.ceil(packages.length / PACKAGES_PER_PAGE) || 1;
  const displayedPackages = useMemo(() => {
    const start = (packagePage - 1) * PACKAGES_PER_PAGE;
    return packages.slice(start, start + PACKAGES_PER_PAGE);
  }, [packages, packagePage]);

  const totalDoctorPages = Math.ceil(doctors.length / DOCTORS_PER_PAGE) || 1;
  const displayedDoctors = useMemo(() => {
    const start = (doctorPage - 1) * DOCTORS_PER_PAGE;
    return doctors.slice(start, start + DOCTORS_PER_PAGE);
  }, [doctors, doctorPage]);

  const totalConsultPages =
    Math.ceil(myConsultations.length / CONSULTATIONS_PER_PAGE) || 1;
  const displayedConsultations = useMemo(() => {
    const start = (consultPage - 1) * CONSULTATIONS_PER_PAGE;
    return myConsultations.slice(start, start + CONSULTATIONS_PER_PAGE);
  }, [myConsultations, consultPage]);

  // Auto-select first doctor
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  const selectedDurationOption = useMemo(
    () =>
      packages.find(p => p.minutes === selectedDuration) ||
      packages[0] ||
      null,
    [packages, selectedDuration],
  );

  const handleBookingSubmit = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedSlot) {
      Alert.alert(
        'Thông tin chưa đầy đủ',
        'Vui lòng chọn Bác sĩ, Ngày và Khung giờ tư vấn.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledAt = new Date(
        `${selectedDate}T${selectedSlot}:00.000+07:00`,
      ).toISOString();

      const result = await createConsultationBooking({
        doctorId: selectedDoctorId,
        durationMinutes: selectedDuration,
        notes,
        scheduledAt,
      });

      await queryClient.invalidateQueries({
        queryKey: ['consultation', 'my-consultations'],
      });
      setBookingResult(result);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tạo đơn đặt tư vấn. Vui lòng thử lại.';
      Alert.alert('Đặt lịch thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    Alert.alert(
      'Xác nhận hủy lịch',
      'Bạn có chắc chắn muốn hủy lịch tư vấn trực tuyến này?',
      [
        { text: 'Bỏ qua', style: 'cancel' },
        {
          style: 'destructive',
          text: 'Hủy lịch',
          onPress: async () => {
            setCancellingId(id);
            try {
              await cancelMyConsultation(id);
              await queryClient.invalidateQueries({
                queryKey: ['consultation', 'my-consultations'],
              });
              Alert.alert('Thành công', 'Đã hủy lịch tư vấn thành công.');
            } catch (err: any) {
              Alert.alert(
                'Lỗi hủy lịch',
                err?.response?.data?.message || 'Không thể hủy lịch tư vấn.',
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  const handleJoinVideoRoom = (item: PatientConsultation) => {
    if (item.meetingUrl) {
      Linking.openURL(item.meetingUrl).catch(() => {
        Alert.alert('Lỗi', 'Không thể mở liên kết phòng video call.');
      });
    } else {
      Alert.alert(
        'Phòng tư vấn video',
        'Phòng tư vấn đang được Bác sĩ kích hoạt. Vui lòng quay lại trước giờ hẹn 5 phút.',
      );
    }
  };

  // Calendar generation helpers
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const m = String(calendarMonth + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      const dateStr = `${calendarYear}-${m}-${d}`;
      days.push({ day, dateStr });
    }
    return days;
  }, [calendarYear, calendarMonth]);

  const handleSelectCalendarDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot('');
    setDateModalVisible(false);
  };

  const renderBookingSuccess = () => (
    <View style={styles.successCard}>
      <View style={styles.successHeader}>
        <View style={styles.successIconBox}>
          <FontAwesome6
            color="#16A34A"
            iconStyle="solid"
            name="check"
            size={20}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.successTitle}>
            Khởi Tạo Đơn Tư Vấn Thành Công!
          </Text>
          <Text style={styles.successSub}>
            Mã đơn: #{bookingResult?.consultation?.id?.slice?.(0, 8) || 'SD'}
          </Text>
        </View>
      </View>

      <View style={styles.successInfoBox}>
        <Text style={styles.successInfoRow}>
          Thời gian: {formatDisplayDate(selectedDate)} lúc {selectedSlot}
        </Text>
        <Text style={styles.successInfoRow}>
          Thời lượng: {selectedDuration} phút
        </Text>
        <Text style={styles.successInfoRow}>
          Tổng phí:{' '}
          {selectedDurationOption?.formattedPrice ||
            (selectedDurationOption
              ? formatVnd(selectedDurationOption.price)
              : '0 đ')}
        </Text>
      </View>

      <View style={styles.successActions}>
        <TouchableOpacity
          activeOpacity={0.84}
          onPress={() => {
            setBookingResult(null);
            setActiveTab('my-consultations');
          }}
          style={styles.successPrimaryBtn}
        >
          <Text style={styles.successPrimaryBtnText}>
            Xem Lịch Tư Vấn Của Tôi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.84}
          onPress={() => {
            setBookingResult(null);
            setSelectedSlot('');
            setNotes('');
          }}
          style={styles.successSecondaryBtn}
        >
          <Text style={styles.successSecondaryBtnText}>
            Đặt Buổi Tư Vấn Khác
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBookingFormCard = () => (
    <View style={styles.formCard}>
      {/* BƯỚC 1: Chọn gói thời lượng (Lưới 2 cột căn chỉnh đẹp) */}
      <View style={[styles.stepSection, { borderTopWidth: 0, paddingTop: 0 }]}>
            <View style={styles.stepTitleRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Chọn Gói Thời Lượng Tư Vấn</Text>
            </View>

            {packagesQuery.isLoading ? (
              <View style={styles.slotLoadingBox}>
                <ActivityIndicator color="#0058bc" size="small" />
                <Text style={styles.slotLoadingText}>
                  Đang tải danh sách gói tư vấn từ hệ thống...
                </Text>
              </View>
            ) : packagesQuery.isError ? (
              <View style={styles.slotEmptyBox}>
                <Text style={styles.slotEmptyText}>
                  Không thể tải danh sách gói tư vấn từ máy chủ.
                </Text>
                <TouchableOpacity
                  onPress={() => packagesQuery.refetch()}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryBtnText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.slotEmptyBox}>
                <Text style={styles.slotEmptyText}>
                  Hiện chưa có gói tư vấn nào trong hệ thống.
                </Text>
              </View>
            ) : (
              <View style={styles.packagesGrid}>
                {displayedPackages.map((pkg: ConsultationDurationOption) => {
                  const isSelected = selectedDuration === pkg.minutes;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.84}
                      key={pkg.minutes}
                      onPress={() => setSelectedDuration(pkg.minutes)}
                      style={[
                        styles.packageCard,
                        isSelected && styles.packageCardSelected,
                      ]}
                    >
                      <View style={styles.packageCardHeader}>
                        <Text
                          style={[
                            styles.packageLabel,
                            isSelected && styles.packageLabelSelected,
                          ]}
                        >
                          {pkg.label}
                        </Text>

                        {Boolean(pkg.tag) && (
                          <View
                            style={[
                              styles.packageTag,
                              isSelected && styles.packageTagSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.packageTagText,
                                isSelected && styles.packageTagTextSelected,
                              ]}
                            >
                              {pkg.tag}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.packageDesc}>
                        {pkg.description}
                      </Text>

                      <View style={styles.packageBottomRow}>
                        <Text style={styles.packagePayNote}>Thanh toán 100%</Text>
                        <Text style={styles.packagePrice}>
                          {pkg.formattedPrice}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Phân trang gói thời lượng nếu nhiều hơn 10 */}
            {packages.length > PACKAGES_PER_PAGE && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  disabled={packagePage === 1}
                  onPress={() => setPackagePage(p => Math.max(1, p - 1))}
                  style={[
                    styles.pageBtn,
                    packagePage === 1 && styles.pageBtnDisabled,
                  ]}
                >
                  <FontAwesome6
                    color={packagePage === 1 ? '#94A3B8' : '#0058bc'}
                    iconStyle="solid"
                    name="chevron-left"
                    size={11}
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      packagePage === 1 && styles.pageBtnTextDisabled,
                    ]}
                  >
                    Trước
                  </Text>
                </TouchableOpacity>

                <Text style={styles.pageInfoText}>
                  Trang {packagePage} / {totalPackagePages}
                </Text>

                <TouchableOpacity
                  disabled={packagePage === totalPackagePages}
                  onPress={() =>
                    setPackagePage(p => Math.min(totalPackagePages, p + 1))
                  }
                  style={[
                    styles.pageBtn,
                    packagePage === totalPackagePages && styles.pageBtnDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      packagePage === totalPackagePages &&
                        styles.pageBtnTextDisabled,
                    ]}
                  >
                    Sau
                  </Text>
                  <FontAwesome6
                    color={
                      packagePage === totalPackagePages ? '#94A3B8' : '#0058bc'
                    }
                    iconStyle="solid"
                    name="chevron-right"
                    size={11}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* BƯỚC 2: Chọn bác sĩ (Chia làm 2 cột / hàng có phân trang) */}
          <View style={styles.stepSection}>
            <View style={styles.stepTitleRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Chọn Bác Sĩ Tư Vấn</Text>
            </View>

            {doctorsQuery.isLoading ? (
              <View style={styles.slotLoadingBox}>
                <ActivityIndicator color="#0058bc" size="small" />
                <Text style={styles.slotLoadingText}>
                  Đang tải danh sách bác sĩ tư vấn...
                </Text>
              </View>
            ) : doctorsQuery.isError ? (
              <View style={styles.slotEmptyBox}>
                <Text style={styles.slotEmptyText}>
                  Không thể tải danh sách bác sĩ từ máy chủ.
                </Text>
                <TouchableOpacity
                  onPress={() => doctorsQuery.refetch()}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryBtnText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : doctors.length === 0 ? (
              <View style={styles.slotEmptyBox}>
                <Text style={styles.slotEmptyText}>
                  Hiện chưa có bác sĩ tư vấn trực tuyến.
                </Text>
              </View>
            ) : (
              <View style={styles.doctorsGrid}>
                {displayedDoctors.map((doctor: ConsultationDoctor) => {
                  const isSelected = selectedDoctorId === doctor.id;
                  const initials = doctor.fullName
                    .split(' ')
                    .filter(Boolean)
                    .slice(-2)
                    .map(p => p[0])
                    .join('')
                    .toUpperCase();

                  return (
                    <TouchableOpacity
                      activeOpacity={0.84}
                      key={doctor.id}
                      onPress={() => setSelectedDoctorId(doctor.id)}
                      style={[
                        styles.doctorGridCard,
                        isSelected && styles.doctorGridCardSelected,
                      ]}
                    >
                      <View style={styles.doctorAvatarBox}>
                        {doctor.avatarUrl ? (
                          <Image
                            resizeMode="cover"
                            source={{ uri: doctor.avatarUrl }}
                            style={styles.doctorAvatarImg}
                          />
                        ) : (
                          <View style={styles.doctorInitialAvatar}>
                            <Text style={styles.doctorInitialText}>
                              {initials || 'BS'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text numberOfLines={1} style={styles.doctorGridName}>
                        {doctor.fullName}
                      </Text>
                      <Text numberOfLines={1} style={styles.doctorGridSpec}>
                        {doctor.specialization}
                      </Text>
                      <Text style={styles.doctorGridExp}>
                        {doctor.yearsExperience} năm KN
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Phân trang danh sách bác sĩ nếu nhiều hơn DOCTORS_PER_PAGE */}
            {doctors.length > DOCTORS_PER_PAGE && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  disabled={doctorPage === 1}
                  onPress={() => setDoctorPage(p => Math.max(1, p - 1))}
                  style={[
                    styles.pageBtn,
                    doctorPage === 1 && styles.pageBtnDisabled,
                  ]}
                >
                  <FontAwesome6
                    color={doctorPage === 1 ? '#94A3B8' : '#0058bc'}
                    iconStyle="solid"
                    name="chevron-left"
                    size={11}
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      doctorPage === 1 && styles.pageBtnTextDisabled,
                    ]}
                  >
                    Trước
                  </Text>
                </TouchableOpacity>

                <Text style={styles.pageInfoText}>
                  Trang {doctorPage} / {totalDoctorPages}
                </Text>

                <TouchableOpacity
                  disabled={doctorPage === totalDoctorPages}
                  onPress={() =>
                    setDoctorPage(p => Math.min(totalDoctorPages, p + 1))
                  }
                  style={[
                    styles.pageBtn,
                    doctorPage === totalDoctorPages && styles.pageBtnDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      doctorPage === totalDoctorPages &&
                        styles.pageBtnTextDisabled,
                    ]}
                  >
                    Sau
                  </Text>
                  <FontAwesome6
                    color={
                      doctorPage === totalDoctorPages ? '#94A3B8' : '#0058bc'
                    }
                    iconStyle="solid"
                    name="chevron-right"
                    size={11}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* BƯỚC 3: Chọn ngày & slot (Nút chọn ngày tinh gọn giống web) */}
          <View style={styles.stepSection}>
            <View style={styles.stepHeaderBetween}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>Chọn Ngày & Khung Giờ</Text>
              </View>

              {/* Nút chọn ngày kiểu web [ 09/06/2026 📅 ] */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => setDateModalVisible(true)}
                style={styles.datePickerBtn}
              >
                <Text style={styles.datePickerBtnText}>
                  {formatDisplayDate(selectedDate)}
                </Text>
                <FontAwesome6
                  color="#334155"
                  iconStyle="regular"
                  name="calendar"
                  size={13}
                />
              </TouchableOpacity>
            </View>

            {/* Slots Grid */}
            <Text style={styles.slotSectionSubtitle}>
              Khung giờ khả dụng ({formatDisplayDate(selectedDate)}):
            </Text>

            {slotsQuery.isLoading ? (
              <View style={styles.slotLoadingBox}>
                <ActivityIndicator color="#0058bc" size="small" />
                <Text style={styles.slotLoadingText}>
                  Đang tìm khung giờ rảnh...
                </Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.slotEmptyBox}>
                <Text style={styles.slotEmptyText}>
                  Ngày này không còn khung giờ tư vấn rảnh. Vui lòng chọn ngày
                  khác.
                </Text>
              </View>
            ) : (
              <View style={styles.slotGrid}>
                {availableSlots.map(slot => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      key={slot}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.slotBtn,
                        isSelected && styles.slotBtnSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotBtnText,
                          isSelected && styles.slotBtnTextSelected,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* BƯỚC 4: Lý do khám & Triệu chứng */}
          <View style={styles.stepSection}>
            <View style={styles.stepTitleRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepTitle}>Lý Do Khám & Triệu Chứng</Text>
            </View>

            <TextInput
              multiline
              numberOfLines={3}
              onChangeText={setNotes}
              placeholder="Nhập mô tả chi tiết về tình trạng răng miệng hoặc thắc mắc bạn cần Bác sĩ giải đáp..."
              placeholderTextColor="#94A3B8"
              style={styles.notesInput}
              value={notes}
            />
          </View>

          {/* Policy Information */}
          <View style={styles.policyBox}>
            <Text style={styles.policyTitle}>
              ℹ️ Chính sách Hủy lịch & Thông báo:
            </Text>
            <Text style={styles.policyItem}>
              • Hệ thống tự động gửi thông báo nhắc lịch trước 10 phút.
            </Text>
            <Text style={styles.policyItem}>
              • Hủy trước &gt;24 tiếng: Hoàn 100% phí dịch vụ.
            </Text>
            <Text style={styles.policyItem}>
              • Hủy từ 4 - 24 tiếng: Hoàn 50% phí dịch vụ.
            </Text>
            <Text style={styles.policyItem}>
              • Hủy dưới 4 tiếng hoặc vắng mặt: Không hoàn tiền.
            </Text>
          </View>

          {/* Summary & Submit Action */}
          <View style={styles.submitSection}>
            <View>
              <Text style={styles.submitTotalLabel}>
                Tổng chi phí (Thanh toán 100%):
              </Text>
              <Text style={styles.submitTotalPrice}>
                {selectedDurationOption?.formattedPrice ||
                  (selectedDurationOption
                    ? formatVnd(selectedDurationOption.price)
                    : '0 đ')}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isSubmitting || !selectedSlot}
              onPress={handleBookingSubmit}
              style={[
                styles.submitBtn,
                (!selectedSlot || isSubmitting) && styles.submitBtnDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Xác Nhận & Đặt Lịch</Text>
              )}
            </TouchableOpacity>
          </View>
    </View>
  );

  const renderConsultationCard = ({ item }: { item: PatientConsultation }) => {
    const isPaid = item.isPaid;
    const isCancelled = item.status === 'CANCELLED';
    const isCompleted = item.status === 'COMPLETED';

    return (
      <View style={styles.consultCard}>
        <View style={styles.consultCardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.consultDoctorRow}>
              <Text numberOfLines={1} style={styles.consultDoctorName}>
                {item.doctor}
              </Text>
              <View style={styles.consultDurationBadge}>
                <Text style={styles.consultDurationText}>{item.duration}</Text>
              </View>
            </View>
            <Text style={styles.consultDoctorSpec}>
              {item.doctorSpecialization || 'Bác sĩ Răng Hàm Mặt'}
            </Text>
          </View>

          <View
            style={[
              styles.consultStatusBadge,
              isCancelled
                ? styles.statusBadgeCancelled
                : isCompleted
                ? styles.statusBadgeCompleted
                : isPaid
                ? styles.statusBadgePaid
                : styles.statusBadgePending,
            ]}
          >
            <Text
              style={[
                styles.consultStatusText,
                isCancelled
                  ? styles.statusTextCancelled
                  : isCompleted
                  ? styles.statusTextCompleted
                  : isPaid
                  ? styles.statusTextPaid
                  : styles.statusTextPending,
              ]}
            >
              {isCancelled
                ? 'Đã hủy'
                : isCompleted
                ? 'Đã hoàn thành'
                : isPaid
                ? 'Đã thanh toán 100%'
                : 'Chờ thanh toán'}
            </Text>
          </View>
        </View>

        <View style={styles.consultTimeRow}>
          <FontAwesome6
            color="#64748B"
            iconStyle="regular"
            name="clock"
            size={12}
          />
          <Text style={styles.consultTimeText}>
            Thời gian hẹn: <Text style={styles.consultTimeBold}>{item.time}</Text>
          </Text>
        </View>

        {Boolean(item.notes) && (
          <View style={styles.consultNotesBox}>
            <Text numberOfLines={2} style={styles.consultNotesText}>
              "{item.notes}"
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.consultCardFooter}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedConsultation(item)}
            style={styles.consultDetailBtn}
          >
            <Text style={styles.consultDetailBtnText}>Chi tiết</Text>
          </TouchableOpacity>

          <View style={styles.consultActionRightGroup}>
            {!isCancelled && !isCompleted && !isPaid && (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPaymentModalItem(item)}
                  style={styles.consultPayBtn}
                >
                  <FontAwesome6
                    color="#FFFFFF"
                    iconStyle="solid"
                    name="qrcode"
                    size={11}
                  />
                  <Text style={styles.consultPayBtnText}>Thanh toán</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={cancellingId === item.id}
                  onPress={() => handleCancelBooking(item.id)}
                  style={styles.consultCancelBtn}
                >
                  <Text style={styles.consultCancelBtnText}>
                    {cancellingId === item.id ? 'Đang hủy...' : 'Hủy đơn'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {!isCancelled && !isCompleted && isPaid && (
              <TouchableOpacity
                activeOpacity={0.84}
                onPress={() => handleJoinVideoRoom(item)}
                style={styles.consultJoinBtn}
              >
                <FontAwesome6
                  color="#FFFFFF"
                  iconStyle="solid"
                  name="video"
                  size={12}
                />
                <Text style={styles.consultJoinBtnText}>Vào Video Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderMyConsultationsCard = () => (
    <View style={styles.formCard}>
      {/* Tiêu đề & Nút làm mới */}
      <View style={styles.myConsultHeaderRow}>
        <Text style={styles.myConsultHeaderTitle}>
          Danh Sách Buổi Tư Vấn Của Tôi
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => void myConsultationsQuery.refetch()}
          style={styles.myConsultRefreshBtn}
        >
          <FontAwesome6
            color="#0058bc"
            iconStyle="solid"
            name="arrows-rotate"
            size={11}
          />
          <Text style={styles.myConsultRefreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {myConsultationsQuery.isLoading ? (
        <View style={styles.slotLoadingBox}>
          <ActivityIndicator color="#0058bc" size="small" />
          <Text style={styles.slotLoadingText}>
            Đang tải danh sách lịch tư vấn...
          </Text>
        </View>
      ) : myConsultationsQuery.isError ? (
        <View style={styles.slotEmptyBox}>
          <Text style={styles.slotEmptyText}>
            Không thể tải danh sách lịch tư vấn từ máy chủ.
          </Text>
          <TouchableOpacity
            onPress={() => void myConsultationsQuery.refetch()}
            style={styles.retryBtn}
          >
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : myConsultations.length === 0 ? (
        <View style={styles.emptyConsultBox}>
          <View style={styles.emptyConsultIconBox}>
            <FontAwesome6
              color="#94A3B8"
              iconStyle="solid"
              name="calendar-xmark"
              size={28}
            />
          </View>
          <Text style={styles.emptyConsultTitle}>Chưa có lịch tư vấn nào</Text>
          <Text style={styles.emptyConsultDesc}>
            Bạn chưa có buổi tư vấn trực tuyến nào. Hãy đặt lịch để nhận tư vấn
            từ Bác sĩ ngay!
          </Text>
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={() => setActiveTab('book')}
            style={styles.emptyConsultBookBtn}
          >
            <Text style={styles.emptyConsultBookBtnText}>
              Đặt Lịch Tư Vấn Ngay
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.consultListContainer}>
          {displayedConsultations.map(item => (
            <React.Fragment key={item.id}>
              {renderConsultationCard({ item })}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Phân trang lịch tư vấn */}
      {renderMyConsultationsFooter()}
    </View>
  );

  const renderMyConsultationsFooter = () => {
    if (myConsultations.length <= CONSULTATIONS_PER_PAGE) return null;
    return (
      <View style={[styles.paginationRow, { marginTop: 12 }]}>
        <TouchableOpacity
          disabled={consultPage === 1}
          onPress={() => setConsultPage(p => Math.max(1, p - 1))}
          style={[styles.pageBtn, consultPage === 1 && styles.pageBtnDisabled]}
        >
          <FontAwesome6
            color={consultPage === 1 ? '#94A3B8' : '#0058bc'}
            iconStyle="solid"
            name="chevron-left"
            size={11}
          />
          <Text
            style={[
              styles.pageBtnText,
              consultPage === 1 && styles.pageBtnTextDisabled,
            ]}
          >
            Trước
          </Text>
        </TouchableOpacity>

        <Text style={styles.pageInfoText}>
          Trang {consultPage} / {totalConsultPages}
        </Text>

        <TouchableOpacity
          disabled={consultPage === totalConsultPages}
          onPress={() =>
            setConsultPage(p => Math.min(totalConsultPages, p + 1))
          }
          style={[
            styles.pageBtn,
            consultPage === totalConsultPages && styles.pageBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.pageBtnText,
              consultPage === totalConsultPages &&
                styles.pageBtnTextDisabled,
            ]}
          >
            Sau
          </Text>
          <FontAwesome6
            color={consultPage === totalConsultPages ? '#94A3B8' : '#0058bc'}
            iconStyle="solid"
            name="chevron-right"
            size={11}
          />
        </TouchableOpacity>
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

      <ScrollView
        contentContainerStyle={{ paddingBottom: 0 }}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void myConsultationsQuery.refetch();
              void doctorsQuery.refetch();
              void packagesQuery.refetch();
            }}
            refreshing={
              myConsultationsQuery.isRefetching ||
              doctorsQuery.isRefetching ||
              packagesQuery.isRefetching
            }
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Header Info - CỐ ĐỊNH CHO CẢ 2 BÊN */}
          <View style={styles.introHeader}>
            <View style={styles.badge}>
              <FontAwesome6
                color="#0058bc"
                iconStyle="solid"
                name="video"
                size={12}
              />
              <Text style={styles.badgeText}>Telehealth Center</Text>
            </View>
            <Text style={styles.title}>Tư Vấn Nha Khoa Trực Tuyến</Text>
            <Text style={styles.subtitle}>
              Kết nối trực tiếp Video Call 1-1 với Bác sĩ chuyên khoa nha khoa
              hàng đầu để được chẩn đoán và tư vấn tận tâm.
            </Text>
          </View>

          {/* Tabs Switcher - CỐ ĐỊNH CHO CẢ 2 BÊN */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('book')}
              style={[
                styles.tabBtn,
                activeTab === 'book' && styles.tabBtnActive,
              ]}
            >
              <FontAwesome6
                color={activeTab === 'book' ? '#FFFFFF' : '#64748B'}
                iconStyle="regular"
                name="calendar"
                size={13}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'book' && styles.tabBtnTextActive,
                ]}
              >
                Đặt lịch mới
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('my-consultations')}
              style={[
                styles.tabBtn,
                activeTab === 'my-consultations' && styles.tabBtnActive,
              ]}
            >
              <FontAwesome6
                color={activeTab === 'my-consultations' ? '#FFFFFF' : '#64748B'}
                iconStyle="regular"
                name="calendar-check"
                size={13}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'my-consultations' && styles.tabBtnTextActive,
                ]}
              >
                Lịch của tôi ({myConsultations.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* SƯỜN BÊN NGOÀI ĐỒNG NHẤT: CẢ 2 BÊN ĐỀU NẰM TRONG formCard */}
          {activeTab === 'book' ? (
            bookingResult ? (
              renderBookingSuccess()
            ) : (
              renderBookingFormCard()
            )
          ) : (
            renderMyConsultationsCard()
          )}
        </View>

        <PatientFooter />
      </ScrollView>

      {/* Date Picker Modal (Tương ứng nút 09/06/2026 📅) */}
      <Modal
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setDateModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={dateModalVisible}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setDateModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.dateModalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Chọn Ngày Tư Vấn</Text>
              <TouchableOpacity
                hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                onPress={() => setDateModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <FontAwesome6
                  color="#64748B"
                  iconStyle="solid"
                  name="xmark"
                  size={14}
                />
              </TouchableOpacity>
            </View>

            {/* Quick date choices */}
            <View style={styles.quickDateRow}>
              {[
                { label: 'Hôm nay', offset: 0 },
                { label: 'Ngày mai', offset: 1 },
                { label: 'Sau 3 ngày', offset: 3 },
                { label: 'Tuần sau', offset: 7 },
              ].map(q => {
                const target = new Date();
                target.setDate(target.getDate() + q.offset);
                const y = target.getFullYear();
                const m = String(target.getMonth() + 1).padStart(2, '0');
                const d = String(target.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;
                const isSelected = selectedDate === dateStr;

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    key={q.label}
                    onPress={() => handleSelectCalendarDate(dateStr)}
                    style={[
                      styles.quickDateBtn,
                      isSelected && styles.quickDateBtnSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickDateBtnText,
                        isSelected && styles.quickDateBtnTextSelected,
                      ]}
                    >
                      {q.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Month Year Navigator */}
            <View style={styles.calendarMonthRow}>
              <TouchableOpacity
                onPress={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(y => y - 1);
                  } else {
                    setCalendarMonth(m => m - 1);
                  }
                }}
                style={styles.calNavBtn}
              >
                <FontAwesome6
                  color="#0058bc"
                  iconStyle="solid"
                  name="chevron-left"
                  size={13}
                />
              </TouchableOpacity>

              <Text style={styles.calendarMonthText}>
                Tháng {String(calendarMonth + 1).padStart(2, '0')} /{' '}
                {calendarYear}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(y => y + 1);
                  } else {
                    setCalendarMonth(m => m + 1);
                  }
                }}
                style={styles.calNavBtn}
              >
                <FontAwesome6
                  color="#0058bc"
                  iconStyle="solid"
                  name="chevron-right"
                  size={13}
                />
              </TouchableOpacity>
            </View>

            {/* Days of week header */}
            <View style={styles.calendarWeekRow}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(dn => (
                <Text key={dn} style={styles.calendarWeekText}>
                  {dn}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((item, idx) => {
                if (!item) {
                  return <View key={`empty-${idx}`} style={styles.calDayCell} />;
                }
                const isSelected = selectedDate === item.dateStr;
                const isPast =
                  new Date(item.dateStr).setHours(0, 0, 0, 0) <
                  new Date().setHours(0, 0, 0, 0);

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isPast}
                    key={item.dateStr}
                    onPress={() => handleSelectCalendarDate(item.dateStr)}
                    style={[
                      styles.calDayCell,
                      isSelected && styles.calDayCellSelected,
                      isPast && styles.calDayCellDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isSelected && styles.calDayTextSelected,
                        isPast && styles.calDayTextDisabled,
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Consultation Detail Modal */}
      {selectedConsultation && (
        <Modal
          animationType="fade"
          hardwareAccelerated
          onRequestClose={() => setSelectedConsultation(null)}
          statusBarTranslucent
          transparent
          visible={Boolean(selectedConsultation)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => setSelectedConsultation(null)}
            >
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>
                  Chi Tiết Buổi Tư Vấn
                </Text>
                <TouchableOpacity
                  hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                  onPress={() => setSelectedConsultation(null)}
                  style={styles.modalCloseBtn}
                >
                  <FontAwesome6
                    color="#64748B"
                    iconStyle="solid"
                    name="xmark"
                    size={14}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bác sĩ tư vấn:</Text>
                  <Text style={styles.detailValue}>
                    {selectedConsultation.doctor}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Chuyên khoa:</Text>
                  <Text style={styles.detailValue}>
                    {selectedConsultation.doctorSpecialization ||
                      'Răng Hàm Mặt'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Thời gian hẹn:</Text>
                  <Text style={styles.detailValue}>
                    {selectedConsultation.time}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Thời lượng:</Text>
                  <Text style={styles.detailValue}>
                    {selectedConsultation.duration}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={styles.detailValue}>
                    {selectedConsultation.status === 'CANCELLED'
                      ? 'Đã hủy'
                      : selectedConsultation.status === 'COMPLETED'
                      ? 'Đã hoàn thành'
                      : selectedConsultation.isPaid
                      ? 'Đã thanh toán 100%'
                      : 'Chờ thanh toán'}
                  </Text>
                </View>
                {Boolean(selectedConsultation.notes) && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.detailLabel}>Ghi chú triệu chứng:</Text>
                    <Text style={styles.detailNotesText}>
                      "{selectedConsultation.notes}"
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Payment QR Modal */}
      {paymentModalItem && (
        <Modal
          animationType="fade"
          hardwareAccelerated
          onRequestClose={() => setPaymentModalItem(null)}
          statusBarTranslucent
          transparent
          visible={Boolean(paymentModalItem)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => setPaymentModalItem(null)}
            >
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>
                  Thanh Toán Tư Vấn Trực Tuyến
                </Text>
                <TouchableOpacity
                  hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                  onPress={() => setPaymentModalItem(null)}
                  style={styles.modalCloseBtn}
                >
                  <FontAwesome6
                    color="#64748B"
                    iconStyle="solid"
                    name="xmark"
                    size={14}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <View style={styles.qrInfoBox}>
                  <Text style={styles.qrTitle}>
                    Quét mã VietQR hoặc chuyển khoản:
                  </Text>
                  <View style={styles.qrBankDetails}>
                    <Text style={styles.qrTextRow}>
                      Ngân hàng: <Text style={styles.qrBold}>MB Bank (Quân Đội)</Text>
                    </Text>
                    <Text style={styles.qrTextRow}>
                      Số tài khoản: <Text style={styles.qrBold}>09012345678</Text>
                    </Text>
                    <Text style={styles.qrTextRow}>
                      Chủ tài khoản:{' '}
                      <Text style={styles.qrBold}>NHA KHOA SMART DENTAL</Text>
                    </Text>
                    <Text style={styles.qrTextRow}>
                      Số tiền:{' '}
                      <Text style={[styles.qrBold, { color: '#0058bc' }]}>
                        {paymentModalItem.fee
                          ? formatVnd(paymentModalItem.fee)
                          : '100.000 đ'}
                      </Text>
                    </Text>
                    <Text style={styles.qrTextRow}>
                      Nội dung:{' '}
                      <Text style={[styles.qrBold, { color: '#16A34A' }]}>
                        TV {paymentModalItem.id.slice(0, 8)}
                      </Text>
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => {
                    setPaymentModalItem(null);
                    Alert.alert(
                      'Đã ghi nhận thanh toán',
                      'Hệ thống đang kiểm tra giao dịch chuyển khoản của bạn.',
                    );
                    myConsultationsQuery.refetch();
                  }}
                  style={styles.qrDoneBtn}
                >
                  <Text style={styles.qrDoneBtnText}>Tôi Đã Chuyển Khoản</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  calDayCell: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: '14.28%',
  },
  calDayCellDisabled: {
    opacity: 0.3,
  },
  calDayCellSelected: {
    backgroundColor: '#0058bc',
  },
  calDayText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  calDayTextDisabled: {
    color: '#94A3B8',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calNavBtn: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  calendarMonthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  calendarMonthText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  calendarWeekRow: {
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 6,
    paddingTop: 4,
  },
  calendarWeekText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    width: '14.28%',
  },
  consultActionRightGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  consultCancelBtn: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  consultCancelBtnText: {
    color: '#E11D48',
    fontSize: 11,
    fontWeight: '700',
  },
  consultCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    marginHorizontal: 0,
    padding: 14,
  },
  consultCardFooter: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
  },
  consultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  consultDetailBtn: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  consultDetailBtnText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  consultDoctorName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  consultDoctorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  consultDoctorSpec: {
    color: '#0058bc',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  consultDurationBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  consultDurationText: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '700',
  },
  consultJoinBtn: {
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  consultJoinBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  consultNotesBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    padding: 8,
  },
  consultNotesText: {
    color: '#475569',
    fontSize: 12,
    fontStyle: 'italic',
  },
  consultPayBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  consultPayBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  consultStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  consultStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  consultTimeBold: {
    color: '#0F172A',
    fontWeight: '700',
  },
  consultTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  consultTimeText: {
    color: '#64748B',
    fontSize: 12,
  },
  dateModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  datePickerBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  datePickerBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  detailNotesText: {
    color: '#334155',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  doctorAvatarBox: {
    alignItems: 'center',
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 54,
  },
  doctorAvatarImg: {
    height: '100%',
    width: '100%',
  },
  doctorGridCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    width: '48.2%',
  },
  doctorGridCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0058bc',
  },
  doctorGridExp: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  doctorGridName: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  doctorGridSpec: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  doctorInitialAvatar: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  doctorInitialText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '800',
  },
  doctorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  formContainer: {
    paddingBottom: 0,
  },
  introHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    flex: 1,
  },
  modalBody: {
    padding: 16,
    paddingBottom: 24,
  },
  modalCloseBtn: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 14,
  },
  modalHeaderTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  consultListContainer: {
    gap: 0,
  },
  emptyConsultBookBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 10,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyConsultBookBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  emptyConsultBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  emptyConsultDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'center',
  },
  emptyConsultIconBox: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    marginBottom: 12,
    width: 54,
  },
  emptyConsultTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  myConsultHeaderRow: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
  },
  myConsultHeaderTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  myConsultRefreshBtn: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  myConsultRefreshText: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    minHeight: 70,
    padding: 10,
    textAlignVertical: 'top',
  },
  packageBottomRow: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 15,
    width: '100%',
  },
  packageCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  packageCardSelected: {
    backgroundColor: '#F0F7FF',
    borderColor: '#0058bc',
  },
  packageDesc: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
  },
  packageLabel: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '800',
  },
  packageLabelSelected: {
    color: '#0058bc',
  },
  packagePayNote: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  packagePrice: {
    color: '#0058bc',
    fontSize: 16.5,
    fontWeight: '800',
  },
  packageTag: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
  },
  packageTagSelected: {
    backgroundColor: '#0058bc',
  },
  packageTagText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  packageTagTextSelected: {
    color: '#FFFFFF',
  },
  packagesGrid: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 10,
  },
  pageBtn: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pageBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  pageBtnText: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '700',
  },
  pageBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageInfoText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  policyBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  policyItem: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  policyTitle: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  qrBankDetails: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  qrBold: {
    color: '#0F172A',
    fontWeight: '800',
  },
  qrDoneBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 13,
  },
  qrDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  qrInfoBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  qrTextRow: {
    color: '#475569',
    fontSize: 12,
    paddingVertical: 3,
  },
  qrTitle: {
    color: '#0058bc',
    fontSize: 13,
    fontWeight: '800',
  },
  quickDateBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickDateBtnSelected: {
    backgroundColor: '#0058bc',
  },
  quickDateBtnText: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '700',
  },
  quickDateBtnTextSelected: {
    color: '#FFFFFF',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  slotBtn: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
    width: '31%',
  },
  slotBtnSelected: {
    backgroundColor: '#0058bc',
    borderColor: '#0058bc',
  },
  slotBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  slotBtnTextSelected: {
    color: '#FFFFFF',
  },
  slotEmptyBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: 8,
    padding: 16,
  },
  slotEmptyText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  slotLoadingBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  slotLoadingText: {
    color: '#64748B',
    fontSize: 12,
  },
  retryBtn: {
    alignSelf: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  slotSectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
  },
  statusBadgeCancelled: {
    backgroundColor: '#FFF1F2',
  },
  statusBadgeCompleted: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgePaid: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusTextCancelled: {
    color: '#E11D48',
  },
  statusTextCompleted: {
    color: '#64748B',
  },
  statusTextPaid: {
    color: '#16A34A',
  },
  statusTextPending: {
    color: '#D97706',
  },
  stepHeaderBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepNumberBadge: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  stepNumberText: {
    color: '#0058bc',
    fontSize: 12,
    fontWeight: '800',
  },
  stepSection: {
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  stepTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  stepTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 12,
    justifyContent: 'center',
    minWidth: 150,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  submitSection: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
  },
  submitTotalLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  submitTotalPrice: {
    color: '#0058bc',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  successActions: {
    gap: 10,
    marginTop: 16,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCFCE7',
    borderRadius: 20,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
  },
  successHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  successIconBox: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  successInfoBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 12,
  },
  successInfoRow: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 3,
  },
  successPrimaryBtn: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 12,
    paddingVertical: 12,
  },
  successPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  successSecondaryBtn: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  successSecondaryBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  successSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  successTitle: {
    color: '#15803D',
    fontSize: 15,
    fontWeight: '800',
  },
  tabBtn: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabBtnActive: {
    backgroundColor: '#0058bc',
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabSwitcher: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 6,
  },
});
