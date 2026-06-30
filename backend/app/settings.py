from dataclasses import dataclass
from os import getenv

from dotenv import load_dotenv

load_dotenv()


def parse_csv_env(value: str) -> list[str]:
    return [item.strip().rstrip("/") for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "Deep Research LangGraph Backend"
    app_version: str = "0.1.0"
    cors_allowed_origins: list[str] | None = None
    llm_api_format: str = getenv("LLM_API_FORMAT", "openai")
    llm_api_key: str = getenv("LLM_API_KEY", "")
    llm_base_url: str = getenv("LLM_BASE_URL", "")
    llm_model: str = getenv("LLM_MODEL", "")
    search_provider: str = getenv("SEARCH_PROVIDER", "tavily")
    tavily_api_key: str = getenv("TAVILY_API_KEY", "")

    def __post_init__(self) -> None:
        if self.cors_allowed_origins is not None:
            return

        origins = getenv(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,https://wasuppu.github.io",
        )
        object.__setattr__(self, "cors_allowed_origins", parse_csv_env(origins))


settings = Settings()
