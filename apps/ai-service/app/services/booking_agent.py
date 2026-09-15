import logging
import re
import unicodedata
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.core import llm
from app.services.patient_answers import general_answer, privacy_reply, appointment_question, public_topic
from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services.booking_tools import (
    create_patient_profile,
    execute_book_appointment,
    fetch_available_doctors,
    fetch_available_services,
    fetch_booking_options,
    fetch_patient_profiles,
    fetch_user_appointments,
)

logger = logging.getLogger(__name__)

BOOKING_AGENT_SYSTEM = """Ban la Tro ly Nha khoa AI cua Phong Kham Smart Dental.
Neu nguoi dung muon dat lich, phai di theo dung luong:
1. Chon nguoi kham.
2. Chon dich vu.
3. Chon phuong phap dieu tri.
4. Chon ngay kham.
5. Chon khung gio.
6. Chon bac si.
7. Xac nhan dat lich.

Khong tu dat lich khi chua du cac buoc tren. Khong tu chon thay nguoi dung.
Tat ca du lieu lich hen, dich vu, phuong phap, bac si va khung gio phai dua tren du lieu backend."""


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text.lower())
    without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return without_marks.replace("đ", "d").replace("Đ", "d")


def compact_text(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", normalize_text(text)).strip()


def booking_intent(text: str) -> bool:
    """Only returns True when user EXPLICITLY wants to book an appointment or provides booking details."""
    text_norm = normalize_text(text)

    # Check/Inquiry patterns — user is asking to check existing appointments or querying info -> NOT booking intent
    CHECK_PATTERNS = [
        "co lich",
        "lich kham chua",
        "lich kham khong",
        "lich hen chua",
        "lich hen khong",
        "xem lich",
        "kiem tra lich",
        "tra cuu lich",
        "lich cua toi",
        "da co lich",
        "co hen",
        "lich kham hom nay",
        "hom nay co lich",
        "nay co lich",
        "nay toi co",
        "hom nay toi co",
    ]
    if any(pattern in text_norm for pattern in CHECK_PATTERNS):
        return False

    # Explicit booking keywords
    EXPLICIT_BOOKING = [
        "dat lich",
        "muon lich",
        "hen kham",
        "dat lich kham",
        "dat hen",
        "book lich",
        "book appointment",
        "dang ky kham",
        "muon dang ky",
        "toi muon kham",
        "cho toi dat",
        "dat cho toi",
        "dat cho con",
        "dat cho vo",
        "dat cho chong",
        "dat cho me",
        "dat cho ba",
        "dat cho anh",
        "dat cho em",
        "dat cho nguoi than",
        "dat cho nguoi khac",
        "lich cho",
        "dang ky lich",
        "tao ho so",
        "ho so benh nhan",
        "ho so cho be",
        "ho so nguoi than",
    ]
    if any(key in text_norm for key in EXPLICIT_BOOKING):
        return True

    # Detect service/symptom + date/time or patient info combination
    DENTAL_KEYWORDS = [
        "nho rang",
        "tram rang",
        "cao voi",
        "tay trang",
        "nieng rang",
        "boc rang",
        "chua tuy",
        "kham rang",
        "trong rang",
        "nha khoa",
        "rang sua",
        "rang khon",
        "lay cao voi",
        "tieu phau",
    ]
    TIME_PATTERNS = [
        "ngay",
        "gio",
        "h30",
        "h00",
        "sang",
        "chieu",
        "hom nay",
        "ngay mai",
        "1/",
        "2/",
        "3/",
        "4/",
        "5/",
        "6/",
        "7/",
        "8/",
        "9/",
        "10/",
        "11/",
        "12/",
    ]
    has_dental = any(k in text_norm for k in DENTAL_KEYWORDS)
    has_time = any(re.search(r"\b" + re.escape(k) + r"\b", text_norm) for k in ["ngay", "gio", "h30", "h00", "sang", "chieu", "hom nay", "ngay mai"]) or any(k in text_norm for k in ["1/", "2/", "3/", "4/", "5/", "6/", "7/", "8/", "9/", "10/", "11/", "12/"])
    patient_patterns = [r"\btuoi\b", r"\bcon\b", r"\bbe\b", r"\bvo\b", r"\bchong\b", r"\bme\b", r"\bba\b", r"\bcha\b", r"\bbo\b", r"\banh\b", r"\bem\b"]
    has_patient = any(re.search(p, text_norm) for p in patient_patterns)

    if has_dental and (has_time or has_patient):
        return True

    return False


def parse_new_patient_info(text: str) -> Dict[str, Any]:
    info: Dict[str, Any] = {}
    text_norm = normalize_text(text)

    # Extract age (e.g. "6 tuổi", "6t", "be 6t", "be 6 tuoi")
    age_match = re.search(r"\b(\d{1,2})\s*(?:tuoi|t)\b", text_norm)
    if age_match:
        age = int(age_match.group(1))
        info["age"] = age
        birth_year = datetime.now().year - age
        info["dateOfBirth"] = f"{birth_year}-01-01"

    # Extract relationship
    if any(k in text_norm for k in ["con", "be", "chau"]):
        info["relationship"] = "CHILD"
    elif any(k in text_norm for k in ["vo", "chong"]):
        info["relationship"] = "OTHER"
    elif any(k in text_norm for k in ["me", "ba"]):
        info["relationship"] = "MOTHER"
    elif any(k in text_norm for k in ["cha", "bo"]):
        info["relationship"] = "FATHER"
    elif any(k in text_norm for k in ["anh", "em", "nguoi than", "nguoi khac"]):
        info["relationship"] = "OTHER"

    # Extract gender
    if any(k in text_norm for k in ["nam", "trai", "be trai"]):
        info["gender"] = "MALE"
    elif any(k in text_norm for k in ["nu", "gai", "be gai"]):
        info["gender"] = "FEMALE"

    # Extract phone
    phone_match = re.search(r"\b(0\d{9})\b", text)
    if phone_match:
        info["phone"] = phone_match.group(1)

    # Extract name candidate
    name_match = re.search(
        r"(?:be|con|benh nhan|cho|ten|ho ten)\s+([A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜởỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐa-zàáảãạăắcằẳẵặâấầnẩẫậnèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]+(?:\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜởỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐa-zàáảãạăắcằẳẵặâấầnẩẫậnèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]+)*)",
        text,
        re.IGNORECASE,
    )
    if name_match:
        candidate_name = name_match.group(1).strip()
        for prefix in ["be ", "con ", "benh nhan "]:
            if normalize_text(candidate_name).startswith(prefix):
                candidate_name = candidate_name[len(prefix):].strip()
        stop_words = ["nho rang", "sua", "kham", "truoc", "sau", "ngay", "gio", "phut", "tuoi", "muon", "dat lich"]
        candidate_norm = normalize_text(candidate_name)
        if not any(sw in candidate_norm for sw in stop_words) and len(candidate_name) > 1:
            info["fullName"] = candidate_name.title()

    return info


def multi_person_intent(text: str) -> bool:
    """Detect if user wants to book for multiple people at once."""
    text_norm = normalize_text(text)
    multi_keywords = [
        "ca hai",
        "ca nha",
        "nhieu nguoi",
        "2 nguoi",
        "hai nguoi",
        "ba nguoi",
        "3 nguoi",
        "ca gia dinh",
        "voi nhau",
        "cung mot luc",
        "cung nhau",
    ]
    return any(k in text_norm for k in multi_keywords)


def extract_requested_date(text: str) -> Optional[str]:
    today = datetime.now()
    text_norm = normalize_text(text)

    iso_match = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", text)
    if iso_match:
        return iso_match.group(0)

    date_match = re.search(r"\b(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{4}))?\b", text)
    if date_match:
        day = int(date_match.group(1))
        month = int(date_match.group(2))
        year = int(date_match.group(3)) if date_match.group(3) else today.year
        try:
            return datetime(year, month, day).strftime("%Y-%m-%d")
        except ValueError:
            return None

    if "hom nay" in text_norm:
        return today.strftime("%Y-%m-%d")
    if any(key in text_norm for key in ["ngay mai", "sang mai", "chieu mai", "toi mai"]):
        return (today + timedelta(days=1)).strftime("%Y-%m-%d")
    if any(key in text_norm for key in ["ngay kia", "mot ngay kia"]):
        return (today + timedelta(days=2)).strftime("%Y-%m-%d")
    return None


def date_has_passed(date_iso: str) -> bool:
    try:
        selected = datetime.strptime(date_iso, "%Y-%m-%d").date()
    except ValueError:
        return False
    return selected < datetime.now().date()


def extract_time_from_text(text: str) -> Optional[str]:
    text_norm = normalize_text(text)
    match = re.search(r"\b(\d{1,2})(?:[h:](\d{2})?| gio)\b", text_norm)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2)) if match.group(2) else 0
        if 7 <= hour <= 20:
            return f"{hour:02d}:{minute:02d}"
    return None


