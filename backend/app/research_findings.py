from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import init_configured_chat_model
from app.prompts import RESEARCH_FINDING_SYSTEM_PROMPT, RESEARCH_FINDING_USER_PROMPT
from app.research_sources import fetch_sources
from app.schemas import ResearchFinding, ResearchSource


class ResearchFindingsState(TypedDict):
    queries: list[str]
    findings: list[ResearchFinding]


def format_source_excerpts(sources: list[ResearchSource]) -> str:
    blocks: list[str] = []

    for index, source in enumerate(sources, start=1):
        blocks.append(
            "\n".join(
                [
                    f"[{index}] {source.title}",
                    f"URL: {source.url}",
                    f"Excerpt: {source.content[:2000]}",
                ]
            )
        )

    return "\n\n".join(blocks)


async def generate_findings(state: ResearchFindingsState) -> ResearchFindingsState:
    sources_state = await fetch_sources({"queries": state["queries"], "sources": []})
    model = init_configured_chat_model(temperature=0.1)
    findings: list[ResearchFinding] = []

    for query in state["queries"]:
        query_sources = [source for source in sources_state["sources"] if source.query == query]
        if not query_sources:
            findings.append(
                ResearchFinding(query=query, finding="未找到足够相关的资料来源。", sources=[])
            )
            continue

        response = await model.ainvoke(
            [
                SystemMessage(content=RESEARCH_FINDING_SYSTEM_PROMPT),
                HumanMessage(
                    content=RESEARCH_FINDING_USER_PROMPT.format(
                        query=query,
                        source_excerpts=format_source_excerpts(query_sources),
                    )
                ),
            ]
        )
        findings.append(
            ResearchFinding(
                query=query,
                finding=str(response.content).strip(),
                sources=query_sources,
            )
        )

    return {"queries": state["queries"], "findings": findings}


builder = StateGraph(ResearchFindingsState)
builder.add_node("generate_findings", generate_findings)
builder.add_edge(START, "generate_findings")
builder.add_edge("generate_findings", END)

research_findings_graph = builder.compile()
