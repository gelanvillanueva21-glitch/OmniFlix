import enum
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, func, text
from sqlalchemy.dialects.postgresql import ENUM as PostgresEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.model.profile_model import ProfileModel


class RoleEnum(str, enum.Enum):
    """User account roles matching PostgreSQL and Prisma Role enum values."""

    NORMAL = "NORMAL"
    ADMIN = "ADMIN"


# PostgreSQL enum definition mapped to the existing "Role" type without creating or altering it.
role_enum_postgres_type = PostgresEnum(
    RoleEnum,
    name="Role",
    create_type=False,
    values_callable=lambda enum_class: [enum_member.value for enum_member in enum_class],
)


class UserModel(Base):
    """SQLAlchemy ORM model mapping the existing Prisma-managed "User" table."""

    __tablename__ = "User"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    username: Mapped[str] = mapped_column(
        unique=True,
        nullable=False,
    )
    hashPassword: Mapped[str] = mapped_column(
        nullable=False,
    )
    role: Mapped[RoleEnum] = mapped_column(
        role_enum_postgres_type,
        nullable=False,
        default=RoleEnum.NORMAL,
        server_default=text("'NORMAL'::\"Role\""),
    )
    createdAt: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    # One-to-one relationship with ProfileModel
    profile: Mapped[Optional["ProfileModel"]] = relationship(
        back_populates="user",
        uselist=False,
    )

