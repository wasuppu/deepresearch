from typing import Literal

from pydantic import BaseModel, Field


class ModelRunConfig(BaseModel):
    api_format: Literal["openai", "anthropic"] = "openai"
    api_key: str = ""
    base_url: str = ""
    model: str = ""


class SearchRunConfig(BaseModel):
    provider: Literal["tavily", "duckduckgo"] = "tavily"
    api_key: str = ""
    source_limit_per_query: int = Field(default=3, ge=1, le=10)


class ContentRunConfig(BaseModel):
    clarifying_question_count: int = Field(default=4, ge=3, le=10)
    search_plan_question_count: int = Field(default=5, ge=3, le=10)
    report_tone: Literal["neutral", "concise", "analytical"] = "neutral"
    output_language: Literal["zh-CN", "en"] = "zh-CN"


class UiRunConfig(BaseModel):
    density: Literal["comfortable", "compact"] = "comfortable"


class RunConfiguration(BaseModel):
    model: ModelRunConfig = Field(default_factory=ModelRunConfig)
    search: SearchRunConfig = Field(default_factory=SearchRunConfig)
    content: ContentRunConfig = Field(default_factory=ContentRunConfig)
    ui: UiRunConfig = Field(default_factory=UiRunConfig)


class HealthResponse(BaseModel):
    service: str
    implementation: str
    status: str
    version: str


class ModelProbeRequest(BaseModel):
    message: str = "请用一句话回复：模型连接正常。"
    run_config: RunConfiguration | None = None


class ModelProbeResponse(BaseModel):
    model: str
    content: str


class ClarifyingQuestionRequest(BaseModel):
    topic: str
    run_config: RunConfiguration | None = None


class ClarifyingQuestionResponse(BaseModel):
    questions: list[str]


class ResearchBriefRequest(BaseModel):
    topic: str
    clarifying_questions: list[str]
    clarification: str
    run_config: RunConfiguration | None = None


class ResearchBriefResponse(BaseModel):
    brief: str


class SearchPlanRequest(BaseModel):
    brief: str
    run_config: RunConfiguration | None = None


class SearchPlanResponse(BaseModel):
    queries: list[str]


class ResearchSourcesRequest(BaseModel):
    queries: list[str]
    run_config: RunConfiguration | None = None


class ResearchSource(BaseModel):
    title: str
    url: str
    content: str
    query: str


class ResearchSourcesResponse(BaseModel):
    sources: list[ResearchSource]


class ResearchFindingsRequest(BaseModel):
    queries: list[str]
    run_config: RunConfiguration | None = None


class ResearchFinding(BaseModel):
    query: str
    finding: str
    sources: list[ResearchSource]


class ResearchFindingsResponse(BaseModel):
    findings: list[ResearchFinding]


class ResearchReportRequest(BaseModel):
    brief: str
    findings: list[ResearchFinding]
    run_config: RunConfiguration | None = None


class ResearchReportResponse(BaseModel):
    report: str
    references: list[ResearchSource]
