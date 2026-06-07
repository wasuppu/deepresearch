from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import extract_message_text, init_configured_chat_model
from app.prompts import SEARCH_PLAN_SYSTEM_PROMPT, SEARCH_PLAN_USER_PROMPT
from app.runtime_config import get_runtime_config, output_language_label
from app.text_processing import parse_numbered_lines


class SearchPlanState(TypedDict):
    brief: str
    queries: list[str]


def parse_queries(content: str) -> list[str]:
    return parse_numbered_lines(
        content, limit=get_runtime_config().content.search_plan_question_count
    )


async def generate_queries(state: SearchPlanState) -> SearchPlanState:
    content_config = get_runtime_config().content
    model = init_configured_chat_model(temperature=0.2)
    response = await model.ainvoke(
        [
            SystemMessage(
                content=SEARCH_PLAN_SYSTEM_PROMPT.format(
                    question_count=content_config.search_plan_question_count,
                    output_language_label=output_language_label(
                        content_config.output_language
                    ),
                )
            ),
            HumanMessage(content=SEARCH_PLAN_USER_PROMPT.format(brief=state["brief"])),
        ]
    )
    queries = parse_queries(extract_message_text(response.content))

    return {"brief": state["brief"], "queries": queries}


builder = StateGraph(SearchPlanState)
builder.add_node("generate_queries", generate_queries)
builder.add_edge(START, "generate_queries")
builder.add_edge("generate_queries", END)

search_plan_graph = builder.compile()
