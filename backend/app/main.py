from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.clarifying_question import clarifying_question_graph
from app.model import ModelClientError
from app.llm_client import model_probe_graph
from app.schemas import (
    ClarifyingQuestionRequest,
    ClarifyingQuestionResponse,
    HealthResponse,
    ModelProbeRequest,
    ModelProbeResponse,
)
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


@app.post("/model/probe", response_model=ModelProbeResponse)
async def probe_model(request: ModelProbeRequest) -> ModelProbeResponse:
    try:
        result = await model_probe_graph.ainvoke(
            {
                "message": request.message,
                "model": settings.llm_model,
                "content": "",
            }
        )
    except ModelClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"模型调用失败：{error}") from error

    return ModelProbeResponse(model=result["model"], content=result["content"])


@app.post("/research/clarifying-question", response_model=ClarifyingQuestionResponse)
async def create_clarifying_question(
    request: ClarifyingQuestionRequest,
) -> ClarifyingQuestionResponse:
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="研究主题不能为空。")

    try:
        result = await clarifying_question_graph.ainvoke(
            {"topic": request.topic.strip(), "question": ""}
        )
    except ModelClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=502, detail=f"澄清问题生成失败：{error}"
        ) from error

    return ClarifyingQuestionResponse(question=result["question"])
