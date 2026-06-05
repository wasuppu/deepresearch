from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.model_probe_graph import ModelClientError, model_probe_graph
from app.schemas import HealthResponse, ModelProbeRequest, ModelProbeResponse
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
