

import secrets
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from app.config import Settings
from app.model.profile_model import ProfileModel as Profile
from app.repository.profile_repository import ProfileRepository
from app.schema.profile_schema import DisplayNameUpdate, ProfileResponse

# Only image formats are accepted as profile pictures.
_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# 5 MB cap — keeps uploads sane and protects the disk.
_MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024


class ProfileService:
    """Business logic for profiles.

    Delegates database work to ProfileRepository; this layer owns the
    orchestration, validation, and profile-picture file handling.
    """

    def __init__(
        self,
        profile_repository: ProfileRepository,
        configuration_settings: Settings,
    ) -> None:
        self._profile_repository = profile_repository
        self._configuration_settings = configuration_settings

        self._upload_dir: Path = configuration_settings.PROFILE_UPLOAD_DIR

    async def getProfileInfo(self, user_id: int) -> ProfileResponse:
        """Return the full profile for a user: display name, picture URL, etc."""
        profile: Optional[Profile] = (
            await self._profile_repository.get_prof_by_id(user_id)
        )
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found",
            )
        return self._profile_model_to_response(profile)

    async def update_display_name(
        self, user_id: int, display_name_update: DisplayNameUpdate
    ) -> ProfileResponse:
        """Update the user's display name and return the fresh profile."""
        profile: Optional[Profile] = (
            await self._profile_repository.get_prof_by_id(user_id)
        )
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found",
            )

        await self._profile_repository.changeDisplayName(
            user_id, display_name_update.display_name
        )
        # Re-fetch so the response reflects what is actually stored.
        updated_profile: Optional[Profile] = (
            await self._profile_repository.get_prof_by_id(user_id)
        )
        return self._profile_model_to_response(updated_profile)

    async def update_profile_picture(
        self, user_id: int, picture: UploadFile
    ) -> ProfileResponse:
        """Save an uploaded picture to disk and store its generated name in the DB.

        The file is written to the uploads directory under a cryptographically
        random name (via ``secrets.token_hex``) so it can never collide and the
        original filename is never trusted. The stored value in the database is
        the generated filename.
        """
        profile: Optional[Profile] = (
            await self._profile_repository.get_prof_by_id(user_id)
        )
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found",
            )

        if not picture.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided",
            )

        extension = Path(picture.filename).suffix.lower()
        if extension not in _ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported image format",
            )

        # Enforce the size limit while streaming the file to disk so we never
        # buffer an oversized upload fully in memory.
        generated_name = f"{secrets.token_hex(16)}{extension}"
        destination = self._upload_dir / generated_name

        bytes_written = 0
        try:
            self._upload_dir.mkdir(parents=True, exist_ok=True)
            with destination.open("wb") as out_file:
                while chunk := await picture.read(1024 * 1024):
                    bytes_written += len(chunk)
                    if bytes_written > _MAX_UPLOAD_SIZE_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="Image is too large (max 5 MB)",
                        )
                    out_file.write(chunk)
        except HTTPException:
            # Clean up the partial file before propagating the error.
            destination.unlink(missing_ok=True)
            raise
        except OSError:
            destination.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not save the uploaded image",
            )

        # Remove the old picture file so we don't accumulate orphans on disk.
        old_name = profile.profileUrlPicture
        if old_name:
            old_path = self._upload_dir / old_name
            if old_path.is_file():
                old_path.unlink(missing_ok=True)

        await self._profile_repository.changeProfileUrl(user_id, generated_name)

        updated_profile: Optional[Profile] = (
            await self._profile_repository.get_prof_by_id(user_id)
        )
        return self._profile_model_to_response(updated_profile)

    async def delete_profile_picture(self, user_id: int) -> None:
        """Remove the user's profile picture from disk and the database."""
        profile: Optional[Profile] = (
            await self._profile_repository.get_prof_by_id(user_id)
        )
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found",
            )

        if not profile.profileUrlPicture:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No profile picture to delete",
            )

        # Delete the file from disk first.
        stored_name = self._upload_dir / profile.profileUrlPicture
        if stored_name.is_file():
            stored_name.unlink(missing_ok=True)

        # Clear the reference in the database.
        await self._profile_repository.changeProfileUrl(user_id, "")

    @staticmethod
    def _profile_model_to_response(profile_model: Profile) -> ProfileResponse:
        """Map a ProfileModel instance to the public ProfileResponse schema."""
        return ProfileResponse(
            id=profile_model.id,
            user_id=profile_model.userId,
            display_name=profile_model.displayName,
            profile_picture_url=profile_model.profileUrlPicture,
            created_at=profile_model.createdAt,
            updated_at=profile_model.updateAt,
        )

