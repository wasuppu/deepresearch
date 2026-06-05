from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import init_configured_chat_model


class ClarifyingQuestionState(TypedDict):
    topic: str
    question: str


async def generate_question(state: ClarifyingQuestionState) -> ClarifyingQuestionState:
    model = init_configured_chat_model(temperature=0.1)
    response = await model.ainvoke(
        [
            SystemMessage(
                content=(
                    "你是一个中文 Deep Research 助手，擅长在正式研究前收窄问题范围。"
                    "你必须只输出一个中文澄清问题，不要输出 JSON，不要解释，不要开始研究。"
                )
            ),
            HumanMessage(
                content=(
                    "请基于下面的研究主题，提出一个最有价值的澄清问题。"
                    "这个问题应该帮助明确研究范围、对象、时间边界、地区边界或报告用途。\n\n"
                    f"研究主题：{state['topic']}"
                )
            ),
        ]
    )
    question = str(response.content).strip()

    return {"topic": state["topic"], "question": question}


builder = StateGraph(ClarifyingQuestionState)
builder.add_node("generate_question", generate_question)
builder.add_edge(START, "generate_question")
builder.add_edge("generate_question", END)

clarifying_question_graph = builder.compile()
