from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import init_configured_chat_model


class ResearchBriefState(TypedDict):
    topic: str
    clarifying_question: str
    clarifying_answer: str
    brief: str


async def write_brief(state: ResearchBriefState) -> ResearchBriefState:
    model = init_configured_chat_model(temperature=0.1)
    response = await model.ainvoke(
        [
            SystemMessage(
                content=(
                    "你是一个中文 Deep Research 研究规划助手。"
                    "你的任务是把用户主题和澄清回答整理成后续研究可以直接使用的研究 brief。"
                    "不要开始研究，不要编造事实，不要给结论。"
                )
            ),
            HumanMessage(
                content=(
                    "请基于以下信息写一份中文研究 brief，要求包含：研究目标、范围边界、"
                    "重点问题、预期报告形式。控制在 300 字以内。\n\n"
                    f"研究主题：{state['topic']}\n"
                    f"澄清问题：{state['clarifying_question']}\n"
                    f"用户回答：{state['clarifying_answer']}"
                )
            ),
        ]
    )
    brief = str(response.content).strip()

    return {
        "topic": state["topic"],
        "clarifying_question": state["clarifying_question"],
        "clarifying_answer": state["clarifying_answer"],
        "brief": brief,
    }


builder = StateGraph(ResearchBriefState)
builder.add_node("write_brief", write_brief)
builder.add_edge(START, "write_brief")
builder.add_edge("write_brief", END)

research_brief_graph = builder.compile()

