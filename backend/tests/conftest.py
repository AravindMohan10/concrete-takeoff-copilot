from pathlib import Path

import pytest

from app.guardrails import reset_guardrails_for_tests


@pytest.fixture(autouse=True)
def _reset_guardrails():
    reset_guardrails_for_tests()
    yield
    reset_guardrails_for_tests()


@pytest.fixture
def sample_pdf_bytes() -> bytes:
    pdf_path = Path(__file__).resolve().parents[2] / "samples" / "huntsville-sam-houston-s400.pdf"
    return pdf_path.read_bytes()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)
