from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.model.user_model import RoleEnum, UserModel as User


class UserRepository:
    """Handles all database operations for the User table using SQLAlchemy ORM."""

    def __init__(self, database_session: AsyncSession) -> None:
        self._database_session: AsyncSession = database_session

    async def get_by_id(self, user_identifier: int) -> Optional[User]:
        """Fetch a single user by primary key using SQLAlchemy ORM select."""
        select_query = select(User).where(User.id == user_identifier)
        query_result = await self._database_session.execute(select_query)
        return query_result.scalars().first()

    async def get_by_username(self, username: str) -> Optional[User]:
        """Fetch a single user by username using SQLAlchemy ORM select."""
        select_query = select(User).where(User.username == username)
        query_result = await self._database_session.execute(select_query)
        return query_result.scalars().first()

    async def create(
        self, username: str, hashed_password: str
    ) -> User:
        """Insert a new user using the UserModel ORM entity with RoleEnum.NORMAL."""
        new_user = User(
            username=username,
            hashPassword=hashed_password,
            role=RoleEnum.NORMAL,
        )
        self._database_session.add(new_user)
        await self._database_session.flush()
        await self._database_session.refresh(new_user)
        return new_user

    async def update_password(
        self, user_identifier: int, hashed_password: str
    ) -> None:
        """Update a user's hashed password using SQLAlchemy ORM update statement."""
        update_statement = (
            update(User)
            .where(User.id == user_identifier)
            .values(hashPassword=hashed_password)
        )
        await self._database_session.execute(update_statement)


