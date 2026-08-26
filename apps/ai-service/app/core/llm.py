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
        candidates.append((
            "nvidia",
            settings.nvidia_base_url,
            settings.nvidia_api_key,
            settings.nvidia_model,
        ))

    if settings.openrouter_api_key:
        candidates.append((
            "openrouter",
            "https://openrouter.ai/api/v1/chat/completions",
            settings.openrouter_api_key,
            settings.openrouter_model,
        ))

    if settings.groq_api_key:
        candidates.append((
            "groq",
            "https://api.groq.com/openai/v1/chat/completions",
            settings.groq_api_key,
            settings.groq_model,
        ))

    last_error: Exception | None = None
    for name, url, api_key, model in candidates:
        try:
            logger.info("[LLM] Trying provider: %s", name)
            result = await _openai_compatible(url, api_key, model, system, user)
            logger.info("[LLM] Success with provider: %s", name)
            return result
        except Exception as exc:
            logger.warning(
                "[LLM] Provider %s failed: %s — trying next.", name, exc
            )
            last_error = exc

    if last_error:
        raise RuntimeError(
            f"Tat ca LLM provider deu that bai. Loi cuoi: {last_error}"
        )

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


async def complete_vision(
    system: str,
    user: str,
    image_base64: str | None = None,
    image_url: str | None = None,
) -> str:
    """Gọi LLM Multimodal Vision (Gemini / OpenAI / OpenRouter) để phân tích ảnh X-quang."""
    settings = get_settings()
    provider = settings.llm_provider.lower()

    # Chuẩn bị base64 không chứa header "data:image/..." nếu có
    clean_b64 = None
    if image_base64:
        clean_b64 = image_base64.split(",")[1] if "," in image_base64 else image_base64

    # 1. Thử OpenRouter Vision (dùng openrouter/free hoặc google gemma)
    if settings.openrouter_api_key:
        candidates = [
            settings.openrouter_vision_model or "openrouter/free",
            "openrouter/free",
            "google/gemma-4-31b-it:free",
            "google/gemma-4-26b-a4b-it:free",
        ]
        seen = set()
        unique_candidates = [c for c in candidates if c and not (c in seen or seen.add(c))]

        for vm in unique_candidates:
            try:
                logger.info(f"[Vision] Đang gọi OpenRouter Vision model: {vm}")
                return await _openai_vision(
                    "https://openrouter.ai/api/v1/chat/completions",
                    settings.openrouter_api_key,
                    vm,
                    system,
                    user,
                    clean_b64,
                    image_url,
                )
            except Exception as exc:
                logger.warning(f"[Vision] OpenRouter model {vm} thất bại ({exc}), thử model dự phòng tiếp theo...")


    # 2. Thử Gemini Vision làm dự phòng
    if settings.gemini_api_key:
        try:
            return await _gemini_vision(system, user, clean_b64, image_url, settings)
        except Exception as exc:
            logger.warning("[Vision] Gemini Vision failed: %s — trying OpenAI", exc)

    # 3. Thử OpenAI Vision nếu có key
    if settings.openai_api_key:
        try:
            return await _openai_vision(
                "https://api.openai.com/v1/chat/completions",
                settings.openai_api_key,
                settings.openai_model or "gpt-4o-mini",
                system,
                user,
                clean_b64,
                image_url,
            )
        except Exception as exc:
            logger.warning("[Vision] OpenAI Vision failed: %s", exc)



    # Nếu tất cả không có key hoặc lỗi, fallback sang text completion
    return await complete(system, user)


async def _gemini_vision(
    system: str,
    user: str,
    image_b64: str | None,
    image_url: str | None,
    settings,
) -> str:
    import httpx

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model or 'gemini-2.0-flash'}:generateContent"
        f"?key={settings.gemini_api_key}"
    )

    parts: list[dict] = [{"text": user}]

    if image_b64:
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": image_b64,
            }
        })
    elif image_url and image_url.startswith("data:image"):
        raw_b64 = image_url.split(",")[1]
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": raw_b64,
            }
        })

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            url,
            json={
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [{"parts": parts}],
            },
        )
        res.raise_for_status()
        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def _openai_vision(
    url: str,
    api_key: str,
    model: str,
    system: str,
    user: str,
    image_b64: str | None,
    image_url: str | None,
) -> str:
    import httpx

    user_content: list[dict] = [{"type": "text", "text": user}]

    if image_b64:
        user_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
        })
    elif image_url:
        user_content.append({
            "type": "image_url",
            "image_url": {"url": image_url},
        })

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_content},
                ],
                "temperature": 0.2,
            },
        )
        res.raise_for_status()
        data = res.json()
        return data["choices"][0]["message"]["content"]

