from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.model import init_configured_chat_model


class SearchPlanState(TypedDict):
    brief: str
    queries: list[str]


def parse_queries(content: str) -> list[str]:
    queries: list[str] = []

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        line = line.lstrip("-*0123456789.、) ")
        if line and line not in queries:
            queries.append(line)

    return queries[:5]


async def generate_queries(state: SearchPlanState) -> SearchPlanState:
    model = init_configured_chat_model(temperature=0.2)
    response = await model.ainvoke(
        [
            SystemMessage(
                content=(
                    "你是一个中文 Deep Research 检索规划助手。"
                    "你只负责把 research brief 拆成适合搜索引擎使用的检索问题。"
                    "每行输出一个检索问题，不要编号以外的解释，不要输出 JSON。"
                )
            ),
            HumanMessage(
                content=(
                    "请基于下面的 research brief 生成 3 到 5 个中文检索问题。"
                    "查询应覆盖事实背景、关键主体、最新进展、争议点和数据来源。\n\n"
                    f"Research brief：{state['brief']}"
                )
            ),
        ]
    )
    queries = parse_queries(str(response.content))

    return {"brief": state["brief"], "queries": queries}


builder = StateGraph(SearchPlanState)
builder.add_node("generate_queries", generate_queries)
builder.add_edge(START, "generate_queries")
builder.add_edge("generate_queries", END)

search_plan_graph = builder.compile()

