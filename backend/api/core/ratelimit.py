"""Tiny in-memory sliding-window rate limiter (per user, per bucket).

Replaces the previous Redis-based limiter so the stack only needs
frontend + backend + PostgreSQL. Suitable for a single backend process.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, status

from api.core.deps import get_current_user
from api.public.auth.models import User

_lock = threading.Lock()
_hits: dict[tuple[str, int], deque] = defaultdict(deque)


def check_rate_limit(bucket: str, user_id: int, times: int, seconds: int) -> None:
    now = time.monotonic()
    key = (bucket, user_id)
    with _lock:
        window = _hits[key]
        while window and now - window[0] > seconds:
            window.popleft()
        if len(window) >= times:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, please slow down and try again shortly.",
            )
        window.append(now)


def reset_rate_limits() -> None:
    with _lock:
        _hits.clear()


def rate_limit(bucket: str, times: int, seconds: int):
    def dependency(user: User = Depends(get_current_user)) -> User:
        check_rate_limit(bucket, user.id, times, seconds)
        return user

    return dependency

