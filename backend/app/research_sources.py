from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from tavily import TavilyClient

from app.schemas import ResearchSource
from app.settings import settings
from app.text_processing import clean_source_excerpt

MAX_RESULTS_PER_QUERY = 3
MAX_SOURCE_CONTENT_LENGTH = 4000


class SearchProviderError(RuntimeError):
    pass


class ResearchSourcesState(TypedDict):
    queries: list[str]
    sources: list[ResearchSource]


def get_tavily_client() -> TavilyClient:
    if settings.search_provider != "tavily":
        raise SearchProviderError("当前只支持 Tavily 搜索供应商。")

    if not settings.tavily_api_key:
        raise SearchProviderError("缺少 TAVILY_API_KEY，请先在 .env 中配置搜索密钥。")

    return TavilyClient(api_key=settings.tavily_api_key)


def normalize_source(result: dict[str, Any], query: str) -> ResearchSource:
    raw_content = result.get("raw_content") or result.get("content") or ""
    excerpt = clean_source_excerpt(str(raw_content), max_length=MAX_SOURCE_CONTENT_LENGTH)

    return ResearchSource(
        title=str(result.get("title") or "Untitled"),
        url=str(result.get("url") or ""),
        content=excerpt,
        query=query,
    )


async def fetch_sources(state: ResearchSourcesState) -> ResearchSourcesState:
    client = get_tavily_client()
    sources_by_url: dict[str, ResearchSource] = {}

    for query in state["queries"]:
        normalized_query = query.strip()
        if not normalized_query:
            continue

        response = client.search(
            normalized_query,
            max_results=MAX_RESULTS_PER_QUERY,
            include_raw_content=True,
        )

        for result in response.get("results", []):
            source = normalize_source(result, normalized_query)
            if source.url and source.url not in sources_by_url:
                sources_by_url[source.url] = source

    return {"queries": state["queries"], "sources": list(sources_by_url.values())}


builder = StateGraph(ResearchSourcesState)
builder.add_node("fetch_sources", fetch_sources)
builder.add_edge(START, "fetch_sources")
builder.add_edge("fetch_sources", END)

research_sources_graph = builder.compile()
