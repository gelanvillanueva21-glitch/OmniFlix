"""Profile endpoints.

This router only handles HTTP concerns (request parsing, response
building).  All business logic lives in ProfileService.
"""

from fastapi import APIRouter, UploadFile, status

from app.schema.profile_schema import DisplayNameUpdate, ProfileResponse
from app.utils.dependencies import CurrentUserDeps, ProfileServiceDeps

router = APIRouter(prefix="/profile", tags=["Profile"])


# ── Protected endpoints ──────────────────────────────────────────


@router.get("/", response_model=ProfileResponse)
async def get_profile_info(
    current_user: CurrentUserDeps,
    service: ProfileServiceDeps,
) -> ProfileResponse:
    """Return the authenticated user's full profile."""
    return await service.getProfileInfo(current_user.id)


@router.put("/display-name", response_model=ProfileResponse)
async def update_display_name(
    data: DisplayNameUpdate,
    current_user: CurrentUserDeps,
    service: ProfileServiceDeps,
) -> ProfileResponse:
    """Update the authenticated user's display name."""
    return await service.update_display_name(current_user.id, data)


@router.put("/picture", response_model=ProfileResponse)
async def update_profile_picture(
    picture: UploadFile,
    current_user: CurrentUserDeps,
    service: ProfileServiceDeps,
) -> ProfileResponse:
    """Upload a new profile picture for the authenticated user."""
    return await service.update_profile_picture(current_user.id, picture)


@router.delete("/", status_code=status.HTTP_200_OK)
async def delete_profile_picture(
    current_user: CurrentUserDeps,
    service: ProfileServiceDeps,
) -> dict[str, str]:
    """Remove the authenticated user's profile picture."""
    await service.delete_profile_picture(current_user.id)
    return {"status": "successfully deleted profile picture"}
