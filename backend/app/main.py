from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.clarifying_question import clarifying_question_graph
from app.model import ModelClientError
from app.llm_client import model_probe_graph
from app.research_brief import research_brief_graph
from app.research_errors import SearchProviderError
from app.research_findings import research_findings_graph
from app.research_report import research_report_graph
from app.research_sources import research_sources_graph
from app.search_plan import search_plan_graph
from app.runtime_config import reset_runtime_config, set_runtime_config
from app.schemas import (
    ClarifyingQuestionRequest,
    ClarifyingQuestionResponse,
    HealthResponse,
    ModelProbeRequest,
    ModelProbeResponse,
    ResearchBriefRequest,
    ResearchBriefResponse,
    ResearchFindingsRequest,
    ResearchFindingsResponse,
    ResearchReportRequest,
    ResearchReportResponse,
    ResearchSourcesRequest,
    ResearchSourcesResponse,
    SearchPlanRequest,
    SearchPlanResponse,
)
from app.settings import settings

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        service=settings.app_name,
        implementation="langgraph",
        status="ok",
        version=settings.app_version,
    )


@app.post("/model/probe", response_model=ModelProbeResponse)
async def probe_model(request: ModelProbeRequest) -> ModelProbeResponse:
    runtime_token = set_runtime_config(request.run_config)
    try:
        result = await model_probe_graph.ainvoke({"message": request.message, "model": "", "content": ""})
    except ModelClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"模型调用失败：{error}") from error
    finally:
        reset_runtime_config(runtime_token)

    return ModelProbeResponse(model=result["model"], content=result["content"])


@app.post("/research/clarifying-question", response_model=ClarifyingQuestionResponse)
async def create_clarifying_question(
    request: ClarifyingQuestionRequest,
) -> ClarifyingQuestionResponse:
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="研究主题不能为空。")

    runtime_token = set_runtime_config(request.run_config)
    try:
        result = await clarifying_question_graph.ainvoke(
            {"topic": request.topic.strip(), "questions": []}
        )
    except ModelClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=502, detail=f"澄清问题生成失败：{error}"
        ) from error
    finally:
        reset_runtime_config(runtime_token)

    return ClarifyingQuestionResponse(questions=result["questions"])


@app.post("/research/brief", response_model=ResearchBriefResponse)
async def create_research_brief(request: ResearchBriefRequest) -> ResearchBriefResponse:
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="研究主题不能为空。")
    clarifying_questions = [question.strip() for question in request.clarifying_questions if question.strip()]
    if not clarifying_questions:
        raise HTTPException(status_code=400, detail="澄清问题不能为空。")
    if not request.clarification.strip():
        raise HTTPException(status_code=400, detail="澄清回答不能为空。")

    runtime_token = set_runtime_config(request.run_config)
    try:
        result = await research_brief_graph.ainvoke(
            {
                "topic": request.topic.strip(),
                "clarifying_questions": clarifying_questions,
                "clarification": request.clarification.strip(),
                "brief": "",
            }
        )
    except ModelClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"研究 brief 生成失败：{error}") from error
    finally:
        reset_runtime_config(runtime_token)

    return ResearchBriefResponse(brief=result["brief"])


@app.post("/research/search-plan", response_model=SearchPlanResponse)
async def create_search_plan(request: SearchPlanRequest) -> SearchPlanResponse:
    if not request.brief.strip():
        raise HTTPException(status_code=400, detail="研究 brief 不能为空。")

    runtime_token = set_runtime_config(request.run_config)
    try:
        result = await search_plan_graph.ainvoke(
            {"brief": request.brief.strip(), "queries": []}
        )
    except ModelClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"检索计划生成失败：{error}") from error
    finally:
        reset_runtime_config(runtime_token)

    return SearchPlanResponse(queries=result["queries"])


@app.post("/research/sources", response_model=ResearchSourcesResponse)
async def fetch_research_sources(request: ResearchSourcesRequest) -> ResearchSourcesResponse:
    queries = [query.strip() for query in request.queries if query.strip()]
    if not queries:
        raise HTTPException(status_code=400, detail="检索问题不能为空。")

    runtime_token = set_runtime_config(request.run_config)
    try:
        result = await research_sources_graph.ainvoke({"queries": queries, "sources": []})
    except SearchProviderError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Research Sources 获取失败：{error}") from error
    finally:
        reset_runtime_config(runtime_token)

    return ResearchSourcesResponse(sources=result["sources"])


@app.post("/research/findings", response_model=ResearchFindingsResponse)
async def create_research_findings(request: ResearchFindingsRequest) -> ResearchFindingsResponse:
    queries = [query.strip() for query in request.queries if query.strip()]
    if not queries:
        raise HTTPException(status_code=400, detail="检索问题不能为空。")

    runtime_token = set_runtime_config(request.run_config)
    try:
        result = await research_findings_graph.ainvoke({"queries": queries, "findings": []})
    except SearchProviderError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except ModelClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Research Findings 生成失败：{error}") from error
    finally:
        reset_runtime_config(runtime_token)

    return ResearchFindingsResponse(findings=result["findings"])


@app.post("/research/report", response_model=ResearchReportResponse)
async def create_research_report(request: ResearchReportRequest) -> ResearchReportResponse:
    if not request.brief.strip():
        raise HTTPException(status_code=400, detail="研究 brief 不能为空。")

    findings = [finding for finding in request.findings if finding.finding.strip()]
    if not findings:
        raise HTTPException(status_code=400, detail="研究发现不能为空。")

    runtime_token = set_runtime_config(request.run_config)
    try:
        result = await research_report_graph.ainvoke(
            {"brief": request.brief.strip(), "findings": findings, "report": "", "references": []}
        )
    except ModelClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Research Report 生成失败：{error}") from error
    finally:
        reset_runtime_config(runtime_token)

    return ResearchReportResponse(report=result["report"], references=result["references"])
