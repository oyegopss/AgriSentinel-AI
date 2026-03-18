from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes import api_router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    This factory wires core middleware and routers so the app can
    scale cleanly as new modules are added.
    """
    # Load environment variables from a local .env if present
    load_dotenv()

    app = FastAPI(
        title="AgriSentinel AI Backend",
        description=(
            "Backend services for AgriSentinel AI – crop disease detection, "
            "yield prediction, and smart mandi intelligence."
        ),
        version="0.1.0",
    )

    # CORS – open for now; lock this down to specific origins in production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Basic health endpoint on root for uptime checks
    @app.get("/", tags=["health"])
    async def health_root() -> dict:
        return {"message": "AgriSentinel AI Backend Running"}

    # Mount all versioned API routers under /api
    app.include_router(api_router, prefix="/api")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
