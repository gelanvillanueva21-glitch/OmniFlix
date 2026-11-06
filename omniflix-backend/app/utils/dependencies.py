"""Reusable FastAPI dependencies and typed aliases.

Keeps router code clean by centralising injection boilerplate here.
See utils/.note for the rationale behind this file.
"""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db_session
from app.repository.user_repository import UserRepository
from app.repository.profile_repository import ProfileRepository
from app.schema.user_schema import UserResponse
from app.service.auth_service import AuthService
from app.service.profile_service import ProfileService
from app.utils.security import create_access_token, decode_token

# ── Typed aliases for dependency injection ────────────────────────

DbSessionDeps = Annotated[AsyncSession, Depends(get_db_session)]
SettingsDeps = Annotated[Settings, Depends(get_settings)]


# ── Service factories ────────────────────────────────────────────

def get_auth_service(
    db: DbSessionDeps,
    settings: SettingsDeps,
) -> AuthService:
    """Build an AuthService wired to the current request's DB session."""
    user_repository = UserRepository(db)
    prof_repository = ProfileRepository(db)
    return AuthService(user_repository, prof_repository, settings)



AuthServiceDeps = Annotated[AuthService, Depends(get_auth_service)]


def get_profile_service(
    db: DbSessionDeps,
    settings: SettingsDeps,
) -> ProfileService:
    """Build a ProfileService wired to the current request's DB session."""
    profile_repository = ProfileRepository(db)
    return ProfileService(profile_repository, settings)


ProfileServiceDeps = Annotated[ProfileService, Depends(get_profile_service)]


# ── Authentication dependency ───────────────────────────────────

async def get_current_user(
    request: Request,
    response: Response,
    db: DbSessionDeps,
    settings: SettingsDeps,
) -> UserResponse:
    """Extract the authenticated user from cookies.

    Flow:
    1. Try the access_token cookie — if valid, return the user.
    2. If the access token is expired, try the refresh_token cookie.
        On success, issue a fresh access_token cookie transparently so
        the user stays logged in for 7 days without noticing.
    3. If both tokens are missing or invalid → 401.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )

    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")

    user_id: int | None = None

    # ── Step 1: try access token ──
    if access_token:
        try:
            payload = decode_token(access_token, settings)
            if payload.get("type") != "access":
                raise credentials_error
            user_id = int(str(payload["sub"]))
        except jwt.ExpiredSignatureError:
            pass  # fall through to refresh
        except (jwt.InvalidTokenError, KeyError, ValueError):
            raise credentials_error

    # ── Step 2: try refresh token (auto-rotate access token) ──
    if user_id is None:
        if not refresh_token:
            raise credentials_error
        try:
            payload = decode_token(refresh_token, settings)
            if payload.get("type") != "refresh":
                raise credentials_error
            user_id = int(str(payload["sub"]))

            # Transparently issue a fresh access token
            new_access = create_access_token(user_id, settings)
            response.set_cookie(
                key="access_token",
                value=new_access,
                httponly=True,
                samesite="lax",
                secure=False,  # TODO: set True behind HTTPS in production
                max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                path="/",
            )
        except (jwt.InvalidTokenError, KeyError, ValueError):
            raise credentials_error

    # ── Step 3: fetch user from DB ──
    user_repository = UserRepository(db)
    prof_repository = ProfileRepository(db)
    service = AuthService(user_repository, prof_repository, settings)
    return await service.get_current_user(user_id)


CurrentUserDeps = Annotated[UserResponse, Depends(get_current_user)]
