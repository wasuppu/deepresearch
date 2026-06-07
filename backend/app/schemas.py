from pydantic import BaseModel


class HealthResponse(BaseModel):
    service: str
    implementation: str
    status: str
    version: str


class ModelProbeRequest(BaseModel):
    message: str = "请用一句话回复：模型连接正常。"


class ModelProbeResponse(BaseModel):
    model: str
    content: str


class ClarifyingQuestionRequest(BaseModel):
    topic: str


class ClarifyingQuestionResponse(BaseModel):
    questions: list[str]


class ResearchBriefRequest(BaseModel):
    topic: str
    clarifying_questions: list[str]
    clarification: str


class ResearchBriefResponse(BaseModel):
    brief: str


class SearchPlanRequest(BaseModel):
    brief: str


class SearchPlanResponse(BaseModel):
    queries: list[str]


class ResearchSourcesRequest(BaseModel):
    queries: list[str]


class ResearchSource(BaseModel):
    title: str
    url: str
    content: str
    query: str


class ResearchSourcesResponse(BaseModel):
    sources: list[ResearchSource]


class ResearchFindingsRequest(BaseModel):
    queries: list[str]


class ResearchFinding(BaseModel):
    query: str
    finding: str
    sources: list[ResearchSource]


class ResearchFindingsResponse(BaseModel):
    findings: list[ResearchFinding]


class ResearchReportRequest(BaseModel):
    brief: str
    findings: list[ResearchFinding]


class ResearchReportResponse(BaseModel):
    report: str
    references: list[ResearchSource]
