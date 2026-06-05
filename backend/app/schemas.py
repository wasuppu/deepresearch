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
