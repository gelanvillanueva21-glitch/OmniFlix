from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class UserCreate(BaseModel):
    """Schema for user registration requests."""

    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def normalise_username(cls, value: str) -> str:
        return value.strip().lower()


class UserLogin(BaseModel):
    """Schema for user login requests."""

    username: str
    password: str

    @field_validator("username")
    @classmethod
    def normalise_username(cls, value: str) -> str:
        return value.strip().lower()


class PasswordChange(BaseModel):
    """Schema for changing the current user's password."""

    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def passwords_must_differ(cls, value: str, info) -> str:  # noqa: ANN001
        if "current_password" in info.data and value == info.data["current_password"]:
            raise ValueError("New password must differ from the current password")
        return value


class UserResponse(BaseModel):
    """Schema returned to the client — never includes the password hash."""

    id: int
    username: str
    role: str
    created_at: datetime
