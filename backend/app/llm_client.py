from typing import TypedDict

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.settings import settings


class ModelClientError(RuntimeError):
    pass


class ModelProbeState(TypedDict):
    message: str
    model: str
    content: str


def init_probe_model():
    if settings.llm_api_format != "openai":
        raise ModelClientError("当前只支持 OpenAI-compatible 模型接口。")

    if not settings.llm_api_key:
        raise ModelClientError("缺少 LLM_API_KEY，请先在 .env 中配置模型密钥。")

    return init_chat_model(
        model=settings.llm_model,
        model_provider="openai",
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        temperature=0.2,
    )


async def call_model(state: ModelProbeState) -> ModelProbeState:
    model = init_probe_model()
    response = await model.ainvoke(
        [
            SystemMessage(
                content="你是 Deep Research 项目的模型连通性检查助手，请用中文简洁回答。"
            ),
            HumanMessage(content=state["message"]),
        ]
    )

    return {
        "message": state["message"],
        "model": settings.llm_model,
        "content": str(response.content),
    }


builder = StateGraph(ModelProbeState)
builder.add_node("call_model", call_model)
builder.add_edge(START, "call_model")
builder.add_edge("call_model", END)

model_probe_graph = builder.compile()
