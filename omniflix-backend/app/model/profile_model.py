from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.model.user_model import UserModel


class ProfileModel(Base):
    """SQLAlchemy ORM model mapping the existing Prisma-managed "Profile" table."""

    __tablename__ = "Profile"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    userId: Mapped[int] = mapped_column(
        ForeignKey("User.id"),
        unique=True,
        nullable=False,
    )
    displayName: Mapped[str] = mapped_column(
        nullable=True,
    )
    profileUrlPicture: Mapped[str] = mapped_column(
        nullable=True,
    )
    createdAt: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    updateAt: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True,
    )

    # One-to-one relationship with UserModel
    user: Mapped["UserModel"] = relationship(
        back_populates="profile",
    )
