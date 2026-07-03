import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.guardrails import (
    check_extract_allowed,
    check_pdf_op_allowed,
    client_ip,
    record_extract,
    record_pdf_op,
    validate_page_count,
    validate_pdf_bytes,
)
from app.config import settings


def _request(headers: dict | None = None, host: str = "127.0.0.1") -> Request:
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/",
        "headers": [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()],
        "client": (host, 12345),
    }
    return Request(scope)


def test_client_ip_uses_x_forwarded_for():
    req = _request({"X-Forwarded-For": "203.0.113.1, 10.0.0.1"})
    assert client_ip(req) == "203.0.113.1"


def test_validate_pdf_bytes_rejects_non_pdf():
    with pytest.raises(HTTPException) as exc:
        validate_pdf_bytes(b"not a pdf")
    assert exc.value.status_code == 400


def test_validate_pdf_bytes_accepts_pdf_header():
    validate_pdf_bytes(b"%PDF-1.4 minimal")


def test_validate_pdf_bytes_rejects_oversized(monkeypatch):
    monkeypatch.setattr(settings, "max_pdf_bytes", 10)
    with pytest.raises(HTTPException) as exc:
        validate_pdf_bytes(b"%PDF-123456789")
    assert exc.value.status_code == 413


def test_validate_page_count_rejects_too_many(monkeypatch):
    monkeypatch.setattr(settings, "max_pdf_pages", 5)
    with pytest.raises(HTTPException) as exc:
        validate_page_count(6)
    assert exc.value.status_code == 400


def test_pdf_op_rate_limit(monkeypatch):
    monkeypatch.setattr(settings, "pdf_ops_per_ip_minute", 2)
    req = _request()
    ip = check_pdf_op_allowed(req)
    record_pdf_op(ip)
    check_pdf_op_allowed(req)
    record_pdf_op(ip)
    with pytest.raises(HTTPException) as exc:
        check_pdf_op_allowed(req)
    assert exc.value.status_code == 429


def test_extract_hourly_rate_limit(monkeypatch):
    monkeypatch.setattr(settings, "extract_per_ip_hour", 1)
    monkeypatch.setattr(settings, "extract_per_ip_day", 100)
    monkeypatch.setattr(settings, "extract_global_daily", 100)
    req = _request()
    ip = check_extract_allowed(req)
    record_extract(ip)
    with pytest.raises(HTTPException) as exc:
        check_extract_allowed(req)
    assert exc.value.status_code == 429


def test_demo_token_required_when_configured(monkeypatch):
    monkeypatch.setattr(settings, "demo_access_token", "secret-token")
    req = _request()
    with pytest.raises(HTTPException) as exc:
        check_extract_allowed(req)
    assert exc.value.status_code == 403

    req_ok = _request({"X-Demo-Token": "secret-token"})
    check_extract_allowed(req_ok)
