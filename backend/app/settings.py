from dataclasses import dataclass
from os import getenv

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    app_name: str = "Deep Research LangGraph Backend"
    app_version: str = "0.1.0"
    llm_api_format: str = getenv("LLM_API_FORMAT", "openai")
    llm_api_key: str = getenv("LLM_API_KEY", "")
    llm_base_url: str = getenv("LLM_BASE_URL", "https://api.deepseek.com")
    llm_model: str = getenv("LLM_MODEL", "deepseek-v4-flash")
    search_provider: str = getenv("SEARCH_PROVIDER", "tavily")
    tavily_api_key: str = getenv("TAVILY_API_KEY", "")


settings = Settings()
