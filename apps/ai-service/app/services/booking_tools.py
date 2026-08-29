import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


def unwrap_backend_data(data: Any) -> Any:
    if isinstance(data, dict) and "data" in data:
        return data["data"]
    return data


async def fetch_available_services() -> List[Dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.backend_base_url}/chatbot-conversations/internal/services"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url, headers={"x-api-key": settings.ai_service_api_key})
            res.raise_for_status()
            data = unwrap_backend_data(res.json())
            return data if isinstance(data, list) else []
    except Exception as err:
        logger.error(f"[booking_tools] fetch_available_services error: {err}")
        return []


async def fetch_patient_profiles(user_id: Optional[str]) -> List[Dict[str, Any]]:
    if not user_id:
        return []

    settings = get_settings()
    url = f"{settings.backend_base_url}/chatbot-conversations/internal/patients"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                url,
                params={"userId": user_id},
                headers={"x-api-key": settings.ai_service_api_key},
            )
            res.raise_for_status()
            data = unwrap_backend_data(res.json())
            return data if isinstance(data, list) else []
    except Exception as err:
        logger.error(f"[booking_tools] fetch_patient_profiles error: {err}")
        return []


async def fetch_user_appointments(user_id: Optional[str]) -> List[Dict[str, Any]]:
    if not user_id:
        return []

    settings = get_settings()
    url = f"{settings.backend_base_url}/chatbot-conversations/internal/appointments"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                url,
                params={"userId": user_id},
                headers={"x-api-key": settings.ai_service_api_key},
            )
            res.raise_for_status()
            data = unwrap_backend_data(res.json())
            return data if isinstance(data, list) else []
    except Exception as err:
        logger.error(f"[booking_tools] fetch_user_appointments error: {err}")
        return []


async def fetch_booking_options(
    service_id: Optional[str] = None,
    treatment_method_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date: Optional[str] = None,
    time: Optional[str] = None,
) -> Dict[str, Any]:
    settings = get_settings()
    url = f"{settings.backend_base_url}/appointments/booking-options"
    params = {}
    if service_id:
        params["serviceId"] = service_id
    if treatment_method_id:
        params["treatmentMethodId"] = treatment_method_id
    if doctor_id:
        params["doctorId"] = doctor_id
    if date:
        params["date"] = date
    if time:
        params["time"] = time

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                url,
                params=params,
                headers={"x-api-key": settings.ai_service_api_key},
            )
            res.raise_for_status()
            data = unwrap_backend_data(res.json())
            return data if isinstance(data, dict) else {}
    except Exception as err:
        logger.error(f"[booking_tools] fetch_booking_options error: {err}")
        return {}


async def fetch_available_doctors() -> List[Dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.backend_base_url}/chatbot-conversations/internal/doctors"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url, headers={"x-api-key": settings.ai_service_api_key})
            res.raise_for_status()
            data = unwrap_backend_data(res.json())
            return data if isinstance(data, list) else []
    except Exception as err:
        logger.error(f"[booking_tools] fetch_available_doctors error: {err}")
        return []


async def check_available_slots(
    date: str,
    doctor_id: Optional[str] = None,
    service_id: Optional[str] = None,
) -> Dict[str, Any]:
    settings = get_settings()
    url = f"{settings.backend_base_url}/chatbot-conversations/internal/slots"
    params = {"date": date}
    if doctor_id:
        params["doctorId"] = doctor_id
    if service_id:
        params["serviceId"] = service_id

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                url,
                params=params,
                headers={"x-api-key": settings.ai_service_api_key},
            )
            res.raise_for_status()
            data = unwrap_backend_data(res.json())
            if not isinstance(data, dict):
                return {"date": date, "available_slots": [], "dates": [], "doctors": []}

            raw_slots = data.get("timeSlots", [])
            open_slots = [
                slot["time"] if isinstance(slot, dict) else str(slot)
                for slot in raw_slots
                if (isinstance(slot, dict) and slot.get("available", True))
                or isinstance(slot, str)
            ]
            return {
                "date": date,
                "available_slots": open_slots[:6],
                "dates": data.get("dates", []),
                "selectedDateId": data.get("selectedDateId"),
                "doctors": data.get("doctors", []),
            }
    except Exception as err:
        logger.error(f"[booking_tools] check_available_slots error: {err}")
        return {"date": date, "available_slots": [], "dates": [], "doctors": []}


async def execute_book_appointment(
    created_by_user_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    treatment_method_id: Optional[str] = None,
    scheduled_at: str = "",
    notes: Optional[str] = None,
    patient_name: Optional[str] = None,
    patient_phone: Optional[str] = None,
) -> Dict[str, Any]:
    settings = get_settings()
    url = f"{settings.backend_base_url}/chatbot-conversations/internal/book"
    payload = {
        "createdByUserId": created_by_user_id,
        "patientId": patient_id,
        "doctorId": doctor_id,
        "treatmentMethodId": treatment_method_id,
        "scheduledAt": scheduled_at,
        "notes": notes,
        "patientName": patient_name,
        "patientPhone": patient_phone,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(
                url,
                json=payload,
                headers={"x-api-key": settings.ai_service_api_key},
            )
            if res.status_code in (200, 201):
                data = unwrap_backend_data(res.json())
                return data if isinstance(data, dict) else {}
            try:
                error_data = res.json()
                error_message = error_data.get("message") or error_data.get("error")
            except Exception:
                error_message = res.text
            logger.error(f"[booking_tools] book error HTTP {res.status_code}: {error_message}")
            return {"success": False, "error": error_message or f"HTTP {res.status_code}"}
    except Exception as err:
        logger.error(f"[booking_tools] execute_book_appointment error: {err}")
        return {"success": False, "error": str(err)}


async def create_patient_profile(
    user_id: str,
    full_name: str,
    date_of_birth: Optional[str] = None,
    gender: Optional[str] = None,
    phone: Optional[str] = None,
    relationship: str = "CHILD",
) -> Dict[str, Any]:
    """Tạo hồ sơ bệnh nhân người thân (con, vợ, chồng...) cho user."""
    settings = get_settings()
    url = f"{settings.backend_base_url}/chatbot-conversations/internal/patients"
    payload: Dict[str, Any] = {
        "userId": user_id,
        "fullName": full_name,
        "relationship": relationship,
    }
    if date_of_birth:
        payload["dateOfBirth"] = date_of_birth
    if gender:
        payload["gender"] = gender
    if phone:
        payload["phone"] = phone

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.post(
                url,
                json=payload,
                headers={"x-api-key": settings.ai_service_api_key},
            )
            if res.status_code in (200, 201):
                data = unwrap_backend_data(res.json())
                return data if isinstance(data, dict) else {}
            try:
                error_data = res.json()
                error_message = error_data.get("message") or error_data.get("error")
            except Exception:
                error_message = res.text
            logger.error(f"[booking_tools] create_patient error HTTP {res.status_code}: {error_message}")
            return {"success": False, "error": error_message or f"HTTP {res.status_code}"}
    except Exception as err:
        logger.error(f"[booking_tools] create_patient_profile error: {err}")
        return {"success": False, "error": str(err)}
