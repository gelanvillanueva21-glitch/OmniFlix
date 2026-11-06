from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.router.auth_router import router as auth_router
from app.router.profile_router import router as profile_router

configuration_settings = get_settings()

app = FastAPI(title="OmniFlix Api")

# ── Register middleware ──────────────────────────────────────────
# CORS configuration allows credentialed requests (cookies) strictly from
# approved frontend origins. Wildcard origins ("*") are forbidden when
# allow_credentials is True.
app.add_middleware(
    CORSMiddleware,
    allow_origins=configuration_settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
)

# ── Register routers ─────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(profile_router)


@app.get("/")
async def health_check() -> dict[str, str]:
    """Basic health-check endpoint."""
    return {"status": "FastAPI Success"}

