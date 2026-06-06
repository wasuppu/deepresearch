from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import init_configured_chat_model
from app.prompts import CLARIFYING_QUESTIONS_SYSTEM_PROMPT, CLARIFYING_QUESTIONS_USER_PROMPT
from app.text_processing import parse_numbered_lines


class ClarifyingQuestionState(TypedDict):
    topic: str
    questions: list[str]


async def generate_question(state: ClarifyingQuestionState) -> ClarifyingQuestionState:
    model = init_configured_chat_model(temperature=0.1)
    response = await model.ainvoke(
        [
            SystemMessage(content=CLARIFYING_QUESTIONS_SYSTEM_PROMPT),
            HumanMessage(content=CLARIFYING_QUESTIONS_USER_PROMPT.format(topic=state["topic"])),
        ]
    )
    questions = parse_numbered_lines(str(response.content), limit=4)

    return {"topic": state["topic"], "questions": questions}


builder = StateGraph(ClarifyingQuestionState)
builder.add_node("generate_question", generate_question)
builder.add_edge(START, "generate_question")
builder.add_edge("generate_question", END)

clarifying_question_graph = builder.compile()
