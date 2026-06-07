import re
from typing import Any

from ddgs import DDGS

from app.research_errors import SearchProviderError


def search_duckduckgo(query: str, max_results: int) -> list[dict[str, Any]]:
    region = "cn-zh" if re.search(r"[\u4e00-\u9fff]", query) else "us-en"
    attempts = [
        {"region": region, "backend": "duckduckgo"},
        {"region": "wt-wt", "backend": "duckduckgo"},
        {"region": region, "backend": "auto"},
        {"region": "wt-wt", "backend": "auto"},
    ]
    results_by_url: dict[str, dict[str, Any]] = {}
    last_error: Exception | None = None

    with DDGS(timeout=10) as ddgs:
        for attempt in attempts:
            try:
                results = ddgs.text(
                    query,
                    max_results=max_results,
                    safesearch="moderate",
                    **attempt,
                )
            except Exception as error:
                last_error = error
                continue

            for result in results:
                url = result.get("href") or result.get("url")
                if url and url not in results_by_url:
                    results_by_url[url] = result

            if len(results_by_url) >= max_results:
                break

    if not results_by_url and last_error:
        raise SearchProviderError(f"DuckDuckGo 搜索失败：{last_error}") from last_error

    return list(results_by_url.values())[:max_results]
