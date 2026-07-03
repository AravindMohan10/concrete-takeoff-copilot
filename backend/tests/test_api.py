from unittest.mock import patch

from app.models import FootingRow, FootingSchedule


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_root(client):
    data = client.get("/").json()
    assert data["status"] == "ok"
    assert data["app"] == "Concrete Takeoff Copilot"


def test_usage(client):
    data = client.get("/api/usage").json()
    assert "global_extracts_today" in data
    assert "global_daily_limit" in data


def test_pdf_info(client, sample_pdf_bytes: bytes):
    res = client.post(
        "/api/pdf/info",
        files={"file": ("test.pdf", sample_pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["page_count"] == 1
    assert data["filename"] == "test.pdf"


def test_pdf_info_rejects_non_pdf(client):
    res = client.post(
        "/api/pdf/info",
        files={"file": ("bad.txt", b"hello", "text/plain")},
    )
    assert res.status_code == 400


def test_pdf_render(client, sample_pdf_bytes: bytes):
    res = client.post(
        "/api/pdf/render",
        data={"page": "0"},
        files={"file": ("test.pdf", sample_pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 0
    assert len(data["image"]) > 100


@patch("app.main.extract_footing_schedule_from_pdf")
def test_extract_footing_schedule(mock_extract, client, sample_pdf_bytes: bytes):
    mock_extract.return_value = FootingSchedule(
        footings=[FootingRow(mark="F1", length_ft=4, width_ft=4, depth_ft=1)],
        confidence="high",
        model_used="claude-haiku-4-5-20251001",
        extraction_tier="fast",
    )
    res = client.post(
        "/api/extract/footing-schedule",
        data={"page": "0"},
        files={"file": ("test.pdf", sample_pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["footings"][0]["mark"] == "F1"
    assert data["footings"][0]["volume_cy"] == 0.59
    mock_extract.assert_called_once()


@patch("app.main.extract_footing_schedule_from_pdf")
def test_export_csv(mock_extract, client, sample_pdf_bytes: bytes):
    mock_extract.return_value = FootingSchedule(
        footings=[FootingRow(mark="F1", length_ft=4, width_ft=4, depth_ft=1)],
        confidence="high",
    )
    res = client.post(
        "/api/export/csv",
        data={"page": "0"},
        files={"file": ("test.pdf", sample_pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "F1," in res.text and "0.59," in res.text
