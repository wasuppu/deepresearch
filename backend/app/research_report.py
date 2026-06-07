from typing import TypedDict
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import init_configured_chat_model
from app.prompts import RESEARCH_REPORT_SYSTEM_PROMPT, RESEARCH_REPORT_USER_PROMPT
from app.schemas import ResearchFinding, ResearchSource


class ResearchReportState(TypedDict):
    brief: str
    findings: list[ResearchFinding]
    report: str
    references: list[ResearchSource]


def collect_unique_sources(findings: list[ResearchFinding]) -> list[ResearchSource]:
    sources_by_url: dict[str, ResearchSource] = {}
    ordered_sources: list[ResearchSource] = []

    for finding in findings:
        for source in finding.sources:
            if not source.url or source.url in sources_by_url:
                continue
            sources_by_url[source.url] = source
            ordered_sources.append(source)

    return ordered_sources


def format_findings(findings: list[ResearchFinding], source_indices: dict[str, int]) -> str:
    blocks: list[str] = []

    for index, finding in enumerate(findings, start=1):
        refs = sorted(
            {
                source_indices[source.url]
                for source in finding.sources
                if source.url in source_indices
            }
        )
        ref_text = "、".join(f"[{ref}]" for ref in refs) if refs else "无"
        blocks.append(
            "\n".join(
                [
                    f"[{index}] 检索问题：{finding.query}",
                    f"研究发现：{finding.finding}",
                    f"来源引用：{ref_text}",
                ]
            )
        )

    return "\n\n".join(blocks)


def format_sources(sources: list[ResearchSource]) -> tuple[str, dict[str, int]]:
    lines: list[str] = []
    source_indices: dict[str, int] = {}

    for index, source in enumerate(sources, start=1):
        source_indices[source.url] = index
        lines.append(
            "\n".join(
                [
                    f"[{index}] {source.title}",
                    f"URL: {source.url}",
                    f"Excerpt: {source.content[:1200]}",
                ]
            )
        )

    return "\n\n".join(lines), source_indices


def strip_reference_section(report: str) -> str:
    match = re.search(r"\n##\s*参考来源\s*\n", report)
    if match:
        return report[: match.start()].rstrip()

    match = re.search(r"\n#{1,6}\s*参考来源\s*\n", report)
    if match:
        return report[: match.start()].rstrip()

    return report.strip()


def collect_referenced_sources(
    report: str, sources: list[ResearchSource], source_indices: dict[str, int]
) -> list[ResearchSource]:
    cited_ids = [int(match) for match in re.findall(r"\[(\d+)\]", report)]
    if not cited_ids:
        return []

    cited_id_set = set(cited_ids)
    return [
        source
        for source in sources
        if source_indices.get(source.url) in cited_id_set
    ]


async def write_report(state: ResearchReportState) -> ResearchReportState:
    sources = collect_unique_sources(state["findings"])
    sources_text, source_indices = format_sources(sources)
    findings_text = format_findings(state["findings"], source_indices)

    model = init_configured_chat_model(temperature=0.2)
    response = await model.ainvoke(
        [
            SystemMessage(content=RESEARCH_REPORT_SYSTEM_PROMPT),
            HumanMessage(
                content=RESEARCH_REPORT_USER_PROMPT.format(
                    brief=state["brief"],
                    findings=findings_text,
                    sources=sources_text,
                )
            ),
        ]
    )
    report = strip_reference_section(str(response.content).strip())
    references = collect_referenced_sources(report, sources, source_indices)

    return {
        "brief": state["brief"],
        "findings": state["findings"],
        "report": report,
        "references": references,
    }


builder = StateGraph(ResearchReportState)
builder.add_node("write_report", write_report)
builder.add_edge(START, "write_report")
builder.add_edge("write_report", END)

research_report_graph = builder.compile()
