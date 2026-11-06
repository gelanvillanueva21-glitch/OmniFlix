import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.repository.profile_repository import ProfileRepository
from app.schema.user_schema import UserResponse
from app.service.profile_service import ProfileService
from app.utils.dependencies import get_current_user, get_profile_service


class FakeProfileRepository:
    def __init__(self) -> None:
        self.profile = SimpleNamespace(
            userId=23,
            displayName="Test profile",
            profileUrlPicture=None,
            createdAt=datetime(2026, 1, 1),
            updateAt=None,
        )

    async def get_prof_by_id(self, user_id: int) -> SimpleNamespace:
        self.profile.userId = user_id
        return self.profile

    async def changeDisplayName(self, user_id: int, display_name: str) -> None:
        self.profile.displayName = display_name

    async def changeProfileUrl(self, user_id: int, profile_url: str) -> None:
        self.profile.profileUrlPicture = profile_url


class FakeDatabaseResult:
    def __init__(self, profile: SimpleNamespace) -> None:
        self._profile = profile

    def scalar_one_or_none(self) -> SimpleNamespace:
        return self._profile


class ProfileApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.profile_upload_directory = (
            Path(self.temporary_directory.name) / "profile_pictures"
        )
        self.profile_repository = FakeProfileRepository()
        settings = Settings.model_construct(
            PROFILE_UPLOAD_DIR=self.profile_upload_directory
        )
        self.profile_service = ProfileService(self.profile_repository, settings)
        self.original_dependency_overrides = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: UserResponse(
            id=23,
            username="test-user",
            role="NORMAL",
            created_at=datetime(2026, 1, 1),
        )
        app.dependency_overrides[get_profile_service] = (
            lambda: self.profile_service
        )
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.client.close()
        app.dependency_overrides.clear()
        app.dependency_overrides.update(self.original_dependency_overrides)
        self.temporary_directory.cleanup()

    def test_get_profile_does_not_create_upload_directory(self) -> None:
        response = self.client.get("/profile/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["display_name"], "Test profile")
        self.assertFalse(self.profile_upload_directory.exists())

    def test_update_display_name_returns_updated_profile(self) -> None:
        response = self.client.put(
            "/profile/display-name",
            json={"display_name": "Updated profile"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["display_name"], "Updated profile")

    def test_profile_picture_upload_creates_file_in_configured_directory(self) -> None:
        response = self.client.put(
            "/profile/picture",
            files={"picture": ("avatar.png", b"test-picture", "image/png")},
        )

        self.assertEqual(response.status_code, 200)
        picture_filename = response.json()["profile_picture_url"]
        self.assertIsNotNone(picture_filename)
        self.assertEqual(
            (self.profile_upload_directory / picture_filename).read_bytes(),
            b"test-picture",
        )


class ProfileRepositoryTests(unittest.IsolatedAsyncioTestCase):
    async def test_display_name_update_sets_naive_utc_timestamp(self) -> None:
        profile = SimpleNamespace(displayName="Original", updateAt=None)
        database_session = SimpleNamespace(
            execute=AsyncMock(return_value=FakeDatabaseResult(profile)),
            commit=AsyncMock(),
        )
        repository = ProfileRepository(database_session)

        await repository.changeDisplayName(23, "Updated")

        self.assertEqual(profile.displayName, "Updated")
        self.assertIsInstance(profile.updateAt, datetime)
        self.assertIsNone(profile.updateAt.tzinfo)
        database_session.commit.assert_awaited_once()

    async def test_profile_picture_update_sets_naive_utc_timestamp(self) -> None:
        profile = SimpleNamespace(profileUrlPicture=None, updateAt=None)
        database_session = SimpleNamespace(
            execute=AsyncMock(return_value=FakeDatabaseResult(profile)),
            commit=AsyncMock(),
        )
        repository = ProfileRepository(database_session)

        await repository.changeProfileUrl(23, "new-picture.png")

        self.assertEqual(profile.profileUrlPicture, "new-picture.png")
        self.assertIsInstance(profile.updateAt, datetime)
        self.assertIsNone(profile.updateAt.tzinfo)
        database_session.commit.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
