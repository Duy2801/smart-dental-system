import logging
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.core import llm


def _settings(**overrides):
    values = {
        "llm_provider": "nvidia",
        "nvidia_api_key": "nvidia-secret",
        "nvidia_base_url": "https://nvidia.example/chat",
        "nvidia_model": "nvidia-model",
        "groq_api_key": "",
        "groq_model": "groq-model",
        "gemini_api_key": "",
        "gemini_model": "gemini-model",
        "openrouter_api_key": "openrouter-secret",
        "openrouter_model": "openrouter-model",
        "openai_api_key": "",
        "openai_model": "openai-model",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def _http_error(status_code: int) -> httpx.HTTPStatusError:
    request = httpx.Request("POST", "https://provider.example/chat")
    response = httpx.Response(status_code, request=request)
    return httpx.HTTPStatusError(
        f"provider returned {status_code}",
        request=request,
        response=response,
    )


@pytest.mark.asyncio
async def test_non_retryable_nvidia_error_does_not_fallback():
    call_provider = AsyncMock(
        side_effect=[_http_error(401), "openrouter should not be called"]
    )

    with (
        patch("app.core.llm.get_settings", return_value=_settings()),
        patch("app.core.llm._openai_compatible", call_provider),
    ):
        with pytest.raises(httpx.HTTPStatusError) as raised:
            await llm.complete_with_metadata("system", "user")

    assert raised.value.response.status_code == 401
    assert call_provider.await_count == 1


@pytest.mark.asyncio
async def test_retryable_timeout_logs_type_and_elapsed_time_before_fallback(caplog):
    call_provider = AsyncMock(side_effect=[httpx.ReadTimeout(""), "fallback reply"])

    with (
        patch("app.core.llm.get_settings", return_value=_settings()),
        patch("app.core.llm._openai_compatible", call_provider),
        caplog.at_level(logging.WARNING, logger="app.core.llm"),
    ):
        result = await llm.complete_with_metadata("system", "user")

    assert result.provider == "openrouter"
    assert "error_type=ReadTimeout" in caplog.text
    assert "elapsed_ms=" in caplog.text
    assert call_provider.await_count == 2


@pytest.mark.parametrize("status_code", [408, 429, 500, 502, 503, 504])
def test_retryable_http_statuses_are_classified_for_fallback(status_code):
    assert llm._is_retryable_provider_error(_http_error(status_code)) is True


@pytest.mark.parametrize("status_code", [400, 401, 403, 404, 422])
def test_configuration_and_request_errors_are_not_retryable(status_code):
    assert llm._is_retryable_provider_error(_http_error(status_code)) is False
