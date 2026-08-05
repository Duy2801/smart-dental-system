import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


def _apply_env_file() -> None:
    """Ghi đè os.environ từ .env — tránh biến shell cũ (LLM_PROVIDER=openai) thắng file."""
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
    llm_provider: str = "groq"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    ai_service_api_key: str = "dev-local-key"


def get_settings() -> Settings:
    _apply_env_file()
    return Settings()
