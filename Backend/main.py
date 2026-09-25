import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.prediction import router as prediction_router
from routes.phase2 import router as phase2_router


app = FastAPI(title="TrustLoan AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8443",
        "http://localhost:5173",
        "https://trustloan-ai.vercel.app",
        *filter(None, [os.getenv("FRONTEND_ORIGIN")]),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "TrustLoan AI", "status": "running", "version": "1.0.0"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


app.include_router(prediction_router, prefix="/api")
app.include_router(phase2_router, prefix="/api")