def format_money(value: Any) -> str:
    try:
        return f"{int(float(value)):,}".replace(",", ".") + " VND"
    except (TypeError, ValueError):
        return "Lien he"


def first_method(service: Dict[str, Any]) -> Dict[str, Any]:
    methods = service.get("treatmentMethods") or []
    return methods[0] if methods else {}


def merge_state(body: ChatRequest) -> Dict[str, Any]:
    state: Dict[str, Any] = {}
    for message in body.history:
        meta = message.metadata or {}
        if isinstance(meta.get("bookingState"), dict):
            state.update(meta["bookingState"])
        for key in [
            "patientId",
            "patientName",
            "serviceId",
            "serviceName",
            "treatmentMethodId",
            "treatmentMethodName",
            "date",
            "time",
            "doctorId",
            "doctorName",
            "confirmBooking",
            "creatingNewPatient",
            "newPatientName",
            "newPatientRelationship",
            "newPatientDob",
            "newPatientGender",
            "newPatientPhone",
            "newPatientAge",
        ]:
            if meta.get(key) is not None:
                state[key] = meta[key]

    current_meta = body.metadata or {}
    if isinstance(current_meta.get("bookingState"), dict):
        state.update(current_meta["bookingState"])
    for key in [
        "patientId",
        "patientName",
        "serviceId",
        "serviceName",
        "treatmentMethodId",
        "treatmentMethodName",
        "date",
        "time",
        "doctorId",
        "doctorName",
        "confirmBooking",
        "creatingNewPatient",
        "newPatientName",
        "newPatientRelationship",
        "newPatientDob",
        "newPatientGender",
        "newPatientPhone",
        "newPatientAge",
    ]:
        if current_meta.get(key) is not None:
            state[key] = current_meta[key]

    if body.patient_id and not state.get("patientId"):
        state["patientId"] = body.patient_id
    if body.patient_name and not state.get("patientName"):
        state["patientName"] = body.patient_name
    return state


def with_state(state: Dict[str, Any], extra: Dict[str, Any]) -> Dict[str, Any]:
    next_state = {**state, **extra}
    return {**extra, "bookingState": next_state}


def patient_suggestions(
    patients: List[Dict[str, Any]],
    state: Dict[str, Any],
) -> List[Dict[str, Any]]:
    suggestions = []
    rel_map = {
        "SELF": "Bản thân",
        "CHILD": "Con/Bé",
        "SPOUSE": "Vợ/Chồng",
        "PARENT": "Cha/Mẹ",
        "FATHER": "Cha",
        "MOTHER": "Mẹ",
        "OTHER": "Người thân",
    }
    for patient in patients:
        if not patient.get("canBook", True):
            continue
        name = patient.get("fullName") or "Người khám"
        relationship = patient.get("relationship") or "PATIENT"
        rel_label = rel_map.get(relationship, relationship)
        label = f"{name} ({rel_label})"
        suggestions.append(
            {
                "type": "patient",
                "label": label,
                "value": f"Đặt lịch cho {name}",
                "metadata": with_state(
                    state,
                    {"patientId": patient.get("id"), "patientName": name, "creatingNewPatient": False},
                ),
            }
        )
    suggestions.append(
        {
            "type": "create_patient",
            "label": "➕ Tạo hồ sơ người thân / bé mới",
            "value": "Tôi muốn tạo hồ sơ mới cho người thân",
            "metadata": with_state(state, {"creatingNewPatient": True}),
        }
    )
    return suggestions


