"""LLM client — stub khi chưa có API key."""

from app.config import settings


async def complete(system: str, user: str) -> str:
    provider = settings.llm_provider.lower()
    if provider == "groq" and settings.groq_api_key:
        return await _openai_compatible(
            "https://api.groq.com/openai/v1/chat/completions",
            settings.groq_api_key,
            settings.groq_model,
            system,
            user,
        )
    if provider == "openai" and settings.openai_api_key:
        return await _openai_compatible(
            "https://api.openai.com/v1/chat/completions",
            settings.openai_api_key,
            settings.openai_model,
            system,
            user,
        )
    if provider == "gemini" and settings.gemini_api_key:
        return await _gemini_complete(system, user)

    return (
        "[STUB AI] Chưa cấu hình API key. "
        f"System={system[:80]!r}… User={user[:120]!r}…"
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


async def _gemini_complete(system: str, user: str) -> str:
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
