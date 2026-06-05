from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import ModelClientError, init_configured_chat_model
from app.settings import settings


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

