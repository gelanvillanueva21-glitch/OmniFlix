from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.config import Settings

# Singleton hasher — Argon2id is the recommended algorithm for password storage.
_password_hasher = PasswordHash((Argon2Hasher(),))


def hash_password(password: str) -> str:
    """Hash a plain-text password with Argon2id."""
    return _password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against an Argon2id hash."""
    return _password_hasher.verify(plain_password, hashed_password)


def create_access_token(user_id: int, settings: Settings) -> str:
    """Create a short-lived JWT access token (stored in an HttpOnly cookie)."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )
    payload: dict[str, object] = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: int, settings: Settings) -> str:
    """Create a long-lived JWT refresh token (stored in an HttpOnly cookie)."""
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )
    payload: dict[str, object] = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str, settings: Settings) -> dict[str, object]:
    """Decode and validate a JWT token.  Raises jwt exceptions on failure."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )

