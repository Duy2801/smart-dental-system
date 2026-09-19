"""LLM client — fallback chain: nvidia -> groq -> gemini -> openrouter."""

import logging
import time
from dataclasses import dataclass

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

_RETRYABLE_HTTP_STATUS_CODES = {408, 429}


@dataclass(frozen=True)
class LlmCompletion:
    content: str
    provider: str
    model: str


def _is_retryable_provider_error(exc: Exception) -> bool:
    """Return whether another provider may recover from this failure."""
    if isinstance(exc, (httpx.TimeoutException, httpx.NetworkError)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        status_code = exc.response.status_code
        return status_code in _RETRYABLE_HTTP_STATUS_CODES or status_code >= 500
    return False


def _log_provider_failure(
    name: str,
    model: str,
    exc: Exception,
    started_at: float,
    *,
    has_fallback: bool,
) -> bool:
    retryable = _is_retryable_provider_error(exc)
    response = getattr(exc, "response", None)
    status_code = getattr(response, "status_code", None)
    elapsed_ms = round((time.perf_counter() - started_at) * 1000)
    action = "fallback" if retryable and has_fallback else "stop"
    logger.warning(
        "[LLM] Provider failed: provider=%s model=%s error_type=%s "
        "status_code=%s elapsed_ms=%s retryable=%s action=%s",
        name,
        model,
        type(exc).__name__,
        status_code if status_code is not None else "none",
        elapsed_ms,
        retryable,
        action,
    )
    return retryable


async def complete(system: str, user: str) -> str:
    """Goi LLM voi fallback tu dong: nvidia -> groq -> gemini -> openrouter."""
    result = await complete_with_metadata(system, user)
    return result.content


async def complete_with_metadata(system: str, user: str) -> LlmCompletion:
    """Gọi LLM và trả kèm provider/model thực sự đã tạo kết quả."""
    settings = get_settings()
    provider = settings.llm_provider.lower()

    # --- Opt-in don le (khong fallback) ---
    if provider == "openai" and settings.openai_api_key:
        content = await _openai_compatible(
            "https://api.openai.com/v1/chat/completions",
            settings.openai_api_key,
            settings.openai_model,
            system,
            user,
        )
        return LlmCompletion(content, "openai", settings.openai_model)

    # --- Fallback chain: nvidia -> groq -> gemini -> openrouter ---
    candidates = []

    if settings.nvidia_api_key:
        candidates.append(
            (
                "nvidia",
                settings.nvidia_base_url,
                settings.nvidia_api_key,
                settings.nvidia_model,
            )
        )

    if settings.groq_api_key:
        candidates.append(
            (
                "groq",
                "https://api.groq.com/openai/v1/chat/completions",
                settings.groq_api_key,
                settings.groq_model,
            )
        )

    last_error: Exception | None = None
    for item in candidates:
        name, url, api_key, model = item
        started_at = time.perf_counter()
        try:
            logger.info("[LLM] Trying provider: %s", name)
            result = await _openai_compatible(url, api_key, model, system, user)
            logger.info("[LLM] Success with provider: %s", name)
            return LlmCompletion(result, name, model)
        except Exception as exc:
            retryable = _log_provider_failure(
                name, model, exc, started_at, has_fallback=True
            )
            if not retryable:
                raise
            last_error = exc

    # Fast fallback: Gemini is high-throughput & takes only ~4s
    if settings.gemini_api_key:
        started_at = time.perf_counter()
        try:
            logger.info("[LLM] Trying fast fallback provider: gemini")
            result = await _gemini_complete(system, user, settings)
            logger.info("[LLM] Success with fallback provider: gemini")
            return LlmCompletion(result, "gemini", settings.gemini_model)
        except Exception as exc:
            retryable = _log_provider_failure(
                "gemini",
                settings.gemini_model,
                exc,
                started_at,
                has_fallback=bool(settings.openrouter_api_key),
            )
            if not retryable:
                raise
            last_error = exc

    # Last resort fallback: OpenRouter
    if settings.openrouter_api_key:
        started_at = time.perf_counter()
        try:
            logger.info("[LLM] Trying fallback provider: openrouter")
            result = await _openai_compatible(
                "https://openrouter.ai/api/v1/chat/completions",
                settings.openrouter_api_key,
                settings.openrouter_model,
                system,
                user,
            )
            logger.info("[LLM] Success with fallback provider: openrouter")
            return LlmCompletion(result, "openrouter", settings.openrouter_model)
        except Exception as exc:
            _log_provider_failure(
                "openrouter",
                settings.openrouter_model,
                exc,
                started_at,
                has_fallback=False,
            )
            last_error = exc

    if last_error:
        raise RuntimeError(
            "Tat ca LLM provider deu that bai. "
            f"Loi cuoi: {type(last_error).__name__}"
        ) from last_error

    raise RuntimeError(
        "Chưa cấu hình LLM provider. Cần NVIDIA_API_KEY, OPENROUTER_API_KEY, "
        "GROQ_API_KEY hoặc GEMINI_API_KEY."
    )


async def _openai_compatible(
    url: str, api_key: str, model: str, system: str, user: str
) -> str:
    timeout = get_settings().llm_timeout_seconds
    async with httpx.AsyncClient(timeout=timeout) as client:
        res = await client.post(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.3,
            },
        )
        res.raise_for_status()
        data = res.json()
        return data["choices"][0]["message"]["content"]


async def _gemini_complete(system: str, user: str, settings) -> str:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
        f"?key={settings.gemini_api_key}"
    )
    async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
        res = await client.post(
            url,
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": system + "\n\n" + user}
                        ]
                    }
                ]
            },
        )
        res.raise_for_status()
        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def complete_gemini(system: str, user: str) -> str:
    """Use Gemini for vision explanation prompts."""
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is required for vision explanations.")
    return await _gemini_complete(system, user, settings)