def service_suggestions(
    services: List[Dict[str, Any]],
    state: Dict[str, Any],
) -> List[Dict[str, Any]]:
    suggestions = []
    for service in services[:8]:
        name = service.get("name") or "Dich vu nha khoa"
        suggestions.append(
            {
                "type": "service",
                "label": name,
                "value": f"Toi chon dich vu {name}",
                "metadata": with_state(
                    state,
                    {
                        "serviceId": service.get("id"),
                        "serviceName": name,
                        "treatmentMethodId": None,
                        "treatmentMethodName": None,
                        "date": None,
                        "time": None,
                        "doctorId": None,
                        "doctorName": None,
                    },
                ),
            }
        )
    return suggestions


def method_suggestions(
    service: Dict[str, Any],
    state: Dict[str, Any],
) -> List[Dict[str, Any]]:
    suggestions = []
    for method in service.get("treatmentMethods") or []:
        name = method.get("name") or "Phuong phap dieu tri"
        label = name
        duration = method.get("durationMinutes")
        if duration:
            label = f"{label} - {duration} phut"
        suggestions.append(
            {
                "type": "treatment_method",
                "label": label,
                "value": f"Toi chon phuong phap {name}",
                "metadata": with_state(
                    state,
                    {
                        "treatmentMethodId": method.get("id"),
                        "treatmentMethodName": name,
                        "date": None,
                        "time": None,
                        "doctorId": None,
                        "doctorName": None,
                    },
                ),
            }
        )
    return suggestions



def date_suggestions(
    dates: List[Dict[str, Any]],
    state: Dict[str, Any],
) -> List[Dict[str, Any]]:
    suggestions = []
    for item in dates:
        date_id = item.get("id")
        if not date_id or not item.get("isOpen"):
            continue
        label = f"{item.get('weekday', '')} {item.get('day', '')}/{item.get('month', '')}".strip()
        suggestions.append(
            {
                "type": "date",
                "label": label or date_id,
                "value": f"Toi muon kham ngay {date_id}",
                "metadata": with_state(
                    state,
                    {"date": date_id, "time": None, "doctorId": None, "doctorName": None},
                ),
            }
        )
        if len(suggestions) >= 7:
            break
    return suggestions


def slot_suggestions(
    slots: List[str],
    state: Dict[str, Any],
) -> List[Dict[str, Any]]:
    return [
        {
            "type": "time_slot",
            "label": slot,
            "value": f"Toi chon {slot} ngay {state.get('date')}",
            "metadata": with_state(
                state,
                {"time": slot, "doctorId": None, "doctorName": None},
            ),
        }
        for slot in slots[:8]
    ]


def doctor_suggestions(
    doctors: List[Dict[str, Any]],
    state: Dict[str, Any],
) -> List[Dict[str, Any]]:
    suggestions = []
    for doctor in doctors:
        name = doctor.get("fullName") or doctor.get("name") or doctor.get("user", {}).get("fullName") or "Bac si"
        specialization = doctor.get("specialization")
        label = f"{name} - {specialization}" if specialization else name
        suggestions.append(
            {
                "type": "doctor",
                "label": label,
                "value": f"Toi chon bac si {name}",
                "metadata": with_state(
                    state,
                    {"doctorId": doctor.get("id"), "doctorName": name},
                ),
            }
        )
    return suggestions


