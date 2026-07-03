from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """App config loaded from environment variables."""

    anthropic_api_key: str = ""

    # Fast pass: cheap, runs first on every extract
    anthropic_model_fast: str = "claude-haiku-4-5-20251001"
    # Strong pass: runs only when fast pass looks weak
    anthropic_model_strong: str = "claude-sonnet-4-6"

    enable_sonnet_fallback: bool = True
    enable_prompt_cache: bool = True

    pdf_dpi_fast: int = 200
    pdf_dpi_strong: int = 250

    # Comma-separated allowed origins for production (e.g. https://your-app.vercel.app)
    cors_origins: str = ""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
