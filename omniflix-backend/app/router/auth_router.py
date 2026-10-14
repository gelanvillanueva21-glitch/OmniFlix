"""Authentication endpoints.

This router only handles HTTP concerns (request parsing, response
building, cookie management).  All business logic lives in AuthService.
"""

from fastapi import APIRouter, Response, status
from app.config import Settings
from app.schema.user_schema import (
    PasswordChange,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.utils.dependencies import (
    AuthServiceDeps,
    CurrentUserDeps,
    SettingsDeps,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Public endpoints ─────────────────────────────────────────────


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: UserCreate,
    response: Response,
    service: AuthServiceDeps,
    settings: SettingsDeps,
) -> UserResponse:
    """Create a new account and auto-login (both cookies set)."""
    user, access_token, refresh_token = await service.register(data)
    _set_auth_cookies(response, access_token, refresh_token, settings)
    return user


@router.post("/login", response_model=UserResponse)
async def login(
    data: UserLogin,
    response: Response,
    service: AuthServiceDeps,
    settings: SettingsDeps,
) -> UserResponse:
    """Authenticate and set both cookies."""
    user, access_token, refresh_token = await service.login(data)
    _set_auth_cookies(response, access_token, refresh_token, settings)
    return user


# ── Protected endpoints ──────────────────────────────────────────


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    response: Response,
    _current_user: CurrentUserDeps,
) -> None:
    """Clear auth cookies (requires a valid session)."""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return { "status": "successfully logout" }


@router.put("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: PasswordChange,
    current_user: CurrentUserDeps,
    service: AuthServiceDeps,
) -> None:
    """Change the authenticated user's password."""
    await service.change_password(current_user.id, data)
    return { "status": "successfully changed password" }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUserDeps) -> UserResponse:
    """Return the currently authenticated user's info."""
    return current_user


# ── Cookie helper ────────────────────────────────────────────────


def _set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    settings: Settings,
) -> None:
    """Set HttpOnly auth cookies on the outgoing response."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # TODO: set True behind HTTPS in production
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,  # TODO: set True behind HTTPS in production
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )

