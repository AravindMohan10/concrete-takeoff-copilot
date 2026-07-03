"""Score extraction output against golden expected values."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.models import FootingRow, FootingSchedule


def normalize_mark(mark: str) -> str:
    return mark.strip().upper().replace("-", "").replace(" ", "")


def _find_row(schedule: FootingSchedule, mark: str) -> FootingRow | None:
    target = normalize_mark(mark)
    for row in schedule.footings:
        if normalize_mark(row.mark) == target:
            return row
    return None


def _close(a: float, b: float, tol: float) -> bool:
    return abs(a - b) <= tol


@dataclass
class CaseResult:
    case_id: str
    passed: bool
    score: float
    checks: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def add_pass(self, msg: str) -> None:
        self.checks.append(f"✓ {msg}")

    def add_fail(self, msg: str) -> None:
        self.errors.append(msg)
        self.passed = False


def score_case(case_id: str, schedule: FootingSchedule, expect: dict) -> CaseResult:
    result = CaseResult(case_id=case_id, passed=True, score=0.0)
    total_points = 0
    earned = 0

    footings = schedule.footings
    n = len(footings)

    if "footing_count" in expect:
        total_points += 1
        expected_n = expect["footing_count"]
        if n == expected_n:
            earned += 1
            result.add_pass(f"footing count = {expected_n}")
        else:
            result.add_fail(f"footing count: expected {expected_n}, got {n}")

    if "min_footings" in expect:
        total_points += 1
        if n >= expect["min_footings"]:
            earned += 1
            result.add_pass(f"footings >= {expect['min_footings']}")
        else:
            result.add_fail(f"footings: expected >= {expect['min_footings']}, got {n}")

    if "max_footings" in expect:
        total_points += 1
        if n <= expect["max_footings"]:
            earned += 1
            result.add_pass(f"footings <= {expect['max_footings']}")
        else:
            result.add_fail(f"footings: expected <= {expect['max_footings']}, got {n}")

    if "required_marks" in expect:
        found = {normalize_mark(r.mark) for r in footings}
        for mark in expect["required_marks"]:
            total_points += 1
            if normalize_mark(mark) in found:
                earned += 1
                result.add_pass(f"mark {mark} present")
            else:
                result.add_fail(f"missing mark {mark} (have {sorted(found)})")

    if "total_cy" in expect:
        total_points += 1
        tol = expect.get("total_cy_tolerance", 0.05)
        actual = round(sum(f.volume_cy for f in footings), 2)
        expected = expect["total_cy"]
        if _close(actual, expected, tol):
            earned += 1
            result.add_pass(f"total CY = {actual} (expected {expected})")
        else:
            result.add_fail(f"total CY: expected {expected} ±{tol}, got {actual}")

    if expect.get("require_notes") and n == 0:
        total_points += 1
        if schedule.notes:
            earned += 1
            result.add_pass("notes explain empty schedule")
        else:
            result.add_fail("expected notes when no footings found")

    for row_spec in expect.get("rows", []):
        mark = row_spec["mark"]
        tol = row_spec.get("dim_tolerance", 0.05)
        total_points += 4  # found + L + W + D
        row = _find_row(schedule, mark)
        if row is None:
            result.add_fail(f"row {mark} not found")
            continue
        earned += 1
        result.add_pass(f"row {mark} found")
        for dim, key in [("length", "length_ft"), ("width", "width_ft"), ("depth", "depth_ft")]:
            exp = row_spec[key]
            got = getattr(row, key)
            if _close(got, exp, tol):
                earned += 1
                result.add_pass(f"{mark} {dim} = {got}")
            else:
                result.add_fail(f"{mark} {dim}: expected {exp} ±{tol}, got {got}")

    result.score = earned / total_points if total_points else 1.0
    if result.errors:
        result.passed = False
    return result
