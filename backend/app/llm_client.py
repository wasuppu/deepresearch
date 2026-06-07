from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import ModelClientError, extract_message_text, init_configured_chat_model
from app.runtime_config import get_runtime_config


class ModelProbeState(TypedDict):
    message: str
    model: str
    content: str


async def call_model(state: ModelProbeState) -> ModelProbeState:
    model = init_configured_chat_model(temperature=0.2)
    response = await model.ainvoke(
        [
            SystemMessage(
                content="你是 Deep Research 项目的模型连通性检查助手，请用中文简洁回答。"
            ),
            HumanMessage(content=state["message"]),
        ]
    )
    config = get_runtime_config().model

    return {
        "message": state["message"],
        "model": config.model,
        "content": extract_message_text(response.content),
    }


builder = StateGraph(ModelProbeState)
builder.add_node("call_model", call_model)
builder.add_edge(START, "call_model")
builder.add_edge("call_model", END)

model_probe_graph = builder.compile()
