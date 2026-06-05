from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import HealthResponse
from app.settings import settings


app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

