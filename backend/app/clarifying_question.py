from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import extract_message_text, init_configured_chat_model
from app.prompts import CLARIFYING_QUESTIONS_SYSTEM_PROMPT, CLARIFYING_QUESTIONS_USER_PROMPT
from app.runtime_config import get_runtime_config, output_language_label
from app.text_processing import parse_numbered_lines


class ClarifyingQuestionState(TypedDict):
    topic: str
    questions: list[str]


async def generate_question(state: ClarifyingQuestionState) -> ClarifyingQuestionState:
    content_config = get_runtime_config().content
    model = init_configured_chat_model(temperature=0.1)
    response = await model.ainvoke(
        [
            SystemMessage(
                content=CLARIFYING_QUESTIONS_SYSTEM_PROMPT.format(
                    question_count=content_config.clarifying_question_count,
                    output_language_label=output_language_label(
                        content_config.output_language
                    ),
                )
            ),
            HumanMessage(content=CLARIFYING_QUESTIONS_USER_PROMPT.format(topic=state["topic"])),
        ]
    )
    questions = parse_numbered_lines(
        extract_message_text(response.content),
        limit=content_config.clarifying_question_count,
    )

    return {"topic": state["topic"], "questions": questions}


builder = StateGraph(ClarifyingQuestionState)
builder.add_node("generate_question", generate_question)
builder.add_edge(START, "generate_question")
builder.add_edge("generate_question", END)

clarifying_question_graph = builder.compile()
