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
    question: str


class ResearchBriefRequest(BaseModel):
    topic: str
    clarifying_question: str
    clarifying_answer: str


class ResearchBriefResponse(BaseModel):
    brief: str


class SearchPlanRequest(BaseModel):
    brief: str


class SearchPlanResponse(BaseModel):
    queries: list[str]
