from fastapi import FastAPI
from app.router.auth_router import router as auth_router

app = FastAPI(title="OmniFlix Api")

# ── Register routers ─────────────────────────────────────────────
app.include_router(auth_router)


@app.get("/")
async def health_check() -> dict[str, str]:
    """Basic health-check endpoint."""
    return {"status": "FastAPI Success"}
