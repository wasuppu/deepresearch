from pydantic import BaseModel


class HealthResponse(BaseModel):
    service: str
    implementation: str
    status: str
    version: str

