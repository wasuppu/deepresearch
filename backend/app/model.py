from langchain.chat_models import init_chat_model

from app.provider_urls import normalize_model_base_url
from app.runtime_config import get_runtime_config


class ModelClientError(RuntimeError):
    pass


def extract_message_text(content: object) -> str:
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_parts: list[str] = []
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "text" and isinstance(block.get("text"), str):
                    text_parts.append(block["text"])
                elif isinstance(block.get("content"), str):
                    text_parts.append(block["content"])
            elif isinstance(block, str):
                text_parts.append(block)

        return "\n".join(text_parts)

    return str(content)


def init_configured_chat_model(temperature: float = 0.2):
    config = get_runtime_config().model

    if not config.api_key:
        raise ModelClientError("缺少模型 API Key，请先在设置面板中配置。")
    base_url = normalize_model_base_url(config.base_url, config.api_format)

    if not base_url:
        raise ModelClientError("缺少模型 Base URL，请先在设置面板中配置。")
    if not config.model:
        raise ModelClientError("缺少模型名称，请先在设置面板中配置。")

    if config.api_format not in {"openai", "anthropic"}:
        raise ModelClientError("当前只支持 OpenAI-compatible 或 Anthropic-compatible 模型接口。")

    return init_chat_model(
        model=config.model,
        model_provider=config.api_format,
        base_url=base_url,
        api_key=config.api_key,
        temperature=temperature,
    )
