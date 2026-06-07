from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import extract_message_text, init_configured_chat_model
from app.prompts import RESEARCH_BRIEF_SYSTEM_PROMPT, RESEARCH_BRIEF_USER_PROMPT
from app.runtime_config import get_runtime_config, output_language_label


class ResearchBriefState(TypedDict):
    topic: str
    clarifying_questions: list[str]
    clarification: str
    brief: str


async def write_brief(state: ResearchBriefState) -> ResearchBriefState:
    content_config = get_runtime_config().content
    model = init_configured_chat_model(temperature=0.1)
    response = await model.ainvoke(
        [
            SystemMessage(
                content=RESEARCH_BRIEF_SYSTEM_PROMPT.format(
                    output_language_label=output_language_label(
                        content_config.output_language
                    )
                )
            ),
            HumanMessage(
                content=RESEARCH_BRIEF_USER_PROMPT.format(
                    topic=state["topic"],
                    clarifying_questions="\n".join(
                        f"{index + 1}. {question}"
                        for index, question in enumerate(state["clarifying_questions"])
                    ),
                    clarification=state["clarification"],
                )
            ),
        ]
    )
    brief = extract_message_text(response.content).strip()

    return {
        "topic": state["topic"],
        "clarifying_questions": state["clarifying_questions"],
        "clarification": state["clarification"],
        "brief": brief,
    }


builder = StateGraph(ResearchBriefState)
builder.add_node("write_brief", write_brief)
builder.add_edge(START, "write_brief")
builder.add_edge("write_brief", END)

research_brief_graph = builder.compile()
