import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


def _apply_env_file() -> None:
    """Ghi đè os.environ từ .env để cấu hình local luôn được ưu tiên."""
    if not _ENV_FILE.is_file():
        return
    for raw in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip()
        if key:
            os.environ[key] = val


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ai_service_name: str = "smart-dental-ai"
    ai_service_port: int = 8000
    llm_provider: str = "openrouter"
    openrouter_api_key: str = ""
    openrouter_model: str = ""
    nvidia_api_key: str = ""
    nvidia_model: str = "meta/llama-3.3-70b-instruct"
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1/chat/completions"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"
    huggingface_api_key: str = ""
    huggingface_model_id: str = "Hau1122/smart-dental-pano-ai"
    node_env: str = "development"
    ai_service_api_key: str = "dev-local-key"
    cors_origins: str = (
        "http://localhost:3001,http://localhost:3002,"
        "http://127.0.0.1:3001,http://127.0.0.1:3002"
    )


def get_settings() -> Settings:
    _apply_env_file()
    settings = Settings()
    if settings.node_env.lower() == "production" and (
        not settings.ai_service_api_key
        or settings.ai_service_api_key == "dev-local-key"
    ):
        raise RuntimeError(
            "AI_SERVICE_API_KEY must be configured outside development"
        )
    return settings
