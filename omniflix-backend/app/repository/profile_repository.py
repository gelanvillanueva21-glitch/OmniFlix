
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.model.profile_model import ProfileModel as Profile


class ProfileRepository:
    """Handle all database operation for profile"""

    def __init__(self, database_session: AsyncSession):
        self._database_session = database_session

    async def get_prof_by_id(self, user_id: int) -> Profile | None:
        select_query = select(Profile).where(Profile.userId == user_id)
        result = await self._database_session.execute(select_query)
        return result.scalar_one_or_none()


    async def create(self, user_id: int, username: str) -> Profile:
        profile = Profile(
            userId=user_id,
            displayName=username
        )
        self._database_session.add(profile)
        await self._database_session.commit()
        await self._database_session.refresh(profile)
        return profile

    async def getProfileUrl(self, user_id: int) -> str | None:
        select_query = select(Profile.profileUrlPicture).where(Profile.userId == user_id)
        result = await self._database_session.execute(select_query)
        return result.scalar_one_or_none()

    async def changeProfileUrl(
        self,
        user_id: int,
        profile_url: str,
    ) -> None:
        select_query = select(Profile).where(Profile.userId == user_id)
        result = await self._database_session.execute(select_query)
        profile = result.scalar_one_or_none()
        if profile:
            profile.profileUrlPicture = profile_url
            profile.updateAt = datetime.now(UTC).replace(tzinfo=None)
            await self._database_session.commit()

    async def changeDisplayName(
        self,
        user_id: int,
        display_name: str,
    ) -> str | None:
        select_query = select(Profile).where(Profile.userId == user_id)
        result = await self._database_session.execute(select_query)
        profile = result.scalar_one_or_none()
        if profile:
            profile.displayName = display_name
            profile.updateAt = datetime.now(UTC).replace(tzinfo=None)
            await self._database_session.commit()
        return profile.displayName if profile else None
