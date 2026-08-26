"""LLM client — fallback chain: nvidia -> openrouter -> groq."""

import logging

from app.config import get_settings

logger = logging.getLogger(__name__)


async def complete(system: str, user: str) -> str:
    """Goi LLM voi fallback tu dong: nvidia -> openrouter -> groq.

    - openai / gemini van dung duoc qua LLM_PROVIDER (khong co fallback).
    - Ba provider con lai luon thu theo thu tu nvidia -> openrouter -> groq,
      bat ke gia tri LLM_PROVIDER la gi.
    """
    settings = get_settings()
    provider = settings.llm_provider.lower()

    # --- Opt-in don le (khong fallback) ---
    if provider == "openai" and settings.openai_api_key:
        return await _openai_compatible(
            "https://api.openai.com/v1/chat/completions",
            settings.openai_api_key,
            settings.openai_model,
            system,
            user,
        )
    if provider == "gemini" and settings.gemini_api_key:
        return await _gemini_complete(system, user, settings)

    # --- Fallback chain: nvidia -> openrouter -> groq ---
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

    if settings.openrouter_api_key:
        candidates.append(
            (
                "openrouter",
                "https://openrouter.ai/api/v1/chat/completions",
                settings.openrouter_api_key,
                settings.openrouter_model,
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
    for name, url, api_key, model in candidates:
        try:
            logger.info("[LLM] Trying provider: %s", name)
            result = await _openai_compatible(url, api_key, model, system, user)
            logger.info("[LLM] Success with provider: %s", name)
            return result
        except Exception as exc:
            logger.warning("[LLM] Provider %s failed: %s — trying next.", name, exc)
            last_error = exc

    if last_error:
        raise RuntimeError(f"Tat ca LLM provider deu that bai. Loi cuoi: {last_error}")

    return (
        "[STUB AI] Chua cau hinh API key. "
        "Dien NVIDIA_API_KEY / OPENROUTER_API_KEY / GROQ_API_KEY vao "
        "apps/ai-service/.env roi restart service."
    )


async def _openai_compatible(
    url: str, api_key: str, model: str, system: str, user: str
) -> str:
    import httpx

    async with httpx.AsyncClient(timeout=60) as client:
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
    import httpx

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
        f"?key={settings.gemini_api_key}"
    )
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            url,
            json={
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [{"parts": [{"text": user}]}],
            },
        )
        res.raise_for_status()
        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def complete_gemini(system: str, user: str) -> str:
    """Dùng Gemini để diễn giải dữ liệu đã được model local phát hiện."""
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("Chưa cấu hình GEMINI_API_KEY cho phần giải thích X-quang.")
    return await _gemini_complete(system, user, settings)
