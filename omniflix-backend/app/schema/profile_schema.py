from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ProfileResponse(BaseModel):
    """Schema returned to the client for a user's profile."""
    id: int
    user_id: int
    display_name: str | None = None
    profile_picture_url: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class DisplayNameUpdate(BaseModel):
    """Schema for updating the display name."""

    display_name: str = Field(min_length=1, max_length=50)

    @field_validator("display_name")
    @classmethod
    def strip_display_name(cls, value: str) -> str:
        return value.strip()
