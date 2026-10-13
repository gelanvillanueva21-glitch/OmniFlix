from typing import Optional

from fastapi import HTTPException, status

from app.config import Settings
from app.model.user_model import UserModel
from app.repository.user_repository import UserRepository
from app.schema.user_schema import (
    PasswordChange,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)


class AuthService:
    """Business logic for authentication.

    Delegates database work to UserRepository and crypto work to
    utils/security — this layer owns only the orchestration.
    """

    def __init__(
        self,
        user_repository: UserRepository,
        configuration_settings: Settings,
    ) -> None:
        self._user_repository: UserRepository = user_repository
        self._configuration_settings: Settings = configuration_settings

    async def register(
        self, user_create_data: UserCreate
    ) -> tuple[UserResponse, str, str]:
        """Create a new user account and return (user, access, refresh)."""
        existing_user: Optional[UserModel] = (
            await self._user_repository.get_by_username(
                user_create_data.username
            )
        )
        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )

        hashed_password = hash_password(user_create_data.password)
        created_user: UserModel = await self._user_repository.create(
            user_create_data.username,
            hashed_password,
        )

        user_response = self._user_model_to_response(created_user)
        access_token = create_access_token(
            user_response.id, self._configuration_settings
        )
        refresh_token = create_refresh_token(
            user_response.id, self._configuration_settings
        )
        return user_response, access_token, refresh_token

    async def login(
        self, user_login_data: UserLogin
    ) -> tuple[UserResponse, str, str]:
        """Authenticate a user and return (user, access, refresh)."""
        existing_user: Optional[UserModel] = (
            await self._user_repository.get_by_username(
                user_login_data.username
            )
        )
        if existing_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not verify_password(
            user_login_data.password, existing_user.hashPassword
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        user_response = self._user_model_to_response(existing_user)
        access_token = create_access_token(
            user_response.id, self._configuration_settings
        )
        refresh_token = create_refresh_token(
            user_response.id, self._configuration_settings
        )
        return user_response, access_token, refresh_token

    async def change_password(
        self, user_identifier: int, password_change_data: PasswordChange
    ) -> None:
        """Change the password for an authenticated user."""
        existing_user: Optional[UserModel] = (
            await self._user_repository.get_by_id(user_identifier)
        )
        if existing_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if not verify_password(
            password_change_data.current_password, existing_user.hashPassword
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect",
            )

        hashed_new_password = hash_password(password_change_data.new_password)
        await self._user_repository.update_password(
            user_identifier, hashed_new_password
        )

    async def get_current_user(self, user_identifier: int) -> UserResponse:
        """Fetch the authenticated user's public information."""
        existing_user: Optional[UserModel] = (
            await self._user_repository.get_by_id(user_identifier)
        )
        if existing_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return self._user_model_to_response(existing_user)

    @staticmethod
    def _user_model_to_response(user_model: UserModel) -> UserResponse:
        """Map a UserModel instance to the public UserResponse schema."""
        role_value: str = (
            user_model.role.value
            if hasattr(user_model.role, "value")
            else str(user_model.role)
        )
        return UserResponse(
            id=user_model.id,
            username=user_model.username,
            role=role_value,
            created_at=user_model.createdAt,
        )


