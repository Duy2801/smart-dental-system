"""LLM client — fallback chain: nvidia -> openrouter -> groq -> gemini."""

import logging
from dataclasses import dataclass
from app.config import get_settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LlmCompletion:
    content: str
    provider: str
    model: str


async def complete(system: str, user: str) -> str:
    """Goi LLM voi fallback tu dong: nvidia -> openrouter -> groq -> gemini."""
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

    # --- Fallback chain: nvidia -> openrouter -> groq -> gemini ---
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
    for item in candidates:
        name, url, api_key, model = item
        try:
            logger.info("[LLM] Trying provider: %s", name)
            result = await _openai_compatible(url, api_key, model, system, user)
            logger.info("[LLM] Success with provider: %s", name)
            return LlmCompletion(result, name, model)
        except Exception as exc:
            logger.warning("[LLM] Provider %s failed: %s — trying next.", name, exc)
            last_error = exc

    # Fallback to Gemini if configured
    if settings.gemini_api_key:
        try:
            logger.info("[LLM] Trying fallback provider: gemini")
            result = await _gemini_complete(system, user, settings)
            logger.info("[LLM] Success with fallback provider: gemini")
            return LlmCompletion(result, "gemini", settings.gemini_model)
        except Exception as exc:
            logger.warning("[LLM] Provider gemini failed: %s", exc)
            last_error = exc

    if last_error:
        raise RuntimeError(f"Tat ca LLM provider deu that bai. Loi cuoi: {last_error}")

    raise RuntimeError(
        "Chưa cấu hình LLM provider. Cần NVIDIA_API_KEY, OPENROUTER_API_KEY, "
        "GROQ_API_KEY hoặc GEMINI_API_KEY."
    )


async def _openai_compatible(
    url: str, api_key: str, model: str, system: str, user: str
) -> str:
    import httpx

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
    import httpx

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
