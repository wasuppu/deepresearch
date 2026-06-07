from contextvars import ContextVar, Token

from app.schemas import RunConfiguration
from app.settings import settings

runtime_config_var: ContextVar[RunConfiguration | None] = ContextVar(
    "langgraph_runtime_config", default=None
)


def default_run_config() -> RunConfiguration:
    return RunConfiguration(
        model={
            "api_format": settings.llm_api_format,
            "api_key": settings.llm_api_key,
            "base_url": settings.llm_base_url,
            "model": settings.llm_model,
        },
        search={
            "provider": settings.search_provider,
            "api_key": settings.tavily_api_key,
            "source_limit_per_query": 3,
        },
    )


def get_runtime_config() -> RunConfiguration:
    return runtime_config_var.get() or default_run_config()


def set_runtime_config(config: RunConfiguration | None) -> Token[RunConfiguration | None]:
    return runtime_config_var.set(config or default_run_config())


def reset_runtime_config(token: Token[RunConfiguration | None]) -> None:
    runtime_config_var.reset(token)


def output_language_label(output_language: str) -> str:
    return "中文" if output_language == "zh-CN" else "英文"


def report_tone_label(report_tone: str) -> str:
    labels = {
        "neutral": "中性",
        "concise": "简洁",
        "analytical": "分析性",
    }
    return labels.get(report_tone, "中性")
