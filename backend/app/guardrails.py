"""Rate limits and upload checks to protect Anthropic API spend."""

from __future__ import annotations

import threading
from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import HTTPException, Request

from app.config import settings

_lock = threading.Lock()
_extract_hour: dict[str, list[datetime]] = defaultdict(list)
_extract_day: dict[tuple[str, date], int] = defaultdict(int)
_global_extract_day: dict[date, int] = defaultdict(int)
_pdf_ops_minute: dict[str, list[datetime]] = defaultdict(list)


def _today() -> date:
    return datetime.utcnow().date()


def _prune_hourly(bucket: list[datetime], window: timedelta) -> list[datetime]:
    cutoff = datetime.utcnow() - window
    return [t for t in bucket if t > cutoff]


def _prune_minute(bucket: list[datetime]) -> list[datetime]:
    return _prune_hourly(bucket, timedelta(minutes=1))


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _check_demo_token(request: Request) -> None:
    if not settings.demo_access_token:
        return
    token = request.headers.get("x-demo-token", "")
    if token != settings.demo_access_token:
        raise HTTPException(403, "Demo access token required")


def validate_pdf_bytes(pdf_bytes: bytes) -> None:
    if len(pdf_bytes) > settings.max_pdf_bytes:
        mb = settings.max_pdf_bytes / (1024 * 1024)
        raise HTTPException(413, f"PDF too large. Maximum size is {mb:.0f} MB.")
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(400, "File does not look like a valid PDF.")


def validate_page_count(page_count: int) -> None:
    if page_count > settings.max_pdf_pages:
        raise HTTPException(
            400,
            f"PDF has too many pages ({page_count}). Maximum is {settings.max_pdf_pages}.",
        )


def check_pdf_op_allowed(request: Request) -> str:
    _check_demo_token(request)
    ip = client_ip(request)
    with _lock:
        bucket = _prune_minute(_pdf_ops_minute[ip])
        if len(bucket) >= settings.pdf_ops_per_ip_minute:
            raise HTTPException(
                429,
                f"Too many PDF requests. Limit is {settings.pdf_ops_per_ip_minute} per minute.",
                headers={"Retry-After": "60"},
            )
        _pdf_ops_minute[ip] = bucket
    return ip


def record_pdf_op(ip: str) -> None:
    with _lock:
        _pdf_ops_minute[ip].append(datetime.utcnow())


def check_extract_allowed(request: Request) -> str:
    """Call before Anthropic-backed extract/export. Returns client IP."""
    _check_demo_token(request)
    ip = client_ip(request)
    today = _today()

    with _lock:
        hourly = _prune_hourly(_extract_hour[ip], timedelta(hours=1))
        if len(hourly) >= settings.extract_per_ip_hour:
            raise HTTPException(
                429,
                f"Extraction limit reached ({settings.extract_per_ip_hour}/hour). "
                "This is a demo — try again later.",
                headers={"Retry-After": "3600"},
            )

        ip_day_count = _extract_day[(ip, today)]
        if ip_day_count >= settings.extract_per_ip_day:
            raise HTTPException(
                429,
                f"Daily extraction limit reached ({settings.extract_per_ip_day}/day). "
                "This is a demo — try again tomorrow.",
                headers={"Retry-After": "86400"},
            )

        global_day_count = _global_extract_day[today]
        if global_day_count >= settings.extract_global_daily:
            raise HTTPException(
                503,
                "Demo extraction capacity reached for today. Please try again tomorrow.",
                headers={"Retry-After": "86400"},
            )

        _extract_hour[ip] = hourly

    return ip


def record_extract(ip: str) -> None:
    today = _today()
    with _lock:
        _extract_hour[ip].append(datetime.utcnow())
        _extract_day[(ip, today)] += 1
        _global_extract_day[today] += 1


def usage_snapshot() -> dict:
    today = _today()
    with _lock:
        return {
            "date": today.isoformat(),
            "global_extracts_today": _global_extract_day[today],
            "global_daily_limit": settings.extract_global_daily,
            "extract_per_ip_hour": settings.extract_per_ip_hour,
            "extract_per_ip_day": settings.extract_per_ip_day,
        }