def find_by_id(items: List[Dict[str, Any]], item_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if not item_id:
        return None
    return next((item for item in items if item.get("id") == item_id), None)


def token_match(needle: str, haystack: str) -> bool:
    needle_norm = compact_text(needle)
    haystack_norm = compact_text(haystack)
    if not needle_norm:
        return False
    return needle_norm in haystack_norm or haystack_norm in needle_norm


def find_patient_by_text(text: str, patients: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    text_norm = compact_text(text)
    self_words = [
        "cho toi",
        "cho minh",
        "toi kham",
        "minh kham",
        "ban than",
        "chinh toi",
        "chinh chu",
    ]
    if any(word in text_norm for word in self_words):
        primary = next((p for p in patients if p.get("isPrimary") and p.get("canBook", True)), None)
        if primary:
            return primary
        return next((p for p in patients if p.get("relationship") == "SELF" and p.get("canBook", True)), None)

    for patient in patients:
        if not patient.get("canBook", True):
            continue
        names = [patient.get("fullName", ""), patient.get("patientCode", ""), patient.get("phone", "")]
        if any(name and token_match(str(name), text) for name in names):
            return patient
    return None


def find_service_by_text(text: str, services: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    text_norm = normalize_text(text)
    for service in services:
        names = [service.get("name", "")]
        names.extend(method.get("name", "") for method in service.get("treatmentMethods") or [])
        if any(name and normalize_text(name) in text_norm for name in names):
            return service
    return None


def find_method_by_text(text: str, service: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    for method in service.get("treatmentMethods") or []:
        names = [method.get("name", ""), method.get("slug", "")]
        if any(name and token_match(str(name), text) for name in names):
            return method
    return None


def find_doctor_by_text(text: str, doctors: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    text_norm = compact_text(text)
    for doctor in doctors:
        user = doctor.get("user") or {}
        raw_names = [
            doctor.get("fullName", ""),
            doctor.get("name", ""),
            user.get("fullName", ""),
            doctor.get("doctorCode", ""),
        ]
        clean_names = []
        for name in raw_names:
            if not name:
                continue
            clean_names.append(name)
            stripped = re.sub(r"^(?:bs\.?|bác sĩ|dr\.?)\s+", "", str(name), flags=re.IGNORECASE).strip()
            if stripped and stripped != name:
                clean_names.append(stripped)

        for name in clean_names:
            c_norm = compact_text(str(name))
            if not c_norm:
                continue
            if c_norm in text_norm or token_match(c_norm, text):
                return doctor
            parts = c_norm.split()
            if len(parts) >= 2:
                last_two = " ".join(parts[-2:])
                if last_two in text_norm:
                    return doctor
            if len(parts) >= 1:
                last_one = parts[-1]
                if (
                    f"bac si {last_one}" in text_norm
                    or f"bs {last_one}" in text_norm
                    or f"dr {last_one}" in text_norm
                ):
                    return doctor
    return None


def wants_confirmation(text: str) -> bool:
    text_norm = compact_text(text)
    return any(
        word in text_norm
        for word in [
            "xac nhan",
            "dong y",
            "ok",
            "oke",
            "dat di",
            "chot",
            "chot lich",
        ]
    )


def wants_change(text: str, field: str) -> bool:
    text_norm = compact_text(text)
    phrases = {
        "patient": ["chon lai nguoi", "doi nguoi", "dat cho nguoi khac"],
        "service": ["chon lai dich vu", "doi dich vu", "dich vu khac"],
        "method": ["chon lai phuong phap", "doi phuong phap", "goi khac"],
        "date": ["chon lai ngay", "doi ngay", "ngay khac"],
        "time": ["chon lai gio", "doi gio", "gio khac", "khung gio khac"],
        "doctor": ["chon lai bac si", "doi bac si", "bac si khac"],
    }
    return any(phrase in text_norm for phrase in phrases.get(field, []))


def error_reply(error: str) -> str:
    messages = {
        "auth.login_required": "Quý khách vui lòng đăng nhập để đặt lịch khám.",
        "patient.required": "Quý khách vui lòng chọn người khám trước khi đặt lịch.",
        "doctor.required": "Quý khách vui lòng chọn bác sĩ trước khi đặt lịch.",
        "treatment_method.required": "Quý khách vui lòng chọn phương pháp điều trị.",
        "appointment.patient_time_conflict": "Người khám này đã có lịch trùng khung giờ. Quý khách vui lòng chọn khung giờ khác, hoặc chọn người khám khác nếu đặt cho người thân.",
        "appointment.doctor_time_conflict": "Bác sĩ vừa chọn đã có lịch ở khung giờ này. Quý khách vui lòng chọn bác sĩ hoặc khung giờ khác.",
        "appointment.doctor_time_conflict_video": "Bác sĩ vừa chọn có lịch tư vấn online trùng khung giờ này. Quý khách vui lòng chọn bác sĩ hoặc khung giờ khác.",
        "appointment.time_in_past": "Thời gian khám đã qua. Quý khách vui lòng chọn ngày giờ sắp tới.",
        "appointment.service_incomplete": "Người khám này đã có lịch cho dịch vụ/phương pháp này chưa hoàn tất. Quý khách vui lòng hoàn tất lịch hiện có trước khi đặt tiếp.",
        "appointment.pending_limit_reached": "Người khám này đã có tối đa 3 lịch đang chờ xác nhận. Quý khách vui lòng hủy/bớt lịch chờ, hoàn tất lịch hiện có, hoặc chọn người khám khác.",
        "appointment.seven_day_limit_reached": "Người khám này đã đặt tối đa 5 lịch trong 7 ngày. Quý khách vui lòng chọn thời gian xa hơn hoặc liên hệ lễ tân.",
        "appointment.online_booking_blocked": "Tài khoản này đang bị chặn đặt lịch online do có nhiều lần vắng mặt. Quý khách vui lòng liên hệ lễ tân để được hỗ trợ.",
        "doctor.service_not_supported": "Bác sĩ vừa chọn không phụ trách dịch vụ này. Quý khách vui lòng chọn bác sĩ khác.",
        "doctor.not_available_at_selected_time": "Bác sĩ vừa chọn không làm việc trong khung giờ này. Quý khách vui lòng chọn bác sĩ hoặc khung giờ khác.",
        "clinic.closed_at_selected_time": "Phòng khám không làm việc trong khung giờ vừa chọn. Quý khách vui lòng chọn giờ khác.",
        "doctor.unavailable": "Bác sĩ vừa chọn hiện không khả dụng. Quý khách vui lòng chọn bác sĩ khác.",
        "service.unavailable": "Dịch vụ hoặc phương pháp điều trị vừa chọn hiện không khả dụng.",
        "patient.booking_permission_denied": "Tài khoản của quý khách không có quyền đặt lịch cho hồ sơ bệnh nhân này.",
    }
    return messages.get(error, "Mình chưa xác định được kết quả đặt lịch. Bạn vui lòng kiểm tra Lịch hẹn của tôi trước khi thử đặt lại.")


def _booking_completed_in_history(history) -> bool:
    """Check if last assistant message indicates a completed booking."""
    for msg in reversed(history):
        if msg.role == "assistant":
            content = normalize_text(msg.content or "")
            success_markers = [
                "dat lich thanh cong",
                "dat lich hen thanh cong",
                "xac nhan dat lich",
                "lich kham cua quy khach da duoc giu thanh cong",
            ]
            return any(marker in content for marker in success_markers)
    return False


def is_new_booking_intent(text: str) -> bool:
    norm = normalize_text(text)
    phrases = [
        "dat them lich",
        "dat lich them",
        "dat lich moi",
        "tao lich moi",
        "dat them",
        "dat lai",
        "muon dat them",
        "muon dat lai",
        "toi muon dat lich tiep",
        "dat lich tiep",
    ]
    return any(phrase in norm for phrase in phrases)


def is_general_inquiry(text: str) -> bool:
    norm = normalize_text(text)
    inquiry_keywords = [
        "cho toi biet",
        "cho toi hoi",
        "cho minh hoi",
        "tu van",
        "thong tin ve",
        "bac si nao",
        "gia bao nhieu",
        "bang gia",
        "dia chi",
        "gio lam viec",
        "co tot khong",
        "quy trinh",
        "nhu the nao",
        "co dau khong",
        "chuyen nho rang khon",
        "bac si chuyen",
        "thong tin bac si",
        "danh sach bac si",
        "danh sach dich vu",
        "co cac dich vu",
        "co nhung dich vu",
        "co dich vu nao",
        "dich vu nao",
        "dich vu gi",
        "cac dich vu",
        "co nhung bac si",
        "tu van giup",
        "gioi thieu",
        "tim hieu ve",
        "la ai",
        "gom nhung ai",
    ]
    return any(k in norm for k in inquiry_keywords)


class BookingAgent:
    async def process_chat(self, body: ChatRequest) -> ChatResponse:
        user_msg = body.message.strip()
        user_norm = normalize_text(user_msg)
        blocked = privacy_reply(user_msg)
        if blocked:
            return blocked
        if appointment_question(user_msg):
            return await self.answer_general_question(body, [], [])

        # --- Detect multi-person booking intent and reject early ---
        if multi_person_intent(user_msg):
            return ChatResponse(
                reply="Hi\u1ec7n t\u1ea1i h\u1ec7 th\u1ed1ng ch\u1ec9 h\u1ed7 tr\u1ee3 \u0111\u1eb7t l\u1ecbch cho t\u1eebng ng\u01b0\u1eddi m\u1ed9t. Qu\u00fd kh\u00e1ch vui l\u00f2ng ch\u1ecdn ng\u01b0\u1eddi c\u1ea7n kh\u00e1m tr\u01b0\u1edbc nh\u00e9!",
                should_book=False,
                suggestions=[
                    {"type": "quick_reply", "label": "\u0110\u1eb7t l\u1ecbch cho t\u00f4i", "value": "\u0110\u1eb7t l\u1ecbch cho t\u00f4i", "metadata": {}},
                    {"type": "quick_reply", "label": "\u0110\u1eb7t l\u1ecbch cho ng\u01b0\u1eddi th\u00e2n", "value": "\u0110\u1eb7t l\u1ecbch cho ng\u01b0\u1eddi th\u00e2n", "metadata": {}},
                ],
            )

        # --- After a completed booking, user wants to book again: reset state fully ---
        just_completed = _booking_completed_in_history(body.history)
        starts_fresh_booking = is_new_booking_intent(user_msg) or (
            just_completed and booking_intent(user_msg)
        )
        if just_completed or starts_fresh_booking:
            # Ignore stale metadata from the previous completed booking.
            state: Dict[str, Any] = {}
        else:
            state = merge_state(body)

        # Disambiguate General Inquiry vs Booking Intent
        is_inquiry = is_general_inquiry(user_msg)

        # Booking is in progress ONLY when active booking parameters are set (not just patientId alone)
        booking_in_progress = bool(
            state.get("creatingNewPatient")
            or state.get("serviceId")
            or state.get("treatmentMethodId")
            or (state.get("date") and state.get("time"))
            or state.get("confirmBooking")
        )

        if is_inquiry:
            wants_booking = False
        else:
            wants_booking = booking_intent(user_msg) or starts_fresh_booking or booking_in_progress

        if not wants_booking:
            topic = public_topic(user_msg)
            services = await fetch_available_services() if topic == 'services' else []
            doctors = await fetch_available_doctors() if topic == 'doctors' else []
            return await self.answer_general_question(body, services, doctors)
        services = await fetch_available_services()
        doctors = await fetch_available_doctors()
        patients = await fetch_patient_profiles(body.created_by_user_id)

        if wants_change(user_msg, "patient"):
            state = {}
        elif wants_change(user_msg, "service"):
            state.update(
                {
                    "serviceId": None,
                    "serviceName": None,
                    "treatmentMethodId": None,
                    "treatmentMethodName": None,
                    "date": None,
                    "time": None,
                    "doctorId": None,
                    "doctorName": None,
                    "confirmBooking": None,
                }
            )
        elif wants_change(user_msg, "method"):
            state.update(
                {
                    "treatmentMethodId": None,
                    "treatmentMethodName": None,
                    "date": None,
                    "time": None,
                    "doctorId": None,
                    "doctorName": None,
                    "confirmBooking": None,
                }
            )
        elif wants_change(user_msg, "date"):
            state.update({"date": None, "time": None, "doctorId": None, "doctorName": None, "confirmBooking": None})
        elif wants_change(user_msg, "time"):
            state.update({"time": None, "doctorId": None, "doctorName": None, "confirmBooking": None})
        elif wants_change(user_msg, "doctor"):
            state.update({"doctorId": None, "doctorName": None, "confirmBooking": None})

        # Detect booking for someone else or creation of a new patient profile
        user_norm = normalize_text(user_msg)

        if starts_fresh_booking:
            state = {}

        wants_book_for_other = any(
            k in user_norm
            for k in [
                "dat cho con",
                "dat cho vo",
                "dat cho chong",
                "dat cho me",
                "dat cho ba",
                "dat cho cha",
                "dat cho anh",
                "dat cho em",
                "dat cho nguoi than",
                "dat cho nguoi khac",
                "lich cho con",
                "lich cho nguoi",
                "cho be",
                "cho con",
            ]
        )

        wants_book_for_self = any(
            k in user_norm
            for k in [
                "dat cho toi",
                "dat cho minh",
                "cho toi",
                "cho minh",
                "toi dat",
                "minh dat",
                "toi muon dat",
                "minh muon dat",
                "toi muon kham",
                "minh muon kham",
                "dat cho ban than",
                "ban than",
            ]
        )

        if wants_book_for_self and not wants_book_for_other:
            state["creatingNewPatient"] = False
            for k in ["newPatientName", "newPatientAge", "newPatientDob", "newPatientPhone", "newPatientRelationship"]:
                state.pop(k, None)

        # Parse any new patient info supplied in message
        parsed_patient = parse_new_patient_info(user_msg)
        if not wants_book_for_self:
            if parsed_patient.get("age"):
                state["newPatientAge"] = parsed_patient["age"]
            if parsed_patient.get("dateOfBirth"):
                state["newPatientDob"] = parsed_patient["dateOfBirth"]
            if parsed_patient.get("relationship"):
                state["newPatientRelationship"] = parsed_patient["relationship"]
            if parsed_patient.get("gender"):
                state["newPatientGender"] = parsed_patient["gender"]
            if parsed_patient.get("phone"):
                state["newPatientPhone"] = parsed_patient["phone"]
            if parsed_patient.get("fullName"):
                state["newPatientName"] = parsed_patient["fullName"]

            wants_book_for_other = (
                wants_book_for_other
                or bool(parsed_patient.get("age"))
                or bool(parsed_patient.get("relationship"))
            )

        # If agent is in creatingNewPatient state, check if user simply typed a full name (e.g. "Bé Ti", "Nguyễn Văn A")
        typed_patient = find_patient_by_text(user_msg, patients)
        if state.get("creatingNewPatient") and not state.get("newPatientName") and not typed_patient:
            if len(user_msg.split()) <= 4 and not booking_intent(user_msg):
                state["newPatientName"] = user_msg.strip().title()

        # If user explicitly selected or mentioned an existing patient:
        if typed_patient and not state.get("patientId"):
            state.update(
                {
                    "patientId": typed_patient.get("id"),
                    "patientName": typed_patient.get("fullName") or typed_patient.get("patientCode"),
                    "creatingNewPatient": False,
                }
            )

        # If user explicitly wants to book for self, auto-select primary patient profile
        if wants_book_for_self and not wants_book_for_other and not state.get("patientId") and patients:
            self_p = next((p for p in patients if p.get("isPrimary") or p.get("relationship") == "SELF"), None) or patients[0]
            state.update(
                {
                    "patientId": self_p.get("id"),
                    "patientName": self_p.get("fullName") or self_p.get("patientCode"),
                    "creatingNewPatient": False,
                }
            )

        # Attempt patient profile creation if we have newPatientName
        if state.get("newPatientName") and body.created_by_user_id and not state.get("patientId"):
            res_patient = await create_patient_profile(
                user_id=body.created_by_user_id,
                full_name=state["newPatientName"],
                date_of_birth=state.get("newPatientDob"),
                gender=state.get("newPatientGender"),
                phone=state.get("newPatientPhone"),
                relationship=state.get("newPatientRelationship", "CHILD"),
            )
            if isinstance(res_patient, dict) and res_patient.get("id"):
                state["patientId"] = res_patient["id"]
                state["patientName"] = res_patient.get("fullName", state["newPatientName"])
                state["creatingNewPatient"] = False
                patients = await fetch_patient_profiles(body.created_by_user_id)
            elif isinstance(res_patient, dict) and res_patient.get("error"):
                return ChatResponse(
                    reply="Chưa thể xác nhận việc tạo hồ sơ cho người thân. Bạn vui lòng kiểm tra danh sách hồ sơ trước khi thử lại.",
                    should_book=True,
                    suggestions=patient_suggestions(patients, state),
                )

        # Early Doctor extraction from text
        typed_doctor = find_doctor_by_text(user_msg, doctors)
        if typed_doctor and not state.get("doctorId"):
            doc_name = (
                typed_doctor.get("fullName")
                or typed_doctor.get("name")
                or (typed_doctor.get("user") or {}).get("fullName")
            )
            state["doctorId"] = typed_doctor.get("id")
            state["doctorName"] = doc_name

        typed_service = find_service_by_text(user_msg, services)
        if typed_service and not state.get("serviceId"):
            state.update(
                {
                    "serviceId": typed_service.get("id"),
                    "serviceName": typed_service.get("name"),
                    "treatmentMethodId": None,
                    "treatmentMethodName": None,
                    "date": None,
                    "time": None,
                }
            )

        typed_date = extract_requested_date(user_msg)
        if typed_date:
            state.update({"date": typed_date, "time": None})

        typed_time = extract_time_from_text(user_msg)
        if typed_time:
            state.update({"time": typed_time})

        if not wants_booking:
            return await self.answer_general_question(body, services, doctors)

        if not body.created_by_user_id:
            return ChatResponse(
                reply="Để đặt lịch khám trên hệ thống, quý khách vui lòng đăng nhập tài khoản bệnh nhân trước ạ. Mình vẫn có thể tư vấn dịch vụ và bảng giá nếu quý khách cần.",
                should_book=True,
                suggestions=service_suggestions(services, state)[:4],
            )

        if not state.get("patientId"):
            primary_pat = next(
                (p for p in patients if p.get("isPrimary") or p.get("relationship") == "SELF"),
                patients[0] if patients else None,
            )
            if (
                wants_book_for_self
                or len(patients) == 1
                or (primary_pat and not wants_book_for_other)
            ) and not wants_book_for_other and not state.get("creatingNewPatient"):
                if primary_pat:
                    state["patientId"] = primary_pat.get("id")
                    state["patientName"] = primary_pat.get("fullName") or primary_pat.get("patientCode")
            elif state.get("creatingNewPatient") or wants_book_for_other:
                state["creatingNewPatient"] = True
                rel_title = "bé" if state.get("newPatientRelationship") == "CHILD" else "người thân"
                info_notes = []
                if state.get("newPatientAge"):
                    info_notes.append(f"tuổi: {state['newPatientAge']}")
                if state.get("newPatientPhone"):
                    info_notes.append(f"SĐT: {state['newPatientPhone']}")
                note_str = f" ({', '.join(info_notes)})" if info_notes else ""
                return ChatResponse(
                    reply=f"Dạ, mình đã ghi nhận nhu cầu đặt lịch cho {rel_title}{note_str}. Quý khách vui lòng cung cấp **Họ và tên đầy đủ** của {rel_title} (kèm theo Số điện thoại hoặc Tuổi/Ngày sinh nếu có) để hệ thống tạo hồ sơ bệnh nhân trước khi tiến hành các bước đặt lịch nhé ạ! (Ví dụ: Nguyễn Văn An - 0912345678)",
                    should_book=True,
                    suggestions=[],
                    metadata=with_state(state, {"creatingNewPatient": True}),
                )
            else:
                suggestions = patient_suggestions(patients, state)
                return ChatResponse(
                    reply="Dạ, quý khách muốn đặt lịch cho mình hay cho người thân/bé ạ?",
                    should_book=True,
                    suggestions=suggestions,
                    metadata=with_state(state, {}),
                )

        if not state.get("serviceId"):
            if not services:
                return ChatResponse(
                    reply="Dạ, hiện tại mình chưa tải được danh sách dịch vụ từ hệ thống. Quý khách vui lòng thử lại sau ít phút ạ.",
                    should_book=True,
                    suggestions=[],
                    metadata=with_state(state, {}),
                )
            doc_info = f" với {state.get('doctorName')}" if state.get("doctorName") else ""
            reply_text = f"Dạ, mình đã ghi nhận nhu cầu đặt lịch{doc_info} 🩺. Quý khách muốn chọn dịch vụ nha khoa nào ạ?"
            return ChatResponse(
                reply=reply_text,
                should_book=True,
                suggestions=service_suggestions(services, state),
                metadata=with_state(state, {}),
            )

        selected_service = find_by_id(services, state.get("serviceId"))
        if not selected_service:
            state.pop("serviceId", None)
            return ChatResponse(
                reply="Dịch vụ vừa chọn hiện không khả dụng. Quý khách vui lòng chọn lại dịch vụ khám ạ.",
                should_book=True,
                suggestions=service_suggestions(services, state),
                metadata=with_state(state, {}),
            )

        typed_method = find_method_by_text(user_msg, selected_service)
        if typed_method and not state.get("treatmentMethodId"):
            state.update(
                {
                    "treatmentMethodId": typed_method.get("id"),
                    "treatmentMethodName": typed_method.get("name"),
                    "date": None,
                    "time": None,
                    "confirmBooking": None,
                }
            )

        if not state.get("treatmentMethodId"):
            methods = selected_service.get("treatmentMethods") or []
            if len(methods) == 1:
                state.update(
                    {
                        "treatmentMethodId": methods[0].get("id"),
                        "treatmentMethodName": methods[0].get("name"),
                    }
                )
            else:
                suggestions = method_suggestions(selected_service, state)
                return ChatResponse(
                    reply=f"Dạ, với dịch vụ **{selected_service.get('name')}**, quý khách muốn chọn phương pháp điều trị nào ạ?",
                    should_book=True,
                    suggestions=suggestions,
                    metadata=with_state(state, {}),
                )

        if not state.get("date"):
            options = await fetch_booking_options(
                service_id=state.get("serviceId"),
                treatment_method_id=state.get("treatmentMethodId"),
            )
            suggestions = date_suggestions(options.get("dates") or [], state)
            srv_name = selected_service.get("name") if selected_service else ""
            doc_name = f" cùng {state.get('doctorName')}" if state.get("doctorName") else ""
            return ChatResponse(
                reply=f"Dạ, mình đã lưu dịch vụ **{srv_name}**{doc_name}. Quý khách mong muốn khám vào ngày nào ạ?",
                should_book=True,
                suggestions=suggestions,
                metadata=with_state(state, {}),
            )

        if date_has_passed(str(state.get("date"))):
            state.update({"date": None, "time": None, "confirmBooking": None})
            options = await fetch_booking_options(
                service_id=state.get("serviceId"),
                treatment_method_id=state.get("treatmentMethodId"),
            )
            return ChatResponse(
                reply="Dạ, ngày vừa chọn đã qua. Quý khách vui lòng chọn một ngày sắp tới còn lịch trống nhé ạ.",
                should_book=True,
                suggestions=date_suggestions(options.get("dates") or [], state),
                metadata=with_state(state, {}),
            )

        if not state.get("time"):
            options = await fetch_booking_options(
                service_id=state.get("serviceId"),
                treatment_method_id=state.get("treatmentMethodId"),
                date=state.get("date"),
            )
            slots = options.get("timeSlots") or []
            if not slots:
                return ChatResponse(
                    reply=f"Dạ, ngày {state.get('date')} hiện không còn khung giờ trống theo lịch phòng khám. Quý khách chọn ngày khác giúp mình nhé ạ.",
                    should_book=True,
                    suggestions=date_suggestions(options.get("dates") or [], state),
                    metadata=with_state(state, {}),
                )
            return ChatResponse(
                reply=f"Dạ, ngày **{state.get('date')}** còn các khung giờ trống sau. Quý khách chọn thời gian phù hợp nhất ạ:",
                should_book=True,
                suggestions=slot_suggestions(slots, state),
                metadata=with_state(state, {}),
            )

        options = await fetch_booking_options(
            service_id=state.get("serviceId"),
            treatment_method_id=state.get("treatmentMethodId"),
            date=state.get("date"),
            time=state.get("time"),
        )
        slots = options.get("timeSlots") or []
        if state.get("time") not in slots:
            state.update({"time": None, "doctorId": None, "doctorName": None})
            return ChatResponse(
                reply="Khung giờ vừa chọn không còn khả dụng theo lịch mới nhất. Quý khách vui lòng chọn khung giờ khác ạ.",
                should_book=True,
                suggestions=slot_suggestions(slots, state),
                metadata=with_state(state, {}),
            )

        available_doctors = options.get("doctors") or []
        typed_doctor = find_doctor_by_text(user_msg, available_doctors)
        if typed_doctor and not state.get("doctorId"):
            doctor_name = (
                typed_doctor.get("fullName")
                or typed_doctor.get("name")
                or typed_doctor.get("user", {}).get("fullName")
                or "Bác sĩ"
            )
            state.update({"doctorId": typed_doctor.get("id"), "doctorName": doctor_name})

        if not state.get("doctorId"):
            return ChatResponse(
                reply="Quý khách muốn khám với bác sĩ nào trong khung giờ này ạ?",
                should_book=True,
                suggestions=doctor_suggestions(available_doctors, state),
                metadata=with_state(state, {}),
            )

        if not any(doctor.get("id") == state.get("doctorId") for doctor in available_doctors):
            state.update({"doctorId": None, "doctorName": None})
            return ChatResponse(
                reply="Bác sĩ vừa chọn không còn khả dụng ở khung giờ này. Quý khách vui lòng chọn bác sĩ khác ạ.",
                should_book=True,
                suggestions=doctor_suggestions(available_doctors, state),
                metadata=with_state(state, {}),
            )

        if wants_confirmation(user_msg):
            state["confirmBooking"] = True

        if not state.get("confirmBooking"):
            patient_name = state.get("patientName") or "Người khám đã chọn"
            service_name = state.get("serviceName") or selected_service.get("name")
            method_name = state.get("treatmentMethodName") or "Phương pháp đã chọn"
            doctor_name = state.get("doctorName") or "Bác sĩ đã chọn"
            summary = (
                "Mình đã có đủ thông tin đặt lịch:\n"
                f"- Người khám: {patient_name}\n"
                f"- Dịch vụ: {service_name}\n"
                f"- Phương pháp: {method_name}\n"
                f"- Thời gian: {state.get('time')} ngày {state.get('date')}\n"
                f"- Bác sĩ: {doctor_name}\n"
                "Quý khách xác nhận đặt lịch này không ạ?"
            )
            return ChatResponse(
                reply=summary,
                should_book=True,
                suggestions=[
                    {
                        "type": "confirm_booking",
                        "label": "Xác nhận đặt lịch",
                        "value": "Tôi xác nhận đặt lịch",
                        "metadata": with_state(state, {"confirmBooking": True}),
                    },
                    {
                        "type": "quick_reply",
                        "label": "Chọn lại giờ",
                        "value": "Tôi muốn chọn lại giờ",
                        "metadata": with_state(state, {"time": None, "doctorId": None, "doctorName": None}),
                    },
                    {
                        "type": "quick_reply",
                        "label": "Chọn lại dịch vụ",
                        "value": "Tôi muốn chọn lại dịch vụ",
                        "metadata": with_state(
                            state,
                            {
                                "serviceId": None,
                                "serviceName": None,
                                "treatmentMethodId": None,
                                "treatmentMethodName": None,
                                "date": None,
                                "time": None,
                                "doctorId": None,
                                "doctorName": None,
                            },
                        ),
                    },
                ],
            )

        booking_res = await execute_book_appointment(
            created_by_user_id=body.created_by_user_id,
            patient_id=state.get("patientId"),
            doctor_id=state.get("doctorId"),
            treatment_method_id=state.get("treatmentMethodId"),
            scheduled_at=datetime.fromisoformat(
                f"{state.get('date')}T{state.get('time')}:00"
            ).isoformat(),
            notes=user_msg,
            patient_name=state.get("patientName"),
        )

        # Backend returns appointment object on success (has 'id' field), not {success: True}
        booking_success = (
            booking_res.get("success") is True
            or ("id" in booking_res and not booking_res.get("error"))
        )

        if booking_success:
            def _clean_str(val: Any) -> str:
                if isinstance(val, str):
                    return val
                if isinstance(val, dict):
                    return val.get("name") or val.get("fullName") or val.get("title") or ""
                return ""

            appt_code = (
                _clean_str(booking_res.get("appointmentCode"))
                or _clean_str(booking_res.get("id"))[:8].upper()
                or "SUCCESS"
            )
            patient_name = (
                _clean_str(booking_res.get("patientName"))
                or _clean_str(booking_res.get("patient"))
                or _clean_str(state.get("patientName"))
                or "Quý khách"
            )
            doctor_name = (
                _clean_str(booking_res.get("doctorName"))
                or _clean_str(booking_res.get("doctor"))
                or _clean_str(state.get("doctorName"))
                or "Bác sĩ đã chọn"
            )
            service_name = (
                _clean_str(booking_res.get("serviceName"))
                or _clean_str(booking_res.get("service"))
                or _clean_str(booking_res.get("treatmentMethod"))
                or _clean_str(state.get("treatmentMethodName"))
                or _clean_str(state.get("serviceName"))
                or "Khám nha khoa"
            )
            return ChatResponse(
                reply=(
                    f"🎉 **Xác nhận đặt lịch hẹn thành công!** ✅\n\n"
                    f"• **Mã lịch hẹn:** #{appt_code}\n"
                    f"• **Bệnh nhân:** {patient_name}\n"
                    f"• **Dịch vụ / Gói khám:** {service_name}\n"
                    f"• **Bác sĩ phụ trách:** {doctor_name}\n"
                    f"• **Thời gian hẹn:** {state.get('time')} - ngày {state.get('date')}\n"
                    f"• **Hình thức thanh toán:** Thanh toán trực tiếp tại quầy khi đến khám\n\n"
                    f"Lịch khám của quý khách đã được giữ thành công trên hệ thống Smart Dental!"
                ),
                should_book=False,
                suggestions=[
                    {
                        "type": "quick_reply",
                        "label": "Đặt lịch thêm",
                        "value": "Tôi muốn đặt thêm lịch",
                        "metadata": {},
                    },
                ],
                disclaimer="Vui lòng đến trước 10-15 phút để làm thủ tục tiếp đón tại quầy.",
            )

        return ChatResponse(
            reply=error_reply(str(booking_res.get("error", "lỗi không xác định"))),
            should_book=True,
            suggestions=slot_suggestions(slots, {**state, "time": None, "doctorId": None, "doctorName": None}),
        )

    async def answer_general_question(
        self,
        body: ChatRequest,
        services: List[Dict[str, Any]],
        doctors: List[Dict[str, Any]],
    ) -> ChatResponse:
        return await general_answer(body, services, doctors, fetch_user_appointments)
