from langchain.chat_models import init_chat_model

from app.settings import settings


class ModelClientError(RuntimeError):
    pass


def init_configured_chat_model(temperature: float = 0.2):
    if settings.llm_api_format != "openai":
        raise ModelClientError("当前只支持 OpenAI-compatible 模型接口。")

    if not settings.llm_api_key:
        raise ModelClientError("缺少 LLM_API_KEY，请先在 .env 中配置模型密钥。")

    return init_chat_model(
        model=settings.llm_model,
        model_provider="openai",
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        temperature=temperature,
    )

