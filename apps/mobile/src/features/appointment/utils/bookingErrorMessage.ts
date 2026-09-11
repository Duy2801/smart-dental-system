const bookingErrorMessages: Record<string, string> = {
  'appointment.service_incomplete':
    'Bạn đang có lịch hẹn chưa hoàn tất với phương pháp này. Vui lòng hoàn tất hoặc chọn phương pháp khác.',
  'appointment.doctor_time_conflict':
    'Bác sĩ đã có lịch trong khung giờ này. Vui lòng chọn giờ hoặc bác sĩ khác.',
  'appointment.doctor_time_conflict_video':
    'Bác sĩ đã có lịch tư vấn online trong khung giờ này. Vui lòng chọn giờ khác.',
  'appointment.pending_limit_reached':
    'Bạn đã có quá nhiều lịch đang chờ. Vui lòng kiểm tra lại lịch hẹn hiện tại.',
  'appointment.time_in_past': 'Thời gian đã qua. Vui lòng chọn khung giờ khác.',
  'appointment.patient_overlap':
    'Người khám đã có lịch trùng thời gian. Vui lòng chọn khung giờ khác.',
  'appointment.cancel_deadline_passed':
    'Lịch hẹn đã quá thời hạn tự hủy. Vui lòng liên hệ phòng khám để được hỗ trợ.',
  'doctor.unavailable':
    'Bác sĩ hiện không khả dụng. Vui lòng chọn bác sĩ khác.',
  'service.unavailable':
    'Dịch vụ hoặc phương pháp này hiện chưa khả dụng. Vui lòng chọn lại.',
};

export function getBookingErrorMessage(err: unknown) {
  const anyErr = err as any;
  const rawMessage = anyErr?.response?.data?.message ?? anyErr?.message;
  const code = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  if (typeof code === 'string' && bookingErrorMessages[code]) {
    return bookingErrorMessages[code];
  }

  if (typeof code === 'string' && code.trim()) {
    return code;
  }

  return 'Có lỗi xảy ra khi xử lý lịch hẹn. Vui lòng thử lại.';
}
