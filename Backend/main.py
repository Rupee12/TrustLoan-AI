import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from routes.prediction import router as prediction_router
from routes.phase2 import router as phase2_router


class RequestSizeLimitMiddleware:
    def __init__(self, app: ASGIApp, max_bytes: int = 65_536) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        body = bytearray()
        more_body = True
        while more_body:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            body.extend(message.get("body", b""))
            if len(body) > self.max_bytes:
                await send(
                    {
                        "type": "http.response.start",
                        "status": 413,
                        "headers": [(b"content-type", b"application/json")],
                    }
                )
                await send(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail":"Request body is too large."}',
                    }
                )
                return
            more_body = message.get("more_body", False)

        body_bytes = bytes(body)
        replayed = False

        async def replay_receive() -> Message:
            nonlocal replayed
            if not replayed:
                replayed = True
                return {"type": "http.request", "body": body_bytes, "more_body": False}
            return await receive()

        await self.app(scope, replay_receive, send)


app = FastAPI(title="TrustLoan AI", version="1.0.0")
app.add_middleware(RequestSizeLimitMiddleware)
configured_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]
legacy_origin = os.getenv("FRONTEND_ORIGIN")
if legacy_origin:
    configured_origins.append(legacy_origin.strip())
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8443",
        "http://localhost:5173",
        "https://trustloan-ai.vercel.app",
        *configured_origins,
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
