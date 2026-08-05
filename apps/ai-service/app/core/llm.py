"""LLM client — stub trả text giả khi chưa có API key."""

from app.config import settings


async def complete(system: str, user: str) -> str:
    """Gọi LLM. Hiện stub; gắn OpenAI/Gemini khi có key."""
    if settings.llm_provider == "openai" and settings.openai_api_key:
        return await _openai_complete(system, user)
    if settings.llm_provider == "gemini" and settings.gemini_api_key:
        return await _gemini_complete(system, user)

    # Stub để chạy được ngay khi chưa có key
    return (
        "[STUB AI] Chưa cấu hình API key. "
        f"System={system[:80]!r}… User={user[:120]!r}…"
    )


async def _openai_complete(system: str, user: str) -> str:
    # ponytail: httpx raw call, thêm SDK khi cần streaming
    import httpx

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={
                "model": settings.openai_model,
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
