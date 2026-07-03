"""Tests for eval scoring (no API calls)."""

from app.models import FootingRow, FootingSchedule
from eval.scoring import score_case


def test_portland_golden_passes():
    schedule = FootingSchedule(
        footings=[
            FootingRow(mark="1", length_ft=2.833, width_ft=1.583, depth_ft=1.5),
            FootingRow(mark="2", length_ft=2.833, width_ft=1.583, depth_ft=1.5),
            FootingRow(mark="3", length_ft=2.833, width_ft=1.583, depth_ft=1.5),
            FootingRow(mark="4", length_ft=4.667, width_ft=1.75, depth_ft=1.75),
            FootingRow(mark="5", length_ft=6.667, width_ft=1.75, depth_ft=1.75),
        ],
    )
    expect = {
        "footing_count": 5,
        "total_cy": 2.04,
        "total_cy_tolerance": 0.05,
        "rows": [
            {"mark": "1", "length_ft": 2.833, "width_ft": 1.583, "depth_ft": 1.5, "dim_tolerance": 0.02},
        ],
    }
    result = score_case("portland-partial", schedule, expect)
    assert result.passed
    assert result.score >= 0.9


def test_empty_schedule_with_notes_passes():
    schedule = FootingSchedule(
        footings=[],
        notes=["No footing schedule on this sheet."],
    )
    expect = {"footing_count": 0, "require_notes": True}
    result = score_case("medstar-empty", schedule, expect)
    assert result.passed


def test_wrong_count_fails():
    schedule = FootingSchedule(
        footings=[FootingRow(mark="F1", length_ft=4, width_ft=4, depth_ft=1)],
    )
    expect = {"footing_count": 3}
    result = score_case("bad-count", schedule, expect)
    assert not result.passed
    assert "footing count" in result.errors[0]
