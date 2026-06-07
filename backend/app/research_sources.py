from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from tavily import TavilyClient

from app.duckduckgo_provider import search_duckduckgo
from app.research_errors import SearchProviderError
from app.schemas import ResearchSource
from app.runtime_config import get_runtime_config
from app.text_processing import clean_source_excerpt

MAX_SOURCE_CONTENT_LENGTH = 4000


class ResearchSourcesState(TypedDict):
    queries: list[str]
    sources: list[ResearchSource]


def get_tavily_client() -> TavilyClient:
    search_config = get_runtime_config().search

    if search_config.provider != "tavily":
        raise SearchProviderError("当前搜索提供商不是 Tavily。")

    if not search_config.api_key:
        raise SearchProviderError("缺少搜索 API Key，请先在设置面板中配置。")

    return TavilyClient(api_key=search_config.api_key)


def normalize_source(result: dict[str, Any], query: str) -> ResearchSource:
    raw_content = (
        result.get("raw_content")
        or result.get("content")
        or result.get("body")
        or result.get("snippet")
        or ""
    )
    excerpt = clean_source_excerpt(str(raw_content), max_length=MAX_SOURCE_CONTENT_LENGTH)

    return ResearchSource(
        title=str(result.get("title") or "Untitled"),
        url=str(result.get("url") or result.get("href") or ""),
        content=excerpt,
        query=query,
    )


async def fetch_sources(state: ResearchSourcesState) -> ResearchSourcesState:
    search_config = get_runtime_config().search
    sources_by_url: dict[str, ResearchSource] = {}

    if search_config.provider == "tavily":
        client = get_tavily_client()
        for query in state["queries"]:
            normalized_query = query.strip()
            if not normalized_query:
                continue

            response = client.search(
                normalized_query,
                max_results=search_config.source_limit_per_query,
                include_raw_content=True,
            )
            for result in response.get("results", []):
                source = normalize_source(result, normalized_query)
                if source.url and source.url not in sources_by_url:
                    sources_by_url[source.url] = source
    elif search_config.provider == "duckduckgo":
        for query in state["queries"]:
            normalized_query = query.strip()
            if not normalized_query:
                continue

            results = search_duckduckgo(
                normalized_query,
                max_results=search_config.source_limit_per_query,
            )
            for result in results:
                source = normalize_source(result, normalized_query)
                if source.url and source.url not in sources_by_url:
                    sources_by_url[source.url] = source
    else:
        raise SearchProviderError("当前只支持 Tavily 或 DuckDuckGo 搜索提供商。")

    return {"queries": state["queries"], "sources": list(sources_by_url.values())}


builder = StateGraph(ResearchSourcesState)
builder.add_node("fetch_sources", fetch_sources)
builder.add_edge(START, "fetch_sources")
builder.add_edge("fetch_sources", END)

research_sources_graph = builder.compile()
